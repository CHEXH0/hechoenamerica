import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const BOOKING_URL = "https://calendar.app.google/TGGjqWJpCC64SsV59";

interface InterviewInviteRequest {
  applicantName: string;
  applicantEmail: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('Claims error:', claimsError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired token' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Check if user is admin
    const userId = claimsData.claims.sub as string;
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ success: false, error: 'Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const { applicantName, applicantEmail }: InterviewInviteRequest = await req.json();

    console.log(`Sending interview invite to ${applicantEmail} for ${applicantName}`);

    if (!applicantName || !applicantEmail) {
      throw new Error('Missing required fields: applicantName and applicantEmail');
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 40px 30px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
            .header p { color: #a0a0a0; margin: 10px 0 0; font-size: 14px; }
            .content { padding: 40px 30px; }
            .content h2 { color: #1a1a2e; margin: 0 0 20px; font-size: 22px; }
            .content p { margin: 0 0 20px; color: #555; }
            .button-container { text-align: center; margin: 30px 0; }
            .button { display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff !important; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; }
            .footer { background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #eee; }
            .footer p { margin: 0; color: #888; font-size: 12px; }
            .highlight { background-color: #f0f4ff; padding: 20px; border-radius: 8px; border-left: 4px solid #4f46e5; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎵 Hecho en América</h1>
              <p>Producer Interview Invitation</p>
            </div>
            <div class="content">
              <h2>Hello ${applicantName}! 👋</h2>
              <p>Thank you for your interest in joining our producer team at Hecho en América. We've reviewed your application and would love to schedule an interview with you!</p>
              
              <div class="highlight">
                <p style="margin: 0;"><strong>Next Step:</strong> Please select a time that works for you using the button below. The meeting will be conducted via Google Meet.</p>
              </div>
              
              <div class="button-container">
                <a href="${BOOKING_URL}" class="button">Schedule Your Interview</a>
              </div>
              
              <p>Once you book a time, you'll receive a calendar invite with the Google Meet link automatically.</p>
              
              <p>We look forward to speaking with you!</p>
              
              <p style="margin-top: 30px;">
                Best regards,<br>
                <strong>The Hecho en América Team</strong>
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Hecho en América. All rights reserved.</p>
              <p style="margin-top: 10px;">This email was sent regarding your producer application.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: 'Hecho en América <team@hechoenamericastudio.com>',
      to: [applicantEmail],
      subject: '🎤 Interview Invitation - Hecho en América Producer Application',
      html: emailHtml,
    });

    console.log('Interview invite email sent successfully:', emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: 'Interview invite sent successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Error sending interview invite:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
