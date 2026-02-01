import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APP_URL = 'https://hechoenamericastudio.com';

interface DeliveryRequest {
  requestId: string;
  downloadLink: string;
  customMessage: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { requestId, downloadLink, customMessage }: DeliveryRequest = await req.json();

    // Validate inputs
    if (!requestId || !downloadLink) {
      throw new Error('Missing required fields: requestId or downloadLink');
    }

    // Validate URL format
    try {
      new URL(downloadLink);
    } catch {
      throw new Error('Invalid download link URL');
    }

    console.log(`Sending delivery email for request: ${requestId}`);

    // Fetch the song request
    const { data: songRequest, error: fetchError } = await supabase
      .from('song_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !songRequest) {
      throw new Error('Song request not found');
    }

    // Get producer details
    const { data: producer, error: producerError } = await supabase
      .from('producers')
      .select('*')
      .eq('email', user.email)
      .single();

    if (producerError || !producer) {
      throw new Error('Producer profile not found');
    }

    // Get genre display name
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
    const genreDisplay = genreDisplayNames[songRequest.genre_category] || songRequest.genre_category || 'Custom';

    // Sanitize custom message (basic HTML escaping)
    const sanitizedMessage = customMessage
      ? customMessage
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>')
      : '';

    // Build social links for producer footer
    const socialLinks: string[] = [];
    if (producer.instagram_url) {
      socialLinks.push(`<a href="${producer.instagram_url}" style="color: #D946EF; text-decoration: none;">Instagram</a>`);
    }
    if (producer.spotify_url) {
      socialLinks.push(`<a href="${producer.spotify_url}" style="color: #D946EF; text-decoration: none;">Spotify</a>`);
    }
    if (producer.youtube_url || producer.youtube_channel_url) {
      socialLinks.push(`<a href="${producer.youtube_url || producer.youtube_channel_url}" style="color: #D946EF; text-decoration: none;">YouTube</a>`);
    }
    if (producer.website_url) {
      socialLinks.push(`<a href="${producer.website_url}" style="color: #D946EF; text-decoration: none;">Website</a>`);
    }

