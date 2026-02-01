import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature-ed25519, x-signature-timestamp',
};

// Verify Discord signature using Web Crypto API
async function verifyDiscordSignature(
  publicKey: string,
  signature: string,
  timestamp: string,
  body: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const message = encoder.encode(timestamp + body);
    
    const keyBytes = new Uint8Array(publicKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const signatureBytes = new Uint8Array(signature.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'Ed25519', namedCurve: 'Ed25519' },
      false,
      ['verify']
    );
    
    const isValid = await crypto.subtle.verify(
      { name: 'Ed25519' },
      cryptoKey,
      signatureBytes,
      message
    );
    
    return isValid;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

const APP_URL = 'https://eapbuoqkhckqaswfjexv.lovableproject.com';

// Helper to follow up on deferred interaction
async function followUpInteraction(
  applicationId: string,
  interactionToken: string,
  content: string,
  embeds: any[] = [],
  removeButtons: boolean = true
) {
  const url = `https://discord.com/api/v10/webhooks/${applicationId}/${interactionToken}/messages/@original`;
  
  const body: any = { content };
  if (embeds.length > 0) {
    body.embeds = embeds;
  }
  if (removeButtons) {
    body.components = [];
  }
  
  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  
  if (!response.ok) {
    console.error('Failed to follow up interaction:', await response.text());
  }
  
  return response.ok;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const publicKey = Deno.env.get('DISCORD_PUBLIC_KEY');
    
    if (!publicKey) {
      console.error('DISCORD_PUBLIC_KEY not configured');
      return new Response('Server configuration error', { status: 500 });
    }

    const signature = req.headers.get('x-signature-ed25519');
    const timestamp = req.headers.get('x-signature-timestamp');
    
    if (!signature || !timestamp) {
      console.error('Missing signature headers');
      return new Response('Missing signature', { status: 401 });
    }

    const bodyText = await req.text();
    const isValid = await verifyDiscordSignature(publicKey, signature, timestamp, bodyText);
    
    if (!isValid) {
      console.error('Invalid signature');
      return new Response('Invalid signature', { status: 401 });
    }

    const interaction = JSON.parse(bodyText);
    console.log('Received Discord interaction type:', interaction.type);

    // Handle PING
    if (interaction.type === 1) {
      console.log('Responding to PING');
      return new Response(JSON.stringify({ type: 1 }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle button interactions (type 3 = MESSAGE_COMPONENT)
    if (interaction.type === 3) {
      const customId = interaction.data?.custom_id;
      const applicationId = interaction.application_id;
      const interactionToken = interaction.token;
      
      console.log('Button clicked:', customId);

      if (!customId) {
        return new Response(JSON.stringify({
          type: 4,
          data: { content: '❌ Invalid interaction', flags: 64 }
        }), { headers: { 'Content-Type': 'application/json' } });
      }

      const [action, requestId] = customId.split('_');
      
      if (!requestId || !['accept', 'decline'].includes(action)) {
        return new Response(JSON.stringify({
          type: 4,
          data: { content: '❌ Invalid action', flags: 64 }
        }), { headers: { 'Content-Type': 'application/json' } });
      }

      // IMMEDIATELY respond with deferred update (type 6) - this prevents "interaction failed"
      // Discord requires a response within 3 seconds, so we defer and process in background
      const deferredResponse = new Response(JSON.stringify({ type: 6 }), {
        headers: { 'Content-Type': 'application/json' }
      });

      // Process the interaction in the background using EdgeRuntime.waitUntil pattern
      // Since Deno doesn't have waitUntil, we use a promise that we don't await on the response
      const processInteraction = async () => {
        try {
          const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
          const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
          const supabase = createClient(supabaseUrl, supabaseKey);

          const discordUser = interaction.member?.user || interaction.user;
          const discordUsername = discordUser?.username || 'Unknown';
          const discordUserId = discordUser?.id;

          console.log(`User ${discordUsername} (${discordUserId}) is ${action}ing request ${requestId}`);

          // Look up the producer by Discord user ID
          const { data: clickingProducer, error: producerLookupError } = await supabase
            .from('producers')
            .select('id, name, email')
            .eq('discord_user_id', discordUserId)
            .maybeSingle();

          if (producerLookupError) {
            console.error('Error looking up producer by Discord ID:', producerLookupError);
          }

          if (clickingProducer) {
            console.log(`Discord user ${discordUsername} linked to producer: ${clickingProducer.name}`);
          } else {
            console.log(`Discord user ${discordUsername} is not linked to any producer`);
          }

          // Fetch the song request
          const { data: songRequest, error: fetchError } = await supabase
            .from('song_requests')
            .select('*, producers(*)')
            .eq('id', requestId)
            .single();

          if (fetchError || !songRequest) {
            console.error('Error fetching request:', fetchError);
            await followUpInteraction(
              applicationId,
              interactionToken,
              `❌ Project not found: \`${requestId.substring(0, 8)}...\``,
              interaction.message?.embeds || [],
              false
            );
            return;
          }

          // Check if already accepted
          if (songRequest.status === 'accepted' || songRequest.status === 'in_progress') {
            const producerName = songRequest.producers?.name || 'another producer';
            await followUpInteraction(
              applicationId,
              interactionToken,
              `⚠️ This project has already been accepted by **${producerName}** and is ${songRequest.status === 'in_progress' ? 'in progress' : 'accepted'}.`,
              interaction.message?.embeds || [],
              true // Remove buttons since it's already handled
            );
            return;
          }

          if (action === 'accept') {
            // Check if the clicking user is a registered producer
            if (!clickingProducer) {
              await followUpInteraction(
                applicationId,
                interactionToken,
                `❌ <@${discordUserId}> You are not registered as a producer. Please contact an admin to link your Discord account.`,
                interaction.message?.embeds || [],
                false
              );
              return;
            }

            // Update status to accepted AND assign the producer
            const { error: updateError } = await supabase
              .from('song_requests')
              .update({ 
                status: 'accepted',
                assigned_producer_id: clickingProducer.id,
                updated_at: new Date().toISOString()
              })
              .eq('id', requestId)
              .eq('status', 'paid'); // Only update if still in 'paid' status (prevent race conditions)

            if (updateError) {
              console.error('Error updating request:', updateError);
              await followUpInteraction(
                applicationId,
                interactionToken,
                `❌ Failed to accept project. It may have already been claimed.`,
                interaction.message?.embeds || [],
                false
              );
              return;
            }
            
            console.log(`Producer ${clickingProducer.name} assigned to request ${requestId}`);

            // Update the Discord message first (fast feedback to user)
            await followUpInteraction(
              applicationId,
              interactionToken,
              `✅ **Project Accepted!** by **${clickingProducer.name}** (<@${discordUserId}>)`,
              interaction.message?.embeds || [],
              true
            );

            // Then trigger background notifications (these can take time)
            // Notify customer
            try {
              await supabase.functions.invoke('notify-customer-status', {
                body: { 
                  requestId, 
                  newStatus: 'accepted',
                  oldStatus: songRequest.status
                }
              });
            } catch (notifyError) {
              console.error('Failed to notify customer:', notifyError);
            }

            // Send producer files email
            try {
              await supabase.functions.invoke('send-producer-files-email', {
                body: { 
                  requestId,
                  producerId: clickingProducer.id
                }
              });
              console.log(`Producer files email sent to producer ${clickingProducer.id}`);
            } catch (emailError) {
              console.error('Failed to send producer files:', emailError);
            }

          } else if (action === 'decline') {
            // Update status - remove producer assignment
            const { error: updateError } = await supabase
              .from('song_requests')
              .update({ 
                assigned_producer_id: null,
                status: 'paid',
                updated_at: new Date().toISOString()
              })
              .eq('id', requestId);

            if (updateError) {
              console.error('Error declining request:', updateError);
              await followUpInteraction(
                applicationId,
                interactionToken,
                `❌ Failed to decline project. Please try again.`,
                interaction.message?.embeds || [],
                false
              );
              return;
            }

            await followUpInteraction(
              applicationId,
              interactionToken,
              `⏸️ **Project Declined** by <@${discordUserId}> — awaiting new producer assignment`,
              interaction.message?.embeds || [],
              true
            );
          }
        } catch (error) {
          console.error('Error processing interaction:', error);
          try {
            await followUpInteraction(
              applicationId,
              interactionToken,
              `❌ An error occurred processing your request.`,
              [],
              false
            );
          } catch (e) {
            console.error('Failed to send error follow-up:', e);
          }
        }
      };

      // Start processing but don't await - return deferred response immediately
      processInteraction().catch(err => console.error('Background processing error:', err));
      
      return deferredResponse;
    }

    // Default response
    return new Response(JSON.stringify({
      type: 4,
      data: { content: 'Interaction received', flags: 64 }
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error in discord-interactions:', error);
    return new Response(JSON.stringify({
      type: 4,
      data: { content: '❌ An error occurred processing your request.', flags: 64 }
    }), { headers: { 'Content-Type': 'application/json' } });
  }
});
