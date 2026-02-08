import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StatusNotificationRequest {
  requestId: string;
  oldStatus: string;
  newStatus: string;
  driveLink?: string;
}

const APP_URL = 'https://hechoenamericastudio.com';

// Status display info
const statusInfo: Record<string, { emoji: string; title: string; description: string; color: string }> = {
  'accepted': {
    emoji: '🤝',
    title: 'Project Accepted!',
    description: 'Great news! A producer has accepted your project and will begin working on it soon.',
    color: '#14B8A6'
  },
  'in_progress': {
    emoji: '🎹',
    title: 'Work in Progress',
    description: 'Your song is actively being produced! Our team is crafting your vision into reality.',
    color: '#8B5CF6'
  },
  'review': {
    emoji: '👀',
    title: 'Under Review',
    description: 'Your project is being reviewed for quality assurance before delivery.',
    color: '#06B6D4'
  },
  'completed': {
    emoji: '🎉',
    title: 'Project Completed!',
    description: 'Your song is ready! Click the button below to download your finished track from Google Drive.',
    color: '#10B981'
  },
  'revision': {
    emoji: '🔄',
    title: 'Revision in Progress',
    description: 'We\'re working on the requested changes to your project.',
    color: '#F59E0B'
  },
  'refunded': {
    emoji: '💸',
    title: 'Refund Processed',
    description: 'Your payment has been refunded. The funds will appear in your account within 5-10 business days.',
    color: '#EF4444'
  },
  'cancellation_requested': {
    emoji: '📋',
    title: 'Cancellation Under Review',
    description: 'We\'ve received your cancellation request and are reviewing it. We\'ll get back to you shortly.',
    color: '#F59E0B'
  }
};

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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { requestId, oldStatus, newStatus, driveLink }: StatusNotificationRequest = await req.json();
    
    console.log('Sending customer status notification:', { requestId, oldStatus, newStatus, driveLink });

    // Only send notifications for meaningful status changes
    const notifiableStatuses = ['accepted', 'in_progress', 'review', 'completed', 'revision', 'refunded', 'cancellation_requested'];
    if (!notifiableStatuses.includes(newStatus)) {
      console.log('Status not notifiable, skipping:', newStatus);
      return new Response(
        JSON.stringify({ success: false, message: 'Status change not notifiable' }),
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

    const status = statusInfo[newStatus] || {
      emoji: '📋',
      title: 'Status Updated',
      description: `Your project status has been updated to: ${newStatus}`,
      color: '#7C3AED'
    };

    const genreDisplay = genreDisplayNames[songRequest.genre_category] || songRequest.genre_category || 'Not specified';
    const formattedDate = new Date(songRequest.created_at).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    // Send email to customer
    const emailResponse = await resend.emails.send({
      from: "HEA Music <onboarding@resend.dev>",
      to: [songRequest.user_email],
      subject: `${status.emoji} ${status.title} - Your Song Project Update`,
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
            <div style="background: linear-gradient(135deg, ${status.color} 0%, ${status.color}dd 100%); padding: 40px 32px; text-align: center; color: white;">
              <div style="font-size: 48px; margin-bottom: 16px;">${status.emoji}</div>
              <h1 style="margin: 0 0 8px 0; font-size: 28px;">${status.title}</h1>
              <p style="margin: 0; opacity: 0.9; font-size: 16px;">${status.description}</p>
            </div>

            <!-- Project Summary -->
            <div style="padding: 24px; border-bottom: 1px solid #eee;">
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
                  <td style="padding: 8px 0; color: #666;">Submitted:</td>
                  <td style="padding: 8px 0;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Price:</td>
                  <td style="padding: 8px 0; font-weight: 600;">${songRequest.price}</td>
                </tr>
              </table>
            </div>

            <!-- Status Timeline -->
            <div style="padding: 24px; border-bottom: 1px solid #eee;">
              <h3 style="margin: 0 0 16px 0; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Status Update</h3>
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="background: #f0f0f0; padding: 8px 16px; border-radius: 20px; color: #999; text-decoration: line-through;">
                  ${oldStatus.replace('_', ' ')}
                </div>
                <div style="color: #ccc;">→</div>
                <div style="background: ${status.color}; color: white; padding: 8px 16px; border-radius: 20px; font-weight: 600;">
                  ${newStatus.replace('_', ' ')}
                </div>
              </div>
            </div>

            <!-- Song Idea Preview -->
            <div style="padding: 24px; border-bottom: 1px solid #eee;">
              <h3 style="margin: 0 0 12px 0; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Your Song Idea</h3>
              <div style="background: #f8f4ff; padding: 16px; border-radius: 8px; border-left: 4px solid #7C3AED;">
                <p style="margin: 0; color: #555;">${songRequest.song_idea.length > 200 ? songRequest.song_idea.substring(0, 200) + '...' : songRequest.song_idea}</p>
              </div>
            </div>

            <!-- CTA -->
            <div style="padding: 32px; text-align: center;">
              ${newStatus === 'completed' && driveLink ? `
                <a href="${driveLink}" style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-weight: bold; font-size: 18px; margin-bottom: 16px;">
                  📥 Download Your Song from Google Drive
                </a>
                <br><br>
                <a href="${APP_URL}/my-projects" style="display: inline-block; background: transparent; color: #7C3AED; text-decoration: underline; padding: 10px 24px; font-size: 14px;">
                  View All My Projects →
                </a>
                <p style="margin: 16px 0 0 0; color: #999; font-size: 14px;">
                  Your completed song is hosted on Google Drive for easy access
                </p>
              ` : `
                <a href="${APP_URL}/my-projects" style="display: inline-block; background: linear-gradient(135deg, #7C3AED 0%, #9333EA 100%); color: white; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  View My Projects →
                </a>
                <p style="margin: 16px 0 0 0; color: #999; font-size: 14px;">
                  Track all your projects and download completed songs
                </p>
              `}
            </div>

          </div>

          <!-- Footer -->
          <div style="text-align: center; padding: 24px; color: #999; font-size: 13px;">
            <p style="margin: 0 0 8px 0;">Questions? Reply to this email or contact us.</p>
            <p style="margin: 0;">HechoEnAmerica • LA MUSIC ES MEDICINA</p>
          </div>

        </body>
        </html>
      `,
    });

    console.log("Customer status notification sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: 'Customer notification sent' }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in notify-customer-status:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