    // Send the branded delivery email
    await resend.emails.send({
      from: "HEA Music <team@hechoenamericastudio.com>",
      to: [songRequest.user_email],
      subject: `🎵 Your Song is Ready! - From ${producer.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #0a0a0a;">
          
          <div style="max-width: 600px; margin: 0 auto; background: #0a0a0a;">
            
            <!-- Header with Gradient -->
            <div style="background: linear-gradient(135deg, #7C3AED 0%, #DB2777 50%, #DC2626 100%); padding: 48px 32px; text-align: center;">
              <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: bold; color: white; letter-spacing: 2px;">
                HECHO EN AMÉRICA
              </h1>
              <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.8); letter-spacing: 3px; text-transform: uppercase;">
                LA MÚSICA ES MEDICINA
              </p>
            </div>

            <!-- Main Content -->
            <div style="padding: 40px 32px; background: #0a0a0a;">
              
              <!-- Celebration Header -->
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="font-size: 64px; margin-bottom: 16px;">🎉</div>
                <h2 style="margin: 0 0 8px 0; font-size: 28px; color: white;">Your Song is Ready!</h2>
                <p style="margin: 0; color: #a1a1aa; font-size: 16px;">
                  ${producer.name} has completed your project
                </p>
              </div>

              <!-- Project Details Card -->
              <div style="background: #18181b; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #27272a;">
                <h3 style="margin: 0 0 16px 0; font-size: 14px; color: #71717a; text-transform: uppercase; letter-spacing: 1px;">
                  Project Details
                </h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #a1a1aa; font-size: 14px;">Tier:</td>
                    <td style="padding: 8px 0; color: white; font-weight: 600; text-align: right;">${songRequest.tier}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #a1a1aa; font-size: 14px;">Genre:</td>
                    <td style="padding: 8px 0; color: white; font-weight: 600; text-align: right;">${genreDisplay}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #a1a1aa; font-size: 14px;">Producer:</td>
                    <td style="padding: 8px 0; color: white; font-weight: 600; text-align: right;">${producer.name}</td>
                  </tr>
                </table>
              </div>

              ${sanitizedMessage ? `
              <!-- Producer Message -->
              <div style="background: linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(219, 39, 119, 0.1) 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid rgba(124, 58, 237, 0.3);">
                <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #a855f7; text-transform: uppercase; letter-spacing: 1px;">
                  Message from ${producer.name}
                </h3>
                <p style="margin: 0; color: #e4e4e7; font-size: 15px; line-height: 1.6;">
                  ${sanitizedMessage}
                </p>
              </div>
              ` : ''}

              <!-- Download Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="${downloadLink}" style="display: inline-block; background: linear-gradient(135deg, #7C3AED 0%, #DB2777 100%); color: white; text-decoration: none; padding: 18px 48px; border-radius: 12px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 20px rgba(124, 58, 237, 0.4);">
                  📥 Download Your Song
                </a>
                <p style="margin: 16px 0 0 0; color: #71717a; font-size: 13px;">
                  Opens in Google Drive / Cloud Storage
                </p>
              </div>

              <!-- Song Idea Reminder -->
              <div style="background: #18181b; border-radius: 12px; padding: 20px; margin-bottom: 32px; border-left: 4px solid #7C3AED;">
                <h4 style="margin: 0 0 8px 0; font-size: 12px; color: #71717a; text-transform: uppercase; letter-spacing: 1px;">
                  Your Original Idea
                </h4>
                <p style="margin: 0; color: #d4d4d8; font-size: 14px; line-height: 1.5;">
                  ${songRequest.song_idea.length > 250 ? songRequest.song_idea.substring(0, 250) + '...' : songRequest.song_idea}
                </p>
              </div>

              <!-- View Projects Link -->
              <div style="text-align: center; margin-bottom: 32px;">
                <a href="${APP_URL}/my-projects" style="color: #a855f7; text-decoration: underline; font-size: 14px;">
                  View all my projects →
                </a>
              </div>

            </div>

            <!-- Producer Footer -->
            <div style="background: #18181b; padding: 32px; border-top: 1px solid #27272a;">
              <div style="text-align: center;">
                <img src="${producer.image}" alt="${producer.name}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin-bottom: 16px; border: 3px solid #7C3AED;">
                <h3 style="margin: 0 0 4px 0; color: white; font-size: 18px;">${producer.name}</h3>
                <p style="margin: 0 0 8px 0; color: #71717a; font-size: 14px;">
                  ${producer.genre} • ${producer.country}
                </p>
                ${socialLinks.length > 0 ? `
                <p style="margin: 12px 0 0 0; font-size: 14px;">
                  ${socialLinks.join(' • ')}
                </p>
                ` : ''}
              </div>
            </div>

            <!-- HEA Footer -->
            <div style="text-align: center; padding: 24px; background: #0a0a0a;">
              <p style="margin: 0 0 8px 0; color: #52525b; font-size: 12px;">
                Powered by HechoEnAmérica
              </p>
              <p style="margin: 0; color: #3f3f46; font-size: 11px;">
                Questions? Reply to this email or visit our website.
              </p>
            </div>

          </div>
        </body>
        </html>
      `,
    });

    console.log('Delivery email sent successfully');

    // Update song_request to completed
    const { error: updateError } = await supabase
      .from('song_requests')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (updateError) throw updateError;
    console.log('Song request marked as completed');

    // Create/update purchase record
    const { error: purchaseError } = await supabase
      .from('purchases')
      .upsert({
        user_id: songRequest.user_id,
        product_id: requestId,
        product_name: `Song Generation - ${songRequest.tier}`,
        product_type: 'song_generation',
        product_category: songRequest.tier,
        price: songRequest.price,
        status: 'ready',
        download_url: downloadLink,
        song_idea: songRequest.song_idea,
      }, {
        onConflict: 'product_id'
      });

    if (purchaseError) {
      console.error('Purchase upsert error:', purchaseError);
    }

    // Send Discord notification
    try {
      await supabase.functions.invoke('send-discord-notification', {
        body: {
          requestId,
          notificationType: 'file_delivered',
          driveLink: downloadLink,
        }
      });
    } catch (discordError) {
      console.error('Discord notification failed:', discordError);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Delivery email sent successfully',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in send-delivery-email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
