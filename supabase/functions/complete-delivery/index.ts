import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APP_URL = 'https://hechoenamericastudio.com';

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

    const { requestId, storagePath, fileName } = await req.json();

    if (!requestId || !storagePath) {
      throw new Error('Missing required fields: requestId or storagePath');
    }

    console.log(`Completing delivery for request: ${requestId}, file: ${fileName}`);

    // Fetch the song request with producer info
    const { data: songRequest, error: fetchError } = await supabase
      .from('song_requests')
      .select(`
        *,
        producer:producers!song_requests_assigned_producer_id_fkey (
          id, name, image, bio, country, genre,
          spotify_url, instagram_url, youtube_url, youtube_channel_url,
          apple_music_url, website_url
        )
      `)
      .eq('id', requestId)
      .single();

    if (fetchError || !songRequest) {
      throw new Error('Song request not found');
    }

    const producer = songRequest.producer;

    // Generate a signed URL for the file (valid for 7 days)
    const { data: signedUrlData, error: signedUrlError } = await supabase
      .storage
      .from('product-assets')
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7); // 7 days

    if (signedUrlError || !signedUrlData) {
      console.error('Error creating signed URL:', signedUrlError);
      throw new Error('Failed to generate download link');
    }

    const downloadUrl = signedUrlData.signedUrl;
    console.log('Generated signed URL for download');

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

    // Create/update purchase record with download link
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
        download_url: downloadUrl,
        song_idea: songRequest.song_idea,
      }, {
        onConflict: 'product_id'
      });

    if (purchaseError) {
      console.error('Purchase upsert error:', purchaseError);
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
    const genreDisplay = genreDisplayNames[songRequest.genre_category] || songRequest.genre_category || 'Not specified';

    // Build producer section HTML
    const producerImageUrl = producer?.image?.startsWith('http') 
      ? producer.image 
      : producer?.image 
        ? `${APP_URL}${producer.image}` 
        : null;

    const producerSocialLinks = [];
    if (producer?.spotify_url) producerSocialLinks.push(`<a href="${producer.spotify_url}" style="display: inline-block; margin: 0 8px; color: #1DB954; text-decoration: none; font-size: 14px;">🎧 Spotify</a>`);
    if (producer?.instagram_url) producerSocialLinks.push(`<a href="${producer.instagram_url}" style="display: inline-block; margin: 0 8px; color: #E4405F; text-decoration: none; font-size: 14px;">📸 Instagram</a>`);
    if (producer?.youtube_url || producer?.youtube_channel_url) producerSocialLinks.push(`<a href="${producer.youtube_url || producer.youtube_channel_url}" style="display: inline-block; margin: 0 8px; color: #FF0000; text-decoration: none; font-size: 14px;">▶️ YouTube</a>`);
    if (producer?.apple_music_url) producerSocialLinks.push(`<a href="${producer.apple_music_url}" style="display: inline-block; margin: 0 8px; color: #FA243C; text-decoration: none; font-size: 14px;">🍎 Apple Music</a>`);
    if (producer?.website_url) producerSocialLinks.push(`<a href="${producer.website_url}" style="display: inline-block; margin: 0 8px; color: #7C3AED; text-decoration: none; font-size: 14px;">🌐 Website</a>`);

    const producerSection = producer ? `
      <!-- Producer Spotlight -->
      <div style="padding: 32px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); text-align: center;">
        <p style="margin: 0 0 8px 0; color: #a0a0a0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Produced By</p>
        
        ${producerImageUrl ? `
          <div style="margin: 16px auto; width: 120px; height: 120px; border-radius: 50%; overflow: hidden; border: 4px solid #7C3AED; box-shadow: 0 8px 32px rgba(124, 58, 237, 0.4);">
            <img src="${producerImageUrl}" alt="${producer.name}" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
        ` : `
          <div style="margin: 16px auto; width: 120px; height: 120px; border-radius: 50%; background: linear-gradient(135deg, #7C3AED 0%, #9333EA 100%); display: flex; align-items: center; justify-content: center; border: 4px solid #7C3AED;">
            <span style="font-size: 48px; color: white;">🎵</span>
          </div>
        `}
        
        <h2 style="margin: 16px 0 8px 0; color: white; font-size: 28px; font-weight: 700;">${producer.name}</h2>
        
        <div style="margin: 8px 0 16px 0;">
          <span style="display: inline-block; background: rgba(124, 58, 237, 0.3); color: #c4b5fd; padding: 4px 12px; border-radius: 20px; font-size: 13px; margin: 4px;">
            🎸 ${producer.genre}
          </span>
          <span style="display: inline-block; background: rgba(124, 58, 237, 0.3); color: #c4b5fd; padding: 4px 12px; border-radius: 20px; font-size: 13px; margin: 4px;">
            📍 ${producer.country}
          </span>
        </div>
        
        ${producer.bio ? `
          <p style="margin: 16px auto; max-width: 400px; color: #d0d0d0; font-size: 14px; line-height: 1.6;">
            ${producer.bio.length > 150 ? producer.bio.substring(0, 150) + '...' : producer.bio}
          </p>
        ` : ''}
        
        ${producerSocialLinks.length > 0 ? `
          <div style="margin: 24px 0 8px 0; padding: 16px; background: rgba(255,255,255,0.05); border-radius: 12px;">
            <p style="margin: 0 0 12px 0; color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Follow & Support</p>
            <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 8px;">
              ${producerSocialLinks.join('')}
            </div>
          </div>
        ` : ''}
        
        <a href="${APP_URL}/producer/${producer.name.toLowerCase().replace(/\s+/g, '-')}" style="display: inline-block; margin-top: 16px; color: #a78bfa; text-decoration: underline; font-size: 13px;">
          View Full Profile →
        </a>
      </div>
    ` : '';

    // Send email to customer with download link
    await resend.emails.send({
      from: "HEA Music <team@hechoenamericastudio.com>",
      to: [songRequest.user_email],
      subject: producer ? `🎉 Your Song by ${producer.name} is Ready!` : "🎉 Your Song is Ready! - Download Now",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
          
          <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            
            <!-- HEA Logo Header -->
            <div style="background: #0a0a0a; padding: 20px; text-align: center;">
              <img src="${APP_URL}/laptop-uploads/HEA_White.png" alt="HechoEnAmerica" style="height: 50px; width: auto;" />
            </div>
            
            <!-- Success Header -->
            <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 40px 32px; text-align: center; color: white;">
              <div style="font-size: 64px; margin-bottom: 16px;">🎉</div>
              <h1 style="margin: 0 0 8px 0; font-size: 28px;">Your Song is Ready!</h1>
              <p style="margin: 0; opacity: 0.9; font-size: 16px;">Your vision has been brought to life</p>
            </div>

            ${producerSection}

            <!-- Download CTA -->
            <div style="padding: 40px 32px; text-align: center; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
              <a href="${downloadUrl}" style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; text-decoration: none; padding: 20px 48px; border-radius: 12px; font-weight: bold; font-size: 20px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);">
                📥 Download Your Song
              </a>
              <p style="margin: 20px 0 0 0; color: #666; font-size: 14px;">
                ⏰ This download link expires in <strong>7 days</strong>
              </p>
              <p style="margin: 8px 0 0 0; color: #999; font-size: 13px;">
                Save your file to your device before it expires
              </p>
            </div>

            <!-- Project Summary -->
            <div style="padding: 24px; border-top: 1px solid #eee;">
              <h3 style="margin: 0 0 16px 0; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Project Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; width: 100px;">Tier:</td>
                  <td style="padding: 8px 0; font-weight: 600;">${songRequest.tier}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Genre:</td>
                  <td style="padding: 8px 0; font-weight: 600;">${genreDisplay}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">File:</td>
                  <td style="padding: 8px 0; font-weight: 600;">${fileName || 'Your song file'}</td>
                </tr>
              </table>
            </div>

            <!-- Song Idea -->
            <div style="padding: 24px; border-top: 1px solid #eee;">
              <h3 style="margin: 0 0 12px 0; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Your Original Idea</h3>
              <div style="background: #f8f4ff; padding: 16px; border-radius: 8px; border-left: 4px solid #7C3AED;">
                <p style="margin: 0; color: #555;">${songRequest.song_idea.length > 200 ? songRequest.song_idea.substring(0, 200) + '...' : songRequest.song_idea}</p>
              </div>
            </div>

            <!-- View Projects -->
            <div style="padding: 24px; text-align: center; border-top: 1px solid #eee;">
              <a href="${APP_URL}/my-projects" style="color: #7C3AED; text-decoration: underline; font-size: 14px;">
                View all my projects →
              </a>
            </div>

          </div>

          <!-- Footer -->
          <div style="text-align: center; padding: 24px; color: #999; font-size: 13px;">
            <p style="margin: 0 0 8px 0;">Questions? Reply to this email or contact us.</p>
            <p style="margin: 0;">HechoEnAmerica • LA MÚSICA ES MEDICINA 🎶</p>
          </div>

        </body>
        </html>
      `,
    });

    console.log('Customer email sent with download link');

    // Send Discord notification
    try {
      await supabase.functions.invoke('send-discord-notification', {
        body: {
          requestId,
          notificationType: 'file_delivered',
        }
      });
    } catch (discordError) {
      console.error('Discord notification failed:', discordError);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Delivery completed and customer notified',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in complete-delivery:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
