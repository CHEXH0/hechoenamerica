import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-CONNECT-ONBOARD] ${step}${detailsStr}`);
};

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

    // Authenticate the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Check if user is a producer
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "producer")
      .single();

    if (!roleData) {
      throw new Error("Unauthorized: Producer role required");
    }
    logStep("Producer role verified");

    const { producerId } = await req.json();
    if (!producerId) throw new Error("Missing producerId");

    // Get producer details
    const { data: producer, error: producerError } = await supabaseAdmin
      .from("producers")
      .select("*")
      .eq("id", producerId)
      .single();

    if (producerError || !producer) {
      throw new Error(`Producer not found: ${producerError?.message || "Unknown error"}`);
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    let accountId = producer.stripe_connect_account_id;

    // Create a new Stripe Connect Express account if one doesn't exist
    if (!accountId) {
      logStep("Creating new Stripe Connect Express account");
      const account = await stripe.accounts.create({
        type: "express",
        country: "US", // Default to US, can be made dynamic
        email: producer.email || undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
        metadata: {
          producer_id: producerId,
          producer_name: producer.name,
        },
      });

      accountId = account.id;
      logStep("Created Stripe Connect account", { accountId });

      // Save the account ID to the producer record
      await supabaseAdmin
        .from("producers")
        .update({ stripe_connect_account_id: accountId })
        .eq("id", producerId);
    }

    // Create an account link for onboarding
    const origin = req.headers.get("origin") || "https://hechoenamericastudio.com";
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/producer-profile?connect_refresh=true`,
      return_url: `${origin}/producer-profile?connect_success=true`,
      type: "account_onboarding",
    });

    logStep("Created account link", { url: accountLink.url });

    return new Response(JSON.stringify({ 
      url: accountLink.url,
      accountId,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-connect-onboard", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
