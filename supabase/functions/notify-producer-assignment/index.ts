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

// Genre display names
const genreDisplayNames: Record<string, string> = {
  'hip-hop': 'Hip Hop / Trap / Rap',
  'rnb': 'R&B / Soul',
  'reggae': 'Reggae / Dancehall',
  'latin': 'Latin / Reggaeton',
  'electronic': 'Electronic / EDM',
  'pop': 'Pop / Alternative',
  'rock': 'Rock / Indie',
  'world': 'World / Indigenous / Medicina',
  'other': 'Other / Mixed'
};

// Tier descriptions
const tierDescriptions: Record<string, string> = {
  '$25': 'Demo Project - 30 seconds',
  '$125': 'Artist-grade quality - 180 seconds',
  '$250': 'Industry standard - 300 seconds'
};

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
    if (songRequest.wants_mixing) addOns.push('Mixing Service');
    if (songRequest.wants_mastering) addOns.push('Mastering Service');
    if (songRequest.wants_analog) addOns.push('Analog Equipment');
    if (songRequest.wants_recorded_stems) addOns.push('Recorded Stems');
    if (songRequest.number_of_revisions > 0) addOns.push(`${songRequest.number_of_revisions} Revision(s)`);

    const genreDisplay = genreDisplayNames[songRequest.genre_category] || songRequest.genre_category || 'Not specified';
    const tierDescription = tierDescriptions[songRequest.tier] || songRequest.tier;
    const formattedDate = new Date(songRequest.created_at).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Send email notification - Basic, clean format for producer
    const emailResponse = await resend.emails.send({
      from: "HEA Music <onboarding@resend.dev>",
      to: [producer.email],
      subject: `🎵 New Project: ${songRequest.tier} - ${genreDisplay}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
          
          <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #7C3AED 0%, #9333EA 100%); padding: 32px; text-align: center; color: white;">
              <h1 style="margin: 0 0 8px 0; font-size: 28px;">New Project Assigned!</h1>
              <p style="margin: 0; opacity: 0.9; font-size: 16px;">Hey ${producer.name}, you have a new song to produce 🎧</p>
            </div>

            <!-- Quick Summary -->
            <div style="padding: 24px; border-bottom: 1px solid #eee;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; width: 120px;">Tier:</td>
                  <td style="padding: 8px 0; font-weight: 600;">${songRequest.tier} — ${tierDescription}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Genre:</td>
                  <td style="padding: 8px 0; font-weight: 600;">${genreDisplay}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Submitted:</td>
                  <td style="padding: 8px 0;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Customer:</td>
                  <td style="padding: 8px 0;">${songRequest.user_email}</td>
                </tr>
              </table>
            </div>

            <!-- Song Idea -->
            <div style="padding: 24px; border-bottom: 1px solid #eee;">
              <h3 style="margin: 0 0 12px 0; color: #7C3AED; font-size: 16px;">💡 Song Idea</h3>
              <div style="background: #f8f4ff; padding: 16px; border-radius: 8px; border-left: 4px solid #7C3AED;">
                <p style="margin: 0; white-space: pre-wrap;">${songRequest.song_idea}</p>
              </div>
            </div>

            ${addOns.length > 0 ? `
            <!-- Add-ons -->
            <div style="padding: 24px; border-bottom: 1px solid #eee;">
              <h3 style="margin: 0 0 12px 0; color: #7C3AED; font-size: 16px;">✨ Included Add-ons</h3>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${addOns.map(addon => `<span style="background: #7C3AED; color: white; padding: 6px 14px; border-radius: 20px; font-size: 14px;">✓ ${addon}</span>`).join('')}
              </div>
            </div>
            ` : ''}

            ${songRequest.file_urls && songRequest.file_urls.length > 0 ? `
            <!-- Files -->
            <div style="padding: 24px; border-bottom: 1px solid #eee;">
              <h3 style="margin: 0 0 12px 0; color: #7C3AED; font-size: 16px;">📎 Customer Files</h3>
              <p style="margin: 0; color: #666;">${songRequest.file_urls.length} file(s) attached — view in dashboard</p>
            </div>
            ` : ''}

            <!-- CTA -->
            <div style="padding: 32px; text-align: center;">
              <a href="${APP_URL}/admin" style="display: inline-block; background: linear-gradient(135deg, #7C3AED 0%, #9333EA 100%); color: white; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Open Project Dashboard →
              </a>
            </div>

          </div>

          <!-- Footer -->
          <div style="text-align: center; padding: 24px; color: #999; font-size: 13px;">
            <p style="margin: 0;">HechoEnAmerica • LA MUSIC ES MEDICINA</p>
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