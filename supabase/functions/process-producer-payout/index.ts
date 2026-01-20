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

// Platform fee percentage (15%)
const PLATFORM_FEE_PERCENT = 15;

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
    if (!user?.id) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Check if user is admin or producer
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "producer"])
      .single();

    if (!roleData) {
      throw new Error("Unauthorized: Admin or Producer role required");
    }
    logStep("Role verified", { role: roleData.role });

    const { requestId } = await req.json();
    if (!requestId) throw new Error("Missing requestId");

    // Fetch the song request
    const { data: request, error: requestError } = await supabaseAdmin
      .from("song_requests")
      .select("*, producers(id, name, email)")
      .eq("id", requestId)
      .single();

    if (requestError || !request) {
      throw new Error(`Request not found: ${requestError?.message || "Unknown error"}`);
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

    // Retrieve the payment intent to get the actual charge
    const paymentIntent = await stripe.paymentIntents.retrieve(request.payment_intent_id, {
      expand: ["charges"],
    });

    if (paymentIntent.status !== "succeeded") {
      throw new Error("Payment has not been completed");
    }

    // Calculate amounts
    const totalAmountCents = paymentIntent.amount;
    const platformFeeCents = Math.round(totalAmountCents * (PLATFORM_FEE_PERCENT / 100));
    const producerPayoutCents = totalAmountCents - platformFeeCents;

    logStep("Payout calculation", {
      totalAmountCents,
      platformFeeCents,
      producerPayoutCents,
      platformFeePercent: PLATFORM_FEE_PERCENT,
    });

// Check if producer has Stripe Connect account for automatic payout
    const { data: producerData } = await supabaseAdmin
      .from("producers")
      .select("stripe_connect_account_id, stripe_connect_onboarded_at")
      .eq("id", request.assigned_producer_id)
      .single();

    let transferId = null;
    let payoutMethod = "manual";

    if (producerData?.stripe_connect_account_id && producerData?.stripe_connect_onboarded_at) {
      // Create actual Stripe transfer to producer's Connect account
      try {
        const transfer = await stripe.transfers.create({
          amount: producerPayoutCents,
          currency: "usd",
          destination: producerData.stripe_connect_account_id,
          transfer_group: request.id,
          metadata: {
            request_id: request.id,
            tier: request.tier,
            producer_id: request.assigned_producer_id,
          },
        });
        transferId = transfer.id;
        payoutMethod = "stripe_connect";
        logStep("Stripe transfer created", { transferId, amount: producerPayoutCents });
      } catch (transferError) {
        logStep("Transfer failed, falling back to manual", { 
          error: transferError instanceof Error ? transferError.message : String(transferError) 
        });
        // Fall back to manual payout tracking
      }
    } else {
      logStep("Producer not onboarded to Stripe Connect, recording manual payout");
    }

    // Update the song request with payout information
    const { error: updateError } = await supabaseAdmin
      .from("song_requests")
      .update({
        platform_fee_cents: platformFeeCents,
        producer_payout_cents: producerPayoutCents,
        producer_paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (updateError) {
      throw new Error(`Failed to update payout record: ${updateError.message}`);
    }

    logStep("Payout recorded", { requestId });

    // Notify the producer about the payout
    if (request.producers?.email) {
      try {
        const { Resend } = await import("https://esm.sh/resend@2.0.0");
        const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

        await resend.emails.send({
          from: "Hecho En America <noreply@hechoenamerica.lovable.app>",
          to: [request.producers.email],
          subject: `Payment Processed - ${request.tier} Song Project`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #10b981;">Payment Processed! 💰</h2>
              <p>Hi ${request.producers.name},</p>
              <p>Great news! Your payment for the completed project has been processed.</p>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Payment Details</h3>
                <p><strong>Project:</strong> ${request.tier} Song</p>
                <p><strong>Total Project Value:</strong> $${(totalAmountCents / 100).toFixed(2)}</p>
                <p><strong>Platform Fee (${PLATFORM_FEE_PERCENT}%):</strong> $${(platformFeeCents / 100).toFixed(2)}</p>
                <p style="font-size: 1.2em; color: #10b981;"><strong>Your Payout:</strong> $${(producerPayoutCents / 100).toFixed(2)}</p>
              </div>
              
              <p>The payout will be transferred to your account according to our payout schedule.</p>
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
        totalAmountCents,
        platformFeeCents,
        producerPayoutCents,
        platformFeePercent: PLATFORM_FEE_PERCENT,
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
