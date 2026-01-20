import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendFilesEmailRequest {
  requestId: string;
  producerEmail: string;
  producerName: string;
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { requestId, producerEmail, producerName }: SendFilesEmailRequest = await req.json();
    
    console.log('Sending producer files email:', { requestId, producerEmail, producerName });

    if (!producerEmail) {
      console.log('Producer has no email, skipping');
      return new Response(
        JSON.stringify({ success: false, message: 'Producer email not provided' }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    // Check if there are files to send
    if (!songRequest.file_urls || songRequest.file_urls.length === 0) {
      console.log('No files attached to this request');
      return new Response(
        JSON.stringify({ success: false, message: 'No files attached to this request' }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const genreDisplay = genreDisplayNames[songRequest.genre_category] || songRequest.genre_category || 'Not specified';
    const formattedDate = new Date(songRequest.created_at).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Build file links HTML
    const fileLinksHtml = songRequest.file_urls.map((url: string, index: number) => {
      // Extract filename from URL
      const urlParts = url.split('/');
      const fileName = urlParts[urlParts.length - 1].split('?')[0];
      const displayName = decodeURIComponent(fileName) || `File ${index + 1}`;
      
      return `
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 20px;">📄</span>
              <span style="color: #333; font-size: 14px;">${displayName}</span>
            </div>
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0; text-align: right;">
            <a href="${url}" style="display: inline-block; background: #7C3AED; color: white; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 500;">
              Download
            </a>
          </td>
        </tr>
      `;
    }).join('');

    // Build add-ons list
    const addOns = [];
    if (songRequest.wants_mixing) addOns.push('Mixing');
    if (songRequest.wants_mastering) addOns.push('Mastering');
    if (songRequest.wants_analog) addOns.push('Analog');
    if (songRequest.wants_recorded_stems) addOns.push('Stems');
    if (songRequest.number_of_revisions > 0) addOns.push(`${songRequest.number_of_revisions} Revision(s)`);

    // Send email with file download links
    const emailResponse = await resend.emails.send({
      from: "HEA Music <onboarding@resend.dev>",
      to: [producerEmail],
      subject: `📥 Project Files Ready - ${songRequest.tier} ${genreDisplay}`,
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
            <div style="background: linear-gradient(135deg, #059669 0%, #10B981 100%); padding: 32px; text-align: center; color: white;">
              <h1 style="margin: 0 0 8px 0; font-size: 28px;">📥 Project Files Ready!</h1>
              <p style="margin: 0; opacity: 0.9; font-size: 16px;">Hey ${producerName}, here are the customer files for your project</p>
            </div>

            <!-- Project Summary -->
            <div style="padding: 24px; border-bottom: 1px solid #eee; background: #f8f9fa;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; color: #666; width: 100px;">Tier:</td>
                  <td style="padding: 6px 0; font-weight: 600;">${songRequest.tier}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666;">Genre:</td>
                  <td style="padding: 6px 0; font-weight: 600;">${genreDisplay}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666;">Customer:</td>
                  <td style="padding: 6px 0;">${songRequest.user_email}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666;">Submitted:</td>
                  <td style="padding: 6px 0;">${formattedDate}</td>
                </tr>
                ${addOns.length > 0 ? `
                <tr>
                  <td style="padding: 6px 0; color: #666;">Add-ons:</td>
                  <td style="padding: 6px 0;">${addOns.join(', ')}</td>
                </tr>
                ` : ''}
              </table>
            </div>

            <!-- Song Idea -->
            <div style="padding: 24px; border-bottom: 1px solid #eee;">
              <h3 style="margin: 0 0 12px 0; color: #059669; font-size: 16px;">💡 Song Idea</h3>
              <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; border-left: 4px solid #059669;">
                <p style="margin: 0; white-space: pre-wrap;">${songRequest.song_idea}</p>
              </div>
            </div>

            <!-- Download Files Section -->
            <div style="padding: 24px;">
              <h3 style="margin: 0 0 16px 0; color: #059669; font-size: 16px;">📎 Customer Files (${songRequest.file_urls.length})</h3>
              <table style="width: 100%; border-collapse: collapse; background: #fafafa; border-radius: 8px; overflow: hidden;">
                ${fileLinksHtml}
              </table>
              <p style="margin: 16px 0 0 0; font-size: 13px; color: #999; text-align: center;">
                ⏰ Download links are valid for 10 years
              </p>
            </div>

            <!-- CTA -->
            <div style="padding: 24px 32px 32px; text-align: center; background: #f8f9fa;">
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

    console.log("Producer files email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: 'Files email sent to producer' }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-producer-files-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
