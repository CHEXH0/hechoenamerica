import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RevisionNotificationRequest {
  requestId: string;
  revisionNumber: number;
  notificationType: "revision_requested" | "revision_delivered" | "feedback_submitted";
  clientNotes?: string;
  driveLink?: string;
  feedback?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-revision-notification function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { requestId, revisionNumber, notificationType, clientNotes, driveLink, feedback }: RevisionNotificationRequest = await req.json();

    console.log("Notification request:", { requestId, revisionNumber, notificationType });

    // Get the song request details
    const { data: songRequest, error: requestError } = await supabaseClient
      .from("song_requests")
      .select("*, producers!song_requests_assigned_producer_id_fkey(name, email)")
      .eq("id", requestId)
      .single();

    if (requestError || !songRequest) {
      console.error("Error fetching song request:", requestError);
      throw new Error("Song request not found");
    }

    let toEmail: string;
    let subject: string;
    let htmlContent: string;

    const producerName = songRequest.producers?.name || "Your Producer";
    const producerEmail = songRequest.producers?.email;
    const customerEmail = songRequest.user_email;

    switch (notificationType) {
      case "revision_requested":
        // Notify producer when client requests a revision
        if (!producerEmail) {
          throw new Error("Producer email not found");
        }
        toEmail = producerEmail;
        subject = `🔔 Revision ${revisionNumber} Requested - ${songRequest.tier} Song Project`;
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
              .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
              .card { background: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
              .header { text-align: center; margin-bottom: 24px; }
              .title { font-size: 24px; font-weight: 700; color: #1a1a2e; margin: 0; }
              .badge { display: inline-block; background: #fbbf24; color: #92400e; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 12px; }
              .content { color: #4b5563; line-height: 1.6; }
              .notes-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0; }
              .notes-label { font-weight: 600; color: #92400e; margin-bottom: 8px; }
              .cta { text-align: center; margin-top: 24px; }
              .button { display: inline-block; background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; }
              .footer { text-align: center; margin-top: 32px; color: #9ca3af; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="card">
                <div class="header">
                  <h1 class="title">Revision Requested</h1>
                  <span class="badge">Revision ${revisionNumber}</span>
                </div>
                <div class="content">
                  <p>Your client has requested <strong>Revision ${revisionNumber}</strong> for their ${songRequest.tier} song project.</p>
                  ${clientNotes ? `
                  <div class="notes-box">
                    <div class="notes-label">Client's Notes:</div>
                    <p style="margin: 0; color: #78350f;">${clientNotes}</p>
                  </div>
                  ` : ''}
                  <p>Please review the request and deliver the revision as soon as possible.</p>
                </div>
                <div class="cta">
                  <a href="https://hechoenamerica.lovable.app/my-projects" class="button">View Project</a>
                </div>
              </div>
              <div class="footer">
                <p>HechoEnAmerica Studio</p>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      case "revision_delivered":
        // Notify customer when producer delivers a revision
        toEmail = customerEmail;
        subject = `🎵 Revision ${revisionNumber} Delivered - Your Song Update is Ready!`;
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
              .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
              .card { background: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
              .header { text-align: center; margin-bottom: 24px; }
              .title { font-size: 24px; font-weight: 700; color: #1a1a2e; margin: 0; }
              .badge { display: inline-block; background: #10b981; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 12px; }
              .content { color: #4b5563; line-height: 1.6; }
              .cta { text-align: center; margin-top: 24px; }
              .button { display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; }
              .secondary-button { display: inline-block; background: #f3f4f6; color: #374151; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin-top: 12px; }
              .footer { text-align: center; margin-top: 32px; color: #9ca3af; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="card">
                <div class="header">
                  <h1 class="title">Revision ${revisionNumber} is Ready!</h1>
                  <span class="badge">✓ Delivered</span>
                </div>
                <div class="content">
                  <p>Great news! <strong>${producerName}</strong> has delivered <strong>Revision ${revisionNumber}</strong> for your ${songRequest.tier} song project.</p>
                  <p>Click below to download and review the updated version:</p>
                </div>
                <div class="cta">
                  ${driveLink ? `<a href="${driveLink}" class="button">Download Revision ${revisionNumber}</a><br>` : ''}
                  <a href="https://hechoenamerica.lovable.app/my-projects" class="secondary-button">View in Dashboard</a>
                </div>
              </div>
              <div class="footer">
                <p>HechoEnAmerica Studio</p>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      case "feedback_submitted":
        // Notify producer when client submits feedback
        if (!producerEmail) {
          throw new Error("Producer email not found");
        }
        toEmail = producerEmail;
        subject = `💬 Client Feedback on Revision ${revisionNumber}`;
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
              .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
              .card { background: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
              .header { text-align: center; margin-bottom: 24px; }
              .title { font-size: 24px; font-weight: 700; color: #1a1a2e; margin: 0; }
              .badge { display: inline-block; background: #3b82f6; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 12px; }
              .content { color: #4b5563; line-height: 1.6; }
              .feedback-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0; }
              .feedback-label { font-weight: 600; color: #1e40af; margin-bottom: 8px; }
              .cta { text-align: center; margin-top: 24px; }
              .button { display: inline-block; background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; }
              .footer { text-align: center; margin-top: 32px; color: #9ca3af; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="card">
                <div class="header">
                  <h1 class="title">Client Feedback Received</h1>
                  <span class="badge">Revision ${revisionNumber}</span>
                </div>
                <div class="content">
                  <p>Your client has submitted feedback on <strong>Revision ${revisionNumber}</strong>:</p>
                  <div class="feedback-box">
                    <div class="feedback-label">Feedback:</div>
                    <p style="margin: 0; color: #1e3a5f;">${feedback}</p>
                  </div>
                </div>
                <div class="cta">
                  <a href="https://hechoenamerica.lovable.app/my-projects" class="button">View Project</a>
                </div>
              </div>
              <div class="footer">
                <p>HechoEnAmerica Studio</p>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      default:
        throw new Error("Invalid notification type");
    }

    console.log("Sending email to:", toEmail);

    const emailResponse = await resend.emails.send({
      from: "HechoEnAmerica <team@hechoenamericastudio.com>",
      to: [toEmail],
      subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-revision-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
