import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AssignmentNotificationRequest {
  requestId: string;
  producerId: string;
}

const APP_URL = 'https://eapbuoqkhckqaswfjexv.lovableproject.com';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { requestId, producerId }: AssignmentNotificationRequest = await req.json();
    
    console.log('Sending producer assignment notification:', { requestId, producerId });

    // Fetch producer details
    const { data: producer, error: producerError } = await supabase
      .from('producers')
      .select('*')
      .eq('id', producerId)
      .single();

    if (producerError || !producer) {
      console.error('Error fetching producer:', producerError);
      throw new Error('Producer not found');
    }

    if (!producer.email) {
      console.log('Producer has no email configured, skipping notification');
      return new Response(
        JSON.stringify({ success: false, message: 'Producer has no email configured' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Fetch song request details
    const { data: songRequest, error: requestError } = await supabase
      .from('song_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !songRequest) {
      console.error('Error fetching song request:', requestError);
      throw new Error('Song request not found');
    }

    // Build add-ons list
    const addOns = [];
    if (songRequest.wants_mixing) addOns.push('Mixing');
    if (songRequest.wants_mastering) addOns.push('Mastering');
    if (songRequest.wants_analog) addOns.push('Analog Processing');
    if (songRequest.wants_recorded_stems) addOns.push('Recorded Stems');
    if (songRequest.number_of_revisions > 0) addOns.push(`${songRequest.number_of_revisions} Revisions`);

    // Send email notification
    const emailResponse = await resend.emails.send({
      from: "HEA Music <onboarding@resend.dev>",
      to: [producer.email],
      subject: `🎵 New Project Assigned: ${songRequest.tier.toUpperCase()} Song Request`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #7C3AED; margin: 0;">🎵 New Project Assigned!</h1>
            <p style="color: #666; margin-top: 10px;">Hey ${producer.name}, you've been assigned a new song production project.</p>
          </div>

          <div style="background: linear-gradient(135deg, #7C3AED 0%, #9333EA 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; color: white;">
            <h2 style="margin: 0 0 16px 0; font-size: 24px;">${songRequest.tier.toUpperCase()} Tier</h2>
            <p style="margin: 0; font-size: 18px; opacity: 0.9;">💰 ${songRequest.price}</p>
          </div>

          <div style="background: #f8f9fa; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h3 style="color: #7C3AED; margin: 0 0 16px 0;">📋 Project Details</h3>
            
            <div style="margin-bottom: 16px;">
              <strong style="color: #666;">Genre:</strong>
              <span style="margin-left: 8px;">${songRequest.genre_category || 'Not specified'}</span>
            </div>
            
            <div style="margin-bottom: 16px;">
              <strong style="color: #666;">Customer Email:</strong>
              <span style="margin-left: 8px;">${songRequest.user_email}</span>
            </div>
            
            <div style="margin-bottom: 16px;">
              <strong style="color: #666;">Song Idea:</strong>
              <p style="background: white; padding: 16px; border-radius: 8px; margin: 8px 0 0 0; border-left: 4px solid #7C3AED;">
                ${songRequest.song_idea}
              </p>
            </div>

            ${addOns.length > 0 ? `
            <div style="margin-bottom: 16px;">
              <strong style="color: #666;">Add-ons:</strong>
              <div style="margin-top: 8px;">
                ${addOns.map(addon => `<span style="display: inline-block; background: #7C3AED; color: white; padding: 4px 12px; border-radius: 20px; margin: 4px 4px 4px 0; font-size: 14px;">✓ ${addon}</span>`).join('')}
              </div>
            </div>
            ` : ''}

            ${songRequest.file_urls && songRequest.file_urls.length > 0 ? `
            <div>
              <strong style="color: #666;">📎 Attached Files:</strong>
              <span style="margin-left: 8px;">${songRequest.file_urls.length} file(s)</span>
            </div>
            ` : ''}
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${APP_URL}/admin" style="display: inline-block; background: linear-gradient(135deg, #7C3AED 0%, #9333EA 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px;">
              View Project Details →
            </a>
          </div>

          <div style="border-top: 1px solid #eee; padding-top: 24px; text-align: center; color: #999; font-size: 14px;">
            <p style="margin: 0;">This is an automated notification from HEA Music.</p>
            <p style="margin: 8px 0 0 0;">Log in to your producer dashboard to manage this project.</p>
          </div>

        </body>
        </html>
      `,
    });

    console.log("Producer notification email sent successfully:", emailResponse);

    // Also send Discord notification
    try {
      const webhookUrl = Deno.env.get('DISCORD_WEBHOOK_URL');
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `🎧 **${producer.name}** has been assigned to a ${songRequest.tier.toUpperCase()} project!`,
            embeds: [{
              title: "🎧 Producer Assigned",
              color: 0x2ECC71,
              fields: [
                { name: "Producer", value: producer.name, inline: true },
                { name: "Tier", value: songRequest.tier.toUpperCase(), inline: true },
                { name: "Genre", value: songRequest.genre_category || 'Not specified', inline: true },
                { name: "🔗 Quick Actions", value: `[View in Admin Dashboard](${APP_URL}/admin)`, inline: false }
              ],
              timestamp: new Date().toISOString()
            }]
          })
        });
        console.log("Discord notification sent for producer assignment");
      }
    } catch (discordError) {
      console.error("Discord notification failed:", discordError);
      // Don't fail the whole operation
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Producer notification sent' }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in notify-producer-assignment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});