import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user?.email) throw new Error("Not authenticated");

    const { request_id } = await req.json();
    if (!request_id) throw new Error("Missing request_id");

    // Fetch the chamoy request
    const { data: chamoyReq, error: fetchError } = await supabaseClient
      .from("chamoy_requests")
      .select("*")
      .eq("id", request_id)
      .eq("user_id", userData.user.id)
      .single();

    if (fetchError || !chamoyReq) throw new Error("Request not found");
    if (chamoyReq.status !== "accepted") throw new Error("Request not in accepted state");
    if (!chamoyReq.admin_price) throw new Error("No price set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email: userData.user.email, limit: 1 });
    const customerId = customers.data.length > 0
      ? customers.data[0].id
      : (await stripe.customers.create({ email: userData.user.email, metadata: { supabase_user_id: userData.user.id } })).id;

    const amountCents = Math.round(parseFloat(chamoyReq.admin_price) * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0) throw new Error("Invalid price");

    const origin = req.headers.get("origin") || "";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: "Gomas Chamoy – Custom Order",
            description: chamoyReq.admin_description || chamoyReq.description,
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${origin}/treats?chamoy_paid=${request_id}`,
      cancel_url: `${origin}/treats`,
      metadata: {
        chamoy_request_id: request_id,
        supabase_user_id: userData.user.id,
      },
    });

    // Update the request with the stripe session id
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    await adminClient
      .from("chamoy_requests")
      .update({ stripe_session_id: session.id })
      .eq("id", request_id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
