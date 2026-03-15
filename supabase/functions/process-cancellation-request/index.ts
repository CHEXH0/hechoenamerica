import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const APP_URL = 'https://hechoenamericastudio.com';

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-CANCELLATION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin access
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: adminCheck } = await supabaseClient
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (!adminCheck) {
      throw new Error("Only admins can process cancellation requests");
    }

    const { requestId, action, refundPercentage, adminNotes } = await req.json();
    
    logStep("Processing cancellation request", { requestId, action, refundPercentage });

    if (!requestId || !action) {
      throw new Error("Missing required fields: requestId, action");
    }

    if (!['approve', 'deny'].includes(action)) {
      throw new Error("Invalid action. Must be 'approve' or 'deny'");
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

    if (songRequest.status !== "cancellation_requested") {
      throw new Error(`Invalid status for cancellation: ${songRequest.status}`);
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    let refundAmount = 0;
    let refundId = null;

    if (action === 'approve') {
      // Calculate refund based on percentage (default 100% if not specified)
      const percentage = refundPercentage ?? 100;
      
      if (songRequest.payment_intent_id) {
        const paymentIntent = await stripe.paymentIntents.retrieve(songRequest.payment_intent_id);
        
        if (paymentIntent.status === "succeeded") {
          refundAmount = Math.floor((paymentIntent.amount * percentage) / 100);
          
          if (refundAmount > 0) {
            const refund = await stripe.refunds.create({
              payment_intent: songRequest.payment_intent_id,
              amount: refundAmount,
              reason: "requested_by_customer",
              metadata: {
                request_id: requestId,
                reason: "Customer requested cancellation",
                refund_percentage: percentage.toString(),
                admin_notes: adminNotes || "",
              },
            });
            
            refundId = refund.id;
            logStep("Refund created", { refundId, refundAmount, percentage });
          }
        }
      }

      // Update song request status
      const { error: updateError } = await supabaseClient
        .from("song_requests")
        .update({
          status: "refunded",
          refunded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (updateError) {
        throw new Error(`Failed to update request: ${updateError.message}`);
      }

      logStep("Request marked as refunded");

    } else {
      // Deny - return to previous status (in_progress or accepted based on context)
      const { error: updateError } = await supabaseClient
        .from("song_requests")
        .update({
          status: "in_progress",
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (updateError) {
        throw new Error(`Failed to update request: ${updateError.message}`);
      }

      logStep("Cancellation denied, status returned to in_progress");
    }

    // Send notifications
    const producerEmail = songRequest.producers?.email;
    const producerName = songRequest.producers?.name || "Producer";

    // 1. Email to Customer
    try {
      await resend.emails.send({
        from: "HechoEnAmerica <team@hechoenamericastudio.com>",
        to: [songRequest.user_email],
        reply_to: "team@hechoenamericastudio.com",
        subject: action === 'approve' 
          ? "✅ Your Cancellation Request Has Been Approved" 
          : "ℹ️ Update on Your Cancellation Request",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: ${action === 'approve' ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)'}; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">
                ${action === 'approve' ? '✅ Cancellation Approved' : 'ℹ️ Cancellation Request Update'}
              </h1>
            </div>
            
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
              ${action === 'approve' ? `
                <p style="font-size: 16px;">Hi there,</p>
                <p style="font-size: 16px;">Your cancellation request for your <strong>${songRequest.tier}</strong> song project has been approved.</p>
                
                ${refundAmount > 0 ? `
                  <div style="background: #ECFDF5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
                    <h3 style="margin-top: 0; color: #065F46;">💰 Refund Information</h3>
                    <p style="margin: 0; font-size: 18px;">
                      <strong>$${(refundAmount / 100).toFixed(2)}</strong> has been refunded to your original payment method.
                    </p>
                    <p style="margin: 8px 0 0 0; color: #6B7280; font-size: 14px;">
                      This typically takes 5-10 business days to appear on your statement.
                    </p>
                  </div>
                ` : `
                  <div style="background: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
                    <p style="margin: 0;">No refund was processed for this request.</p>
                  </div>
                `}
                
                ${adminNotes ? `
                  <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px; color: #6B7280;">Admin Note:</p>
                    <p style="margin: 8px 0 0 0;">${adminNotes}</p>
                  </div>
                ` : ''}
              ` : `
                <p style="font-size: 16px;">Hi there,</p>
                <p style="font-size: 16px;">We've reviewed your cancellation request for your <strong>${songRequest.tier}</strong> song project.</p>
                
                <div style="background: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
                  <h3 style="margin-top: 0; color: #92400E;">Request Not Approved</h3>
                  <p style="margin: 0;">Your project has significant work completed and cannot be cancelled at this time. Your producer will continue working on delivering your song.</p>
                </div>
                
                ${adminNotes ? `
                  <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px; color: #6B7280;">Reason:</p>
                    <p style="margin: 8px 0 0 0;">${adminNotes}</p>
                  </div>
                ` : ''}
                
                <p style="font-size: 14px; color: #6B7280;">If you have any questions or concerns, please reply to this email.</p>
              `}
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${APP_URL}/my-projects" 
                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  View My Projects
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
      logStep("Customer notified", { email: songRequest.user_email });
    } catch (emailError) {
      logStep("Failed to send customer email", { error: emailError });
    }

    // 2. Email to Producer (if assigned)
    if (producerEmail) {
      try {
        await resend.emails.send({
          from: "HechoEnAmerica <team@hechoenamericastudio.com>",
          to: [producerEmail],
          reply_to: "team@hechoenamericastudio.com",
          subject: action === 'approve' 
            ? "📋 Project Cancelled - Client Request Approved" 
            : "ℹ️ Client Cancellation Request Denied - Continue Working",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: ${action === 'approve' ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)'}; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">
                  ${action === 'approve' ? '📋 Project Cancelled' : '✅ Continue Working'}
                </h1>
              </div>
              
              <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px;">Hi ${producerName},</p>
                
                ${action === 'approve' ? `
                  <p style="font-size: 16px;">A client has requested to cancel their project and it has been approved by the admin team.</p>
                  
                  <div style="background: #FEF2F2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #EF4444;">
                    <h3 style="margin-top: 0; color: #991B1B;">Project Details</h3>
                    <p style="margin: 0;"><strong>Tier:</strong> ${songRequest.tier}</p>
                    <p style="margin: 4px 0;"><strong>Client:</strong> ${songRequest.user_email}</p>
                    <p style="margin: 4px 0 0 0;"><strong>Genre:</strong> ${songRequest.genre_category || 'Not specified'}</p>
                  </div>
                  
                  <p style="font-size: 14px; color: #6B7280;">This project has been removed from your dashboard. You will not receive payment for this project.</p>
                ` : `
                  <p style="font-size: 16px;">A client requested to cancel their project, but the request was <strong>denied</strong> due to significant work progress.</p>
                  
                  <div style="background: #ECFDF5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
                    <h3 style="margin-top: 0; color: #065F46;">Please Continue</h3>
                    <p style="margin: 0;">Continue working on the project as planned. The client has been notified.</p>
                  </div>
                  
                  <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>Tier:</strong> ${songRequest.tier}</p>
                    <p style="margin: 4px 0;"><strong>Client:</strong> ${songRequest.user_email}</p>
                  </div>
                `}
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${APP_URL}/my-projects" 
                     style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                    View Dashboard
                  </a>
                </div>
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

    // 3. Email to HEA Team
    try {
      await resend.emails.send({
        from: "HechoEnAmerica System <team@hechoenamericastudio.com>",
        to: ["team@hechoenamericastudio.com"],
        reply_to: songRequest.user_email,
        subject: `🔔 Cancellation ${action === 'approve' ? 'Approved' : 'Denied'}: ${songRequest.tier} Project`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: ${action === 'approve' ? '#10B981' : '#F59E0B'};">
              Cancellation Request ${action === 'approve' ? 'Approved ✅' : 'Denied ❌'}
            </h2>
            
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
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Original Price:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${songRequest.price}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Producer:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${producerName} (${producerEmail || 'Not assigned'})</td>
              </tr>
              ${action === 'approve' && refundAmount > 0 ? `
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Refund Amount:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">$${(refundAmount / 100).toFixed(2)} (${refundPercentage || 100}%)</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Refund ID:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${refundId}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Processed By:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${user.email}</td>
              </tr>
            </table>
            
            ${adminNotes ? `
              <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold;">Admin Notes:</p>
                <p style="margin: 8px 0 0 0;">${adminNotes}</p>
              </div>
            ` : ''}
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
          notificationType: "cancellation_processed",
          action: action,
          refundAmount: refundAmount > 0 ? `$${(refundAmount / 100).toFixed(2)}` : 'None',
        },
      });
    } catch (discordError) {
      logStep("Failed to send Discord notification", { error: discordError });
    }

    return new Response(JSON.stringify({
      success: true,
      action,
      refundAmount: refundAmount > 0 ? refundAmount / 100 : 0,
      refundId,
      message: action === 'approve' 
        ? `Cancellation approved. ${refundAmount > 0 ? `$${(refundAmount / 100).toFixed(2)} refunded.` : 'No refund issued.'}`
        : 'Cancellation denied. Project returned to in_progress.',
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
