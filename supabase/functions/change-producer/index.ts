import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const APP_URL = 'https://hechoenamericastudio.com';
const PLATFORM_FEE_PERCENT = 15;

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHANGE-PRODUCER] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin access
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) throw new Error("Unauthorized");

    const { data: adminCheck } = await supabase
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (!adminCheck) throw new Error("Only admins can change producers");

    const { requestId, reason } = await req.json();
    if (!requestId) throw new Error("Missing requestId");

    logStep("Processing producer change", { requestId, reason });

    // Fetch the song request with producer and revisions
    const { data: songRequest, error: fetchError } = await supabase
      .from("song_requests")
      .select("*, producers:assigned_producer_id(id, name, email)")
      .eq("id", requestId)
      .single();

    if (fetchError || !songRequest) throw new Error(`Request not found: ${fetchError?.message}`);

    if (!songRequest.assigned_producer_id) {
      throw new Error("No producer is currently assigned to this project");
    }

    const oldProducerId = songRequest.assigned_producer_id;
    const oldProducerName = songRequest.producers?.name || "Previous Producer";
    const oldProducerEmail = songRequest.producers?.email;

    // Fetch revisions to calculate progress
    const { data: revisions } = await supabase
      .from("song_revisions")
      .select("id, revision_number, status, delivered_at")
      .eq("song_request_id", requestId)
      .order("revision_number", { ascending: true });

    const deliveredRevisions = revisions?.filter(r => r.status === 'delivered').length || 0;
    const totalRevisions = songRequest.number_of_revisions || 0;

    // Calculate partial payout for old producer based on work done
    let producerPayoutCents = 0;
    let payoutMethod = "none";

    if (deliveredRevisions > 0 && songRequest.payment_intent_id) {
      const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
        apiVersion: "2025-08-27.basil",
      });

      const paymentIntent = await stripe.paymentIntents.retrieve(songRequest.payment_intent_id);

      if (paymentIntent.status === "succeeded") {
        const totalAmountCents = paymentIntent.amount;
        // Calculate what proportion of work was completed
        const progressRatio = totalRevisions > 0 ? deliveredRevisions / totalRevisions : 0.5;
        // Producer gets their share (85%) proportional to work completed
        const producerTotalShare = Math.round(totalAmountCents * (1 - PLATFORM_FEE_PERCENT / 100));
        producerPayoutCents = Math.round(producerTotalShare * progressRatio);

        logStep("Payout calculation", {
          totalAmountCents,
          progressRatio,
          producerTotalShare,
          producerPayoutCents,
          deliveredRevisions,
          totalRevisions,
        });

        // Check if old producer has Stripe Connect for automatic payout
        const { data: producerData } = await supabase
          .from("producers")
          .select("stripe_connect_account_id, stripe_connect_onboarded_at")
          .eq("id", oldProducerId)
          .single();

        if (producerData?.stripe_connect_account_id && producerData?.stripe_connect_onboarded_at && producerPayoutCents > 0) {
          try {
            const transfer = await stripe.transfers.create({
              amount: producerPayoutCents,
              currency: "usd",
              destination: producerData.stripe_connect_account_id,
              transfer_group: requestId,
              metadata: {
                request_id: requestId,
                reason: "partial_payout_producer_change",
                progress_ratio: progressRatio.toString(),
              },
            });
            payoutMethod = "stripe_connect";
            logStep("Stripe transfer created for old producer", { transferId: transfer.id });
          } catch (transferError) {
            logStep("Transfer failed, recording manual payout needed", {
              error: transferError instanceof Error ? transferError.message : String(transferError),
            });
            payoutMethod = "manual_required";
          }
        } else if (producerPayoutCents > 0) {
          payoutMethod = "manual_required";
          logStep("Old producer not on Stripe Connect, manual payout needed");
        }
      }
    }

    // Block the old producer and unassign
    const existingBlocked = songRequest.blocked_producer_ids || [];
    const updatedBlocked = [...existingBlocked, oldProducerId];

    const { error: updateError } = await supabase
      .from("song_requests")
      .update({
        assigned_producer_id: null,
        blocked_producer_ids: updatedBlocked,
        status: "paid", // Reset to paid so new producer can accept
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (updateError) throw new Error(`Failed to update request: ${updateError.message}`);

    logStep("Producer unassigned and blocked", { oldProducerId, updatedBlocked });

    // Reset acceptance deadline (48 hours from now)
    const newDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    await supabase
      .from("song_requests")
      .update({ acceptance_deadline: newDeadline })
      .eq("id", requestId);

    // Send Discord notification for new producer to accept
    try {
      await supabase.functions.invoke("send-discord-notification", {
        body: {
          requestId,
          notificationType: "producer_changed",
        },
      });
      logStep("Discord notification sent for producer change");
    } catch (discordError) {
      logStep("Failed to send Discord notification", { error: discordError });
    }

    // Email old producer about the change and their compensation
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    if (oldProducerEmail) {
      try {
        await resend.emails.send({
          from: "HechoEnAmerica <team@hechoenamericastudio.com>",
          to: [oldProducerEmail],
          reply_to: "team@hechoenamericastudio.com",
          subject: `📋 Producer Change - ${songRequest.tier} Project`,
          html: `
            <!DOCTYPE html>
            <html>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">📋 Producer Change Notice</h1>
              </div>
              <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                <p>Hi ${oldProducerName},</p>
                <p>The admin team has decided to reassign the following project to a different producer.</p>
                
                <div style="background: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
                  <h3 style="margin-top: 0; color: #92400E;">Project Details</h3>
                  <p style="margin: 0;"><strong>Tier:</strong> ${songRequest.tier}</p>
                  <p style="margin: 4px 0;"><strong>Genre:</strong> ${songRequest.genre_category || 'Not specified'}</p>
                </div>

                ${producerPayoutCents > 0 ? `
                  <div style="background: #ECFDF5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
                    <h3 style="margin-top: 0; color: #065F46;">💰 Compensation for Work Completed</h3>
                    <p style="margin: 0;">Based on your progress (${deliveredRevisions}/${totalRevisions} revisions delivered), you will receive:</p>
                    <p style="font-size: 1.2em; color: #10B981; margin: 8px 0;"><strong>$${(producerPayoutCents / 100).toFixed(2)}</strong></p>
                    <p style="font-size: 14px; color: #6B7280; margin: 0;">
                      ${payoutMethod === 'stripe_connect' ? 'This has been transferred to your Stripe Connect account.' : 'The team will process this payment manually.'}
                    </p>
                  </div>
                ` : `
                  <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; color: #6B7280;">No revisions were delivered, so no compensation applies for this project.</p>
                  </div>
                `}

                ${reason ? `
                  <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px; color: #6B7280;">Reason:</p>
                    <p style="margin: 8px 0 0 0;">${reason}</p>
                  </div>
                ` : ''}

                <p style="font-size: 14px; color: #6B7280;">If you have any questions, please reply to this email.</p>
                <p style="color: #666; margin-top: 30px;">— The Hecho En America Team</p>
              </div>
            </body>
            </html>
          `,
        });
        logStep("Old producer notified", { email: oldProducerEmail });
      } catch (emailError) {
        logStep("Failed to email old producer", { error: emailError });
      }
    }

    // Email client about the producer change
    try {
      await resend.emails.send({
        from: "HechoEnAmerica <team@hechoenamericastudio.com>",
        to: [songRequest.user_email],
        reply_to: "team@hechoenamericastudio.com",
        subject: `🔄 Producer Update - Your ${songRequest.tier} Project`,
        html: `
          <!DOCTYPE html>
          <html>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🔄 Producer Update</h1>
            </div>
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
              <p>Hi there,</p>
              <p>We're reaching out to let you know that your <strong>${songRequest.tier}</strong> project is being reassigned to a new producer to ensure the best possible result.</p>
              
              <div style="background: #EEF2FF; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6366F1;">
                <h3 style="margin-top: 0; color: #3730A3;">What This Means</h3>
                <p style="margin: 0;">A new producer will accept your project within 48 hours. You'll receive a notification once they're assigned.</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${APP_URL}/my-projects" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  View My Projects
                </a>
              </div>
              
              <p style="font-size: 14px; color: #888; text-align: center;">Questions? Reply to this email.</p>
            </div>
          </body>
          </html>
        `,
      });
      logStep("Client notified about producer change");
    } catch (emailError) {
      logStep("Failed to email client", { error: emailError });
    }

    // Email HEA team
    try {
      await resend.emails.send({
        from: "HechoEnAmerica System <team@hechoenamericastudio.com>",
        to: ["team@hechoenamericastudio.com"],
        subject: `🔄 Producer Changed: ${songRequest.tier} Project`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Producer Change Processed</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Request ID:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${requestId}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Old Producer:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${oldProducerName} (${oldProducerEmail || 'N/A'})</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Progress:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${deliveredRevisions}/${totalRevisions} revisions delivered</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Producer Payout:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">$${(producerPayoutCents / 100).toFixed(2)} (${payoutMethod})</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Processed By:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${user.email}</td></tr>
            </table>
            ${reason ? `<div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin: 20px 0;"><strong>Reason:</strong> ${reason}</div>` : ''}
          </div>
        `,
      });
    } catch (emailError) {
      logStep("Failed to email team", { error: emailError });
    }

    return new Response(JSON.stringify({
      success: true,
      oldProducer: oldProducerName,
      producerPayoutCents,
      payoutMethod,
      deliveredRevisions,
      totalRevisions,
      message: `Producer changed. ${oldProducerName} ${producerPayoutCents > 0 ? `will receive $${(producerPayoutCents / 100).toFixed(2)} for work completed` : 'received no payout (no work delivered)'}. Project reposted for new producer.`,
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
