import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-SONG-CHECKOUT] ${step}${detailsStr}`);
};

// Platform fee percentage (15%)
const PLATFORM_FEE_PERCENT = 15;
// Acceptance deadline in hours
const ACCEPTANCE_DEADLINE_HOURS = 48;

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

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { 
      tier, 
      idea, 
      fileUrls, 
      requestId,
      totalPrice,
      basePrice,
      addOns 
    } = await req.json();
    
    logStep("Request body received", { 
      tier, 
      idea: idea?.substring(0, 50), 
      fileCount: fileUrls?.length || 0, 
      requestId,
      totalPrice,
      basePrice,
      addOns
    });

    if (!tier || totalPrice === undefined) {
      throw new Error("Missing required fields: tier and totalPrice");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    }

    // Build description with add-ons
    let description = `Song Production - ${tier} Tier`;
    const addOnsList: string[] = [];
    if (addOns?.stems) addOnsList.push("Recorded Stems");
    if (addOns?.analog) addOnsList.push("Analog Equipment");
    if (addOns?.mixing) addOnsList.push("Mixing Service");
    if (addOns?.mastering) addOnsList.push("Mastering Service");
    if (addOns?.revisions > 0) addOnsList.push(`${addOns.revisions} Revision(s)`);
    
    if (addOnsList.length > 0) {
      description += ` + ${addOnsList.join(", ")}`;
    }

    // Calculate amounts in cents
    const totalAmountCents = Math.round(totalPrice * 100);
    const platformFeeCents = Math.round(totalAmountCents * (PLATFORM_FEE_PERCENT / 100));
    const producerPayoutCents = totalAmountCents - platformFeeCents;

    logStep("Payment calculation", {
      totalAmountCents,
      platformFeeCents,
      producerPayoutCents,
    });

    // Calculate acceptance deadline (48 hours from now)
    const acceptanceDeadline = new Date();
    acceptanceDeadline.setHours(acceptanceDeadline.getHours() + ACCEPTANCE_DEADLINE_HOURS);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Song Production - ${tier}`,
              description: description,
            },
            unit_amount: totalAmountCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      payment_intent_data: {
        // Store metadata on the PaymentIntent for later reference
        metadata: {
          tier,
          user_id: user.id,
          request_id: requestId || "",
          platform_fee_cents: platformFeeCents.toString(),
          producer_payout_cents: producerPayoutCents.toString(),
          acceptance_deadline: acceptanceDeadline.toISOString(),
        },
      },
      metadata: {
        tier,
        idea: idea?.substring(0, 500) || "",
        user_id: user.id,
        request_id: requestId || "",
        total_price: totalPrice.toString(),
        base_price: basePrice?.toString() || "",
        add_ons: JSON.stringify(addOns || {}),
        platform_fee_cents: platformFeeCents.toString(),
        producer_payout_cents: producerPayoutCents.toString(),
        acceptance_deadline: acceptanceDeadline.toISOString(),
      },
      success_url: `${req.headers.get("origin")}/purchase-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/generate-song`,
    });

    logStep("Checkout session created", { 
      sessionId: session.id, 
      url: session.url, 
      totalPrice,
      acceptanceDeadline: acceptanceDeadline.toISOString(),
    });

    return new Response(JSON.stringify({ 
      url: session.url,
      acceptanceDeadline: acceptanceDeadline.toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-song-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
