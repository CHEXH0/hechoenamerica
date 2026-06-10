import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-PRODUCER-PAYOUT] ${step}${detailsStr}`);
};

// Default platform fee percentage (overridden by app_settings if available)
let PLATFORM_FEE_PERCENT = 10;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    // Authenticate the request (admin/producer only)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.id || !user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Determine caller roles
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdmin = roles?.some((r: any) => r.role === "admin");
    const isProducer = roles?.some((r: any) => r.role === "producer");

    if (!isAdmin && !isProducer) {
      throw new Error("Unauthorized: Admin or Producer role required");
    }
    logStep("Role verified", { isAdmin, isProducer });

    const { requestId } = await req.json();
    if (!requestId) throw new Error("Missing requestId");

    // Fetch the song request
    const { data: request, error: requestError } = await supabaseAdmin
      .from("song_requests")
      .select("*, producers(id, name, email, stripe_connect_account_id, stripe_connect_onboarded_at)")
      .eq("id", requestId)
      .single();

    if (requestError || !request) {
      throw new Error(`Request not found: ${requestError?.message || "Unknown error"}`);
    }

    // If caller is a producer (not admin), they must own this project
    if (!isAdmin) {
      if (!request.producers || request.producers.email !== user.email) {
        throw new Error("Forbidden: you can only request payouts for your own projects");
      }
    }

    if (request.status !== "completed") {
      throw new Error("Project must be completed before payout");
    }

    if (request.producer_paid_at) {
      throw new Error("Producer has already been paid for this project");
    }

    if (!request.payment_intent_id) {
      throw new Error("No payment intent found for this project");
    }

    logStep("Request fetched", { 
      requestId: request.id, 
      status: request.status,
      producerId: request.assigned_producer_id 
    });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve the payment intent to confirm payment succeeded
    const paymentIntent = await stripe.paymentIntents.retrieve(request.payment_intent_id);

    if (paymentIntent.status !== "succeeded") {
      throw new Error("Payment has not been completed");
    }

    // Fetch dynamic platform fee from app_settings
    const { data: feeSettings } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", "song_pricing")
      .maybeSingle();
    
    if (feeSettings?.value && typeof (feeSettings.value as any).platformFeePercent === 'number') {
      PLATFORM_FEE_PERCENT = (feeSettings.value as any).platformFeePercent;
    }
    logStep("Platform fee loaded", { PLATFORM_FEE_PERCENT });

    // Producer payout is based on the SONG amount ONLY. The Discover Your Distro
    // fee ($15, paid to the support user who handled the consultation) and the
    // HEA Box ($27.68, a physical product kept by admin) are excluded — they are
    // not the producer's work. We use the song-only split stored at checkout;
    // if it's missing (legacy rows) we derive it from the song price.
    let producerPayoutCents = request.producer_payout_cents ?? 0;
    let platformFeeCents = request.platform_fee_cents ?? 0;

    if (!producerPayoutCents || producerPayoutCents <= 0) {
      const songCents = Math.round(
        parseFloat(String(request.price ?? "0").replace(/[^0-9.]/g, "")) * 100
      );
      platformFeeCents = Math.round(songCents * (PLATFORM_FEE_PERCENT / 100));
      producerPayoutCents = songCents - platformFeeCents;
      logStep("Stored payout missing — derived from song price", { songCents });
    }

    const songAmountCents = producerPayoutCents + platformFeeCents;

    if (producerPayoutCents <= 0) {
      throw new Error("Unable to determine producer payout amount for this project");
    }

    logStep("Payout calculation", {
      songAmountCents,
      platformFeeCents,
      producerPayoutCents,
      platformFeePercent: PLATFORM_FEE_PERCENT,
      chargeAmountCents: paymentIntent.amount,
    });

    const producerData = request.producers;
    if (!producerData?.stripe_connect_account_id) {
      throw new Error("Producer has not connected a Stripe account. Set up Stripe Connect before requesting a payout.");
    }

    // Verify the Connect account is fully onboarded and payouts-enabled
    const account = await stripe.accounts.retrieve(producerData.stripe_connect_account_id);
    if (!account.charges_enabled || !account.payouts_enabled || !account.details_submitted) {
      throw new Error(
        "Stripe Connect account is not ready to receive transfers. Complete onboarding (details submitted, charges & payouts enabled)."
      );
    }

    // Resolve the charge id from the payment intent so we can attach the transfer
    // to the original charge (source_transaction). This makes the transfer pull
    // directly from that charge and avoids "insufficient available funds" errors
    // when the platform's available balance is empty (common in test mode).
    let sourceChargeId: string | null = null;
    const latestCharge = (paymentIntent as any).latest_charge;
    if (typeof latestCharge === "string") {
      sourceChargeId = latestCharge;
    } else if (latestCharge?.id) {
      sourceChargeId = latestCharge.id;
    } else {
      try {
        const charges = await stripe.charges.list({ payment_intent: request.payment_intent_id, limit: 1 });
        sourceChargeId = charges.data[0]?.id ?? null;
      } catch (e) {
        logStep("Could not list charges for PI", { error: e instanceof Error ? e.message : String(e) });
      }
    }
    logStep("Resolved source charge", { sourceChargeId });

    // Create the Stripe transfer to the producer's Connect account
    let transferId: string;
    const baseTransfer: Record<string, any> = {
      amount: producerPayoutCents,
      currency: paymentIntent.currency || "usd",
      destination: producerData.stripe_connect_account_id,
      transfer_group: request.id,
      metadata: {
        request_id: request.id,
        tier: request.tier,
        producer_id: request.assigned_producer_id,
      },
    };
    if (sourceChargeId) baseTransfer.source_transaction = sourceChargeId;

    try {
      const transfer = await stripe.transfers.create(baseTransfer);
      transferId = transfer.id;
      logStep("Stripe transfer created", { transferId, amount: producerPayoutCents, usedSourceTransaction: !!sourceChargeId });
    } catch (transferError) {
      const msg = transferError instanceof Error ? transferError.message : String(transferError);
      logStep("Transfer failed (first attempt)", { error: msg });

      // Fallback: if source_transaction wasn't accepted, try without it
      if (sourceChargeId) {
        try {
          delete baseTransfer.source_transaction;
          const transfer = await stripe.transfers.create(baseTransfer);
          transferId = transfer.id;
          logStep("Stripe transfer created (fallback)", { transferId });
        } catch (fallbackErr) {
          const fmsg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
          logStep("Transfer failed (fallback)", { error: fmsg });
          throw new Error(`Stripe transfer failed: ${fmsg}`);
        }
      } else {
        throw new Error(`Stripe transfer failed: ${msg}`);
      }
    }

    // Only mark paid AFTER transfer succeeds
    const { error: updateError } = await supabaseAdmin
      .from("song_requests")
      .update({
        platform_fee_cents: platformFeeCents,
        producer_payout_cents: producerPayoutCents,
        producer_paid_at: new Date().toISOString(),
        stripe_transfer_id: transferId,
        payout_method: "stripe_connect",
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (updateError) {
      throw new Error(`Failed to update payout record: ${updateError.message}`);
    }

    logStep("Payout recorded", { requestId, transferId });

    // Notify the producer about the payout
    if (request.producers?.email) {
      try {
        const { Resend } = await import("https://esm.sh/resend@2.0.0");
        const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

        await resend.emails.send({
          from: "Hecho En America <team@hechoenamericastudio.com>",
          to: [request.producers.email],
          subject: `Payment Processed - ${request.tier} Song Project`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #10b981;">Payment Processed! 💰</h2>
              <p>Hi ${request.producers.name},</p>
              <p>Great news! Your payment for the completed project has been transferred to your Stripe Connect account.</p>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Payment Details</h3>
                <p><strong>Project:</strong> ${request.tier} Song</p>
                <p><strong>Song Value:</strong> $${(songAmountCents / 100).toFixed(2)}</p>
                <p><strong>Platform Fee (${PLATFORM_FEE_PERCENT}%):</strong> $${(platformFeeCents / 100).toFixed(2)}</p>
                <p style="font-size: 1.2em; color: #10b981;"><strong>Your Payout:</strong> $${(producerPayoutCents / 100).toFixed(2)}</p>
                <p style="font-size: 0.85em; color: #666;">Stripe Transfer ID: ${transferId}</p>
              </div>
              
              <p>Funds will land in your bank account on your normal Stripe payout schedule.</p>
              <p>Thank you for your excellent work!</p>
              
              <p style="color: #666; margin-top: 30px;">— The Hecho En America Team</p>
            </div>
          `,
        });
        logStep("Producer payment notification sent", { email: request.producers.email });
      } catch (emailError) {
        logStep("Failed to send payment notification", { 
          error: emailError instanceof Error ? emailError.message : String(emailError) 
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      payout: {
        songAmountCents,
        platformFeeCents,
        producerPayoutCents,
        platformFeePercent: PLATFORM_FEE_PERCENT,
        transferId,
        payoutMethod: "stripe_connect",
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in process-producer-payout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
