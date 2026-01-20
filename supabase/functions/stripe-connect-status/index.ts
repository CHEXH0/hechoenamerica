import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-CONNECT-STATUS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const { producerId } = await req.json();
    if (!producerId) throw new Error("Missing producerId");

    // Get producer details
    const { data: producer, error: producerError } = await supabaseAdmin
      .from("producers")
      .select("stripe_connect_account_id, stripe_connect_onboarded_at")
      .eq("id", producerId)
      .single();

    if (producerError || !producer) {
      throw new Error(`Producer not found: ${producerError?.message || "Unknown error"}`);
    }

    if (!producer.stripe_connect_account_id) {
      return new Response(JSON.stringify({ 
        connected: false,
        onboarded: false,
        payoutsEnabled: false,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Get the account status from Stripe
    const account = await stripe.accounts.retrieve(producer.stripe_connect_account_id);
    
    const isOnboarded = account.details_submitted && account.charges_enabled;
    const payoutsEnabled = account.payouts_enabled;

    logStep("Account status retrieved", { 
      accountId: producer.stripe_connect_account_id,
      isOnboarded,
      payoutsEnabled,
    });

    // Update the onboarded timestamp if just completed
    if (isOnboarded && !producer.stripe_connect_onboarded_at) {
      await supabaseAdmin
        .from("producers")
        .update({ stripe_connect_onboarded_at: new Date().toISOString() })
        .eq("id", producerId);
    }

    return new Response(JSON.stringify({ 
      connected: true,
      onboarded: isOnboarded,
      payoutsEnabled,
      accountId: producer.stripe_connect_account_id,
      chargesEnabled: account.charges_enabled,
      detailsSubmitted: account.details_submitted,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-connect-status", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
