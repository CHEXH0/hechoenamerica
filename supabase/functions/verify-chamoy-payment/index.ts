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

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { request_id } = await req.json();
    if (!request_id) throw new Error("Missing request_id");

    const { data: chamoyReq, error } = await supabaseAdmin
      .from("chamoy_requests")
      .select("*")
      .eq("id", request_id)
      .single();

    if (error || !chamoyReq) throw new Error("Request not found");
    if (chamoyReq.paid_at) {
      return new Response(JSON.stringify({ success: true, already_verified: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!chamoyReq.stripe_session_id) throw new Error("No payment session");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const session = await stripe.checkout.sessions.retrieve(chamoyReq.stripe_session_id);

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ success: false, message: "Payment not completed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabaseAdmin
      .from("chamoy_requests")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", request_id);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
