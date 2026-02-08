import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const APP_URL = 'https://hechoenamericastudio.com';

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[NOTIFY-CANCELLATION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is authenticated
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { requestId, reason } = await req.json();
    
    logStep("Processing cancellation notification", { requestId });

    if (!requestId) {
      throw new Error("Missing required field: requestId");
    }

    // Fetch the song request
    const { data: songRequest, error: fetchError } = await supabaseClient
      .from("song_requests")
      .select("*, producers:assigned_producer_id(id, name, email)")
      .eq("id", requestId)
      .single();

    if (fetchError || !songRequest) {
      throw new Error(`Song request not found: ${fetchError?.message}`);
    }

    // Verify user owns this request
    if (songRequest.user_id !== user.id) {
      throw new Error("Unauthorized - not your project");
    }

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const producerEmail = songRequest.producers?.email;
    const producerName = songRequest.producers?.name || "Producer";

    // 1. Confirmation email to customer
    try {
      await resend.emails.send({
        from: "HechoEnAmerica <team@hechoenamericastudio.com>",
        to: [songRequest.user_email],
        reply_to: "team@hechoenamericastudio.com",
        subject: "📋 Your Cancellation Request Has Been Submitted",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">📋 Cancellation Request Received</h1>
            </div>
            
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px;">Hi there,</p>
              
              <p style="font-size: 16px;">We've received your request to cancel your <strong>${songRequest.tier}</strong> song project.</p>
              
              <div style="background: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
                <h3 style="margin-top: 0; color: #92400E;">What Happens Next?</h3>
                <p style="margin: 0;">Our team will review your request and the producer's progress on your project. We'll get back to you within 24-48 hours with a decision regarding your cancellation and any applicable refund.</p>
              </div>
              
              <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Project:</strong> ${songRequest.tier} Song</p>
                <p style="margin: 4px 0;"><strong>Genre:</strong> ${songRequest.genre_category || 'Not specified'}</p>
                <p style="margin: 4px 0;"><strong>Price:</strong> ${songRequest.price}</p>
                ${reason ? `<p style="margin: 4px 0 0 0;"><strong>Your Reason:</strong> ${reason}</p>` : ''}
              </div>
              
              <p style="font-size: 14px; color: #6B7280;">
                <strong>Note:</strong> If significant work has already been completed on your project, a partial refund may be applied based on the producer's progress.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${APP_URL}/my-projects" 
                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  Track Your Request
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
              
              <p style="font-size: 14px; color: #888; text-align: center; margin: 0;">
                Questions? Reply to this email or contact us at team@hechoenamericastudio.com
              </p>
            </div>
          </body>
          </html>
        `,
      });
      logStep("Customer confirmation sent", { email: songRequest.user_email });
    } catch (emailError) {
      logStep("Failed to send customer email", { error: emailError });
    }

    // 2. Notification to producer (if assigned)
    if (producerEmail) {
      try {
        await resend.emails.send({
          from: "HechoEnAmerica <team@hechoenamericastudio.com>",
          to: [producerEmail],
          reply_to: "team@hechoenamericastudio.com",
          subject: "⚠️ Client Cancellation Request - Awaiting Review",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ Cancellation Request</h1>
              </div>
              
              <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px;">Hi ${producerName},</p>
                
                <p style="font-size: 16px;">A client has requested to cancel their project that you're working on.</p>
                
                <div style="background: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
                  <h3 style="margin-top: 0; color: #92400E;">Project Details</h3>
                  <p style="margin: 0;"><strong>Tier:</strong> ${songRequest.tier}</p>
                  <p style="margin: 4px 0;"><strong>Client:</strong> ${songRequest.user_email}</p>
                  <p style="margin: 4px 0 0 0;"><strong>Genre:</strong> ${songRequest.genre_category || 'Not specified'}</p>
                </div>
                
                <div style="background: #FEF2F2; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #EF4444;">
                  <p style="margin: 0; font-weight: bold;">⏸️ Please Pause Work</p>
                  <p style="margin: 8px 0 0 0; font-size: 14px;">We recommend pausing work on this project until the cancellation request is reviewed by our admin team. We'll notify you of the decision shortly.</p>
                </div>
                
                ${reason ? `
                  <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; font-weight: bold;">Client's Reason:</p>
                    <p style="margin: 8px 0 0 0;">${reason}</p>
                  </div>
                ` : ''}
                
                <p style="font-size: 14px; color: #6B7280;">
                  The admin team will review the request and consider your progress before making a decision.
                </p>
              </div>
            </body>
            </html>
          `,
        });
        logStep("Producer notified", { email: producerEmail });
      } catch (emailError) {
        logStep("Failed to send producer email", { error: emailError });
      }
    }

    // 3. Notification to HEA Team
    try {
      await resend.emails.send({
        from: "HechoEnAmerica System <team@hechoenamericastudio.com>",
        to: ["team@hechoenamericastudio.com"],
        reply_to: songRequest.user_email,
        subject: `🔔 NEW Cancellation Request: ${songRequest.tier} Project`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #F59E0B;">🔔 New Cancellation Request</h2>
            <p>A client has requested to cancel their project. Please review and process this request in the admin dashboard.</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Request ID:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${requestId}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Customer:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${songRequest.user_email}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Tier:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${songRequest.tier}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Price:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${songRequest.price}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Status Before:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${songRequest.status}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Producer:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${producerName} (${producerEmail || 'Not assigned'})</td>
              </tr>
            </table>
            
            ${reason ? `
              <div style="background: #FEF3C7; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold;">Client's Reason:</p>
                <p style="margin: 8px 0 0 0;">${reason}</p>
              </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${APP_URL}/admin" 
                 style="display: inline-block; background: #F59E0B; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Review in Admin Dashboard
              </a>
            </div>
          </body>
          </html>
        `,
      });
      logStep("HEA team notified");
    } catch (emailError) {
      logStep("Failed to send team email", { error: emailError });
    }

    // Send Discord notification
    try {
      await supabaseClient.functions.invoke("send-discord-notification", {
        body: {
          requestId: requestId,
          notificationType: "cancellation_requested",
          customerEmail: songRequest.user_email,
          tier: songRequest.tier,
          reason: reason || 'No reason provided',
        },
      });
    } catch (discordError) {
      logStep("Failed to send Discord notification", { error: discordError });
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Cancellation request notifications sent",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
