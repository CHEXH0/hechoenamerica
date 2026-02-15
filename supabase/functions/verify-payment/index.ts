import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting payment verification");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { session_id } = await req.json();
    if (!session_id || typeof session_id !== 'string' || session_id.length > 500) {
      throw new Error("Invalid session ID");
    }

    // Idempotency check: prevent replay attacks
    const { data: existingPurchase } = await supabaseClient
      .from('purchases')
      .select('id')
      .eq('stripe_session_id', session_id)
      .maybeSingle();

    if (existingPurchase) {
      logStep("Session already processed, returning success", { sessionId: session_id });
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Payment already verified' 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Retrieving checkout session", { sessionId: session_id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== 'paid') {
      throw new Error('Payment not completed');
    }

    logStep("Payment verified as paid", { 
      sessionId: session_id, 
      paymentStatus: session.payment_status 
    });

    // Get user ID from session metadata
    const userId = session.metadata?.supabase_user_id;
    const cartItems = session.metadata?.cart_items;

    if (!userId || !cartItems) {
      throw new Error('Missing user ID or cart items in session metadata');
    }

    const items = JSON.parse(cartItems);
    logStep("Processing cart items for purchase records", { itemCount: items.length });

    // Get product details
    const productIds = items.map((item: any) => item.product_id);
    const { data: products, error: productsError } = await supabaseClient
      .from('products')
      .select('*')
      .in('id', productIds);

    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`);
    }

    // Create purchase records with stripe_session_id for idempotency
    const purchaseRecords = items.map((item: any) => {
      const product = products?.find(p => p.id === item.product_id);
      if (!product) {
        throw new Error(`Product ${item.product_id} not found`);
      }

      return {
        user_id: userId,
        product_id: product.id,
        product_name: product.name,
        product_type: product.type,
        product_category: product.category,
        price: product.price,
        purchase_date: new Date().toISOString(),
        stripe_session_id: session_id,
      };
    });

    const { error: insertError } = await supabaseClient
      .from('purchases')
      .insert(purchaseRecords);

    if (insertError) {
      // Handle unique constraint violation (concurrent replay)
      if (insertError.code === '23505') {
        logStep("Concurrent replay detected, returning success");
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Payment already verified' 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      throw new Error(`Failed to create purchase records: ${insertError.message}`);
    }

    logStep("Created purchase records", { recordCount: purchaseRecords.length });

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Payment verified and purchase records created',
      purchases: purchaseRecords
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in verify-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});