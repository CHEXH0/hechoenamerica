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
    
    // Convert hex public key to bytes
    const keyBytes = new Uint8Array(publicKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    
    // Convert hex signature to bytes
    const signatureBytes = new Uint8Array(signature.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    
    // Import the public key
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'Ed25519', namedCurve: 'Ed25519' },
      false,
      ['verify']
    );
    
    // Verify the signature
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

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const publicKey = Deno.env.get('DISCORD_PUBLIC_KEY');
    
    if (!publicKey) {
      console.error('DISCORD_PUBLIC_KEY not configured');
      return new Response('Server configuration error', { status: 500 });
    }

    // Get signature headers
    const signature = req.headers.get('x-signature-ed25519');
    const timestamp = req.headers.get('x-signature-timestamp');
    
    if (!signature || !timestamp) {
      console.error('Missing signature headers');
      return new Response('Missing signature', { status: 401 });
    }

    // Read body as text for verification
    const bodyText = await req.text();
    
    // Verify the signature
    const isValid = await verifyDiscordSignature(publicKey, signature, timestamp, bodyText);
    
    if (!isValid) {
      console.error('Invalid signature');
      return new Response('Invalid signature', { status: 401 });
    }

    // Parse the interaction
    const interaction = JSON.parse(bodyText);
    console.log('Received Discord interaction:', JSON.stringify(interaction, null, 2));

    // Handle PING (required for Discord to verify endpoint)
    if (interaction.type === 1) {
      console.log('Responding to PING');
      return new Response(JSON.stringify({ type: 1 }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle button interactions (type 3 = MESSAGE_COMPONENT)
    if (interaction.type === 3) {
      const customId = interaction.data?.custom_id;
      console.log('Button clicked:', customId);

      if (!customId) {
        return new Response(JSON.stringify({
          type: 4,
          data: { content: '❌ Invalid interaction', flags: 64 }
        }), { headers: { 'Content-Type': 'application/json' } });
      }

      // Parse custom_id format: "action_requestId" e.g., "accept_abc123" or "decline_abc123"
      const [action, requestId] = customId.split('_');
      
      if (!requestId || !['accept', 'decline'].includes(action)) {
        return new Response(JSON.stringify({
          type: 4,
          data: { content: '❌ Invalid action', flags: 64 }
        }), { headers: { 'Content-Type': 'application/json' } });
      }

      // Initialize Supabase
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Get the Discord user who clicked
      const discordUser = interaction.member?.user || interaction.user;
      const discordUsername = discordUser?.username || 'Unknown';
      const discordUserId = discordUser?.id;

      console.log(`User ${discordUsername} (${discordUserId}) is ${action}ing request ${requestId}`);

      // Look up the producer by their Discord user ID
      const { data: clickingProducer, error: producerLookupError } = await supabase
        .from('producers')
        .select('id, name, email')
        .eq('discord_user_id', discordUserId)
        .maybeSingle();

      if (producerLookupError) {
        console.error('Error looking up producer by Discord ID:', producerLookupError);
      }

      // Log whether we found a matching producer
      if (clickingProducer) {
        console.log(`Discord user ${discordUsername} is linked to producer: ${clickingProducer.name} (${clickingProducer.id})`);
      } else {
        console.log(`Discord user ${discordUsername} is not linked to any producer in the database`);
      }

      // Fetch the song request
      const { data: songRequest, error: fetchError } = await supabase
        .from('song_requests')
        .select('*, producers(*)')
        .eq('id', requestId)
        .single();

      if (fetchError || !songRequest) {
        console.error('Error fetching request:', fetchError);
        return new Response(JSON.stringify({
          type: 4,
          data: { content: `❌ Project not found: \`${requestId.substring(0, 8)}...\``, flags: 64 }
        }), { headers: { 'Content-Type': 'application/json' } });
      }

      // Check if already accepted
      if (songRequest.status === 'accepted' || songRequest.status === 'in_progress') {
        return new Response(JSON.stringify({
          type: 4,
          data: { 
            content: `⚠️ This project has already been accepted and is ${songRequest.status === 'in_progress' ? 'in progress' : 'accepted'}.`,
            flags: 64 
          }
        }), { headers: { 'Content-Type': 'application/json' } });
      }

      if (action === 'accept') {
        // Check if the clicking user is a registered producer
        if (!clickingProducer) {
          return new Response(JSON.stringify({
            type: 4,
            data: { 
              content: `❌ You are not registered as a producer. Please contact an admin to link your Discord account.`,
              flags: 64 
            }
          }), { headers: { 'Content-Type': 'application/json' } });
        }

        // Update status to accepted AND assign the producer who clicked
        const { error: updateError } = await supabase
          .from('song_requests')
          .update({ 
            status: 'accepted',
            assigned_producer_id: clickingProducer.id, // Assign the producer who accepted
            updated_at: new Date().toISOString()
          })
          .eq('id', requestId);

        if (updateError) {
          console.error('Error updating request:', updateError);
          return new Response(JSON.stringify({
            type: 4,
            data: { content: '❌ Failed to accept project. Please try again.', flags: 64 }
          }), { headers: { 'Content-Type': 'application/json' } });
        }
        
        console.log(`Producer ${clickingProducer.name} (${clickingProducer.id}) assigned to request ${requestId}`);

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

        // Send producer files email - use the clicking producer if linked, otherwise use assigned producer
        const emailProducerId = clickingProducer?.id || songRequest.assigned_producer_id;
        if (emailProducerId) {
          try {
            await supabase.functions.invoke('send-producer-files-email', {
              body: { 
                requestId,
                producerId: emailProducerId
              }
            });
            console.log(`Producer files email sent to producer ${emailProducerId}`);
          } catch (emailError) {
            console.error('Failed to send producer files:', emailError);
          }
        }

        // Return success message - UPDATE the original message
        return new Response(JSON.stringify({
          type: 7, // UPDATE_MESSAGE
          data: {
            content: `✅ **Project Accepted!** by <@${discordUserId}>`,
            embeds: interaction.message?.embeds || [],
            components: [] // Remove buttons after action
          }
        }), { headers: { 'Content-Type': 'application/json' } });

      } else if (action === 'decline') {
        // Update status to show declined - remove producer assignment
        const { error: updateError } = await supabase
          .from('song_requests')
          .update({ 
            assigned_producer_id: null,
            status: 'paid', // Reset to paid so it can be reassigned
            updated_at: new Date().toISOString()
          })
          .eq('id', requestId);

        if (updateError) {
          console.error('Error declining request:', updateError);
          return new Response(JSON.stringify({
            type: 4,
            data: { content: '❌ Failed to decline project. Please try again.', flags: 64 }
          }), { headers: { 'Content-Type': 'application/json' } });
        }

        // Return decline message - UPDATE the original message
        return new Response(JSON.stringify({
          type: 7, // UPDATE_MESSAGE
          data: {
            content: `⏸️ **Project Declined** by <@${discordUserId}> — awaiting new producer assignment`,
            embeds: interaction.message?.embeds || [],
            components: [] // Remove buttons after action
          }
        }), { headers: { 'Content-Type': 'application/json' } });
      }
    }

    // Default response for unhandled interaction types
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
