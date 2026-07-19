import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ACCEPTANCE_DEADLINE_HOURS = 48;
const PLATFORM_FEE_PERCENT = 10;

const log = (step: string, details?: unknown) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[RESUME-SONG-PAYMENT] ${step}${d}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    const user = userData.user;
    if (!user?.email) throw new Error("Not authenticated");

    const { requestId } = await req.json();
    if (!requestId) throw new Error("Missing requestId");

    const { data: request, error: reqError } = await supabaseAdmin
      .from("song_requests")
      .select("*")
      .eq("id", requestId)
      .maybeSingle();

    if (reqError || !request) throw new Error("Song request not found");
    if (request.user_id !== user.id) throw new Error("Not your project");
    if (!["pending_payment", "pending"].includes(request.status)) {
      throw new Error("This project is not awaiting payment");
    }

    // Parse stored price ("$123.45" or "123.45")
    const priceStr = String(request.price || "0").replace(/[^0-9.]/g, "");
    const totalPrice = parseFloat(priceStr);
    if (!totalPrice || totalPrice <= 0) throw new Error("Invalid stored price");

    const totalAmountCents = Math.round(totalPrice * 100);
    // Split based on stored values when present, else fall back to full amount
    // treated as song amount.
    const songAmountCents =
      (request.platform_fee_cents ?? 0) + (request.producer_payout_cents ?? 0) ||
      totalAmountCents;
    const platformFeeCents =
      request.platform_fee_cents ??
      Math.round(songAmountCents * (PLATFORM_FEE_PERCENT / 100));
    const producerPayoutCents =
      request.producer_payout_cents ?? songAmountCents - platformFeeCents;

    log("Computed amounts", {
      totalAmountCents,
      songAmountCents,
      platformFeeCents,
      producerPayoutCents,
    });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data[0]?.id;

    const acceptanceDeadline = new Date();
    acceptanceDeadline.setHours(acceptanceDeadline.getHours() + ACCEPTANCE_DEADLINE_HOURS);

    const description = `Song Production - ${request.tier} Tier (resumed)`;

    const session = await stripe.checkout.sessions.create({
      allow_promotion_codes: true,
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Song Production - ${request.tier}`,
              description,
            },
            unit_amount: totalAmountCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      payment_intent_data: {
        metadata: {
          tier: request.tier,
          user_id: user.id,
          request_id: request.id,
          platform_fee_cents: String(platformFeeCents),
          producer_payout_cents: String(producerPayoutCents),
          acceptance_deadline: acceptanceDeadline.toISOString(),
          resumed: "true",
        },
      },
      metadata: {
        tier: request.tier,
        idea: (request.song_idea || "").substring(0, 500),
        user_id: user.id,
        request_id: request.id,
        total_price: String(totalPrice),
        platform_fee_cents: String(platformFeeCents),
        producer_payout_cents: String(producerPayoutCents),
        acceptance_deadline: acceptanceDeadline.toISOString(),
        bit_depth: request.bit_depth || "24",
        sample_rate: request.sample_rate || "44.1",
        user_email: user.email,
        resumed: "true",
      },
      success_url: `${req.headers.get("origin")}/purchase-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/my-projects`,
    });

    // Persist new session id so verify-song-payment resolves the row.
    await supabaseAdmin
      .from("song_requests")
      .update({
        stripe_session_id: session.id,
        acceptance_deadline: acceptanceDeadline.toISOString(),
        platform_fee_cents: platformFeeCents,
        producer_payout_cents: producerPayoutCents,
      })
      .eq("id", request.id);

    log("Resume session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
