import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting payment creation");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    logStep("User authenticated", { userId: user.id, email: user.email });

    const { items } = await req.json();
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("Invalid or empty cart items");
    }

    logStep("Processing cart items", { itemCount: items.length });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if Stripe customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id }
      });
      customerId = customer.id;
      logStep("Created new Stripe customer", { customerId });
    }

    // Get product details from Supabase to verify prices
    const productIds = items.map(item => item.product_id);
    const { data: products, error: productsError } = await supabaseClient
      .from('products')
      .select('*')
      .in('id', productIds)
      .eq('is_active', true);

    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`);
    }

    logStep("Fetched product details", { productCount: products?.length });

    // Find corresponding Stripe prices for each product
    const lineItems = [];
    for (const item of items) {
      const product = products?.find(p => p.id === item.product_id);
      if (!product) {
        throw new Error(`Product ${item.product_id} not found or inactive`);
      }

      // Search for Stripe price with matching supabase product id
      const prices = await stripe.prices.search({
        query: `metadata['supabase_product_id']:'${item.product_id}' AND active:'true'`,
      });

      let priceId: string;
      if (prices.data.length === 0) {
        // No price found - create Stripe product and price on the fly based on Supabase product
        logStep("No existing Stripe price found, creating...", { productId: item.product_id });

        // Find or create Stripe product first
        const existingProducts = await stripe.products.search({
          query: `metadata['supabase_id']:'${product.id}'`,
        });

        let stripeProduct = existingProducts.data[0];
        if (!stripeProduct) {
          stripeProduct = await stripe.products.create({
            name: product.name,
            description: product.description,
            images: product.image ? [product.image] : [],
            metadata: {
              supabase_id: product.id,
              category: product.category,
              type: product.type,
            },
          });
          logStep("Created Stripe product on-the-fly", { stripeProductId: stripeProduct.id });
        }

        // Parse amount from product.price like "$12.99"
        const priceStr = String(product.price).replace(/[$,]/g, '');
        const priceAmount = Math.round(parseFloat(priceStr) * 100);
        if (!Number.isFinite(priceAmount) || priceAmount <= 0) {
          throw new Error(`Invalid product price for ${product.id}: ${product.price}`);
        }

        const newPrice = await stripe.prices.create({
          product: stripeProduct.id,
          unit_amount: priceAmount,
          currency: 'usd',
          metadata: { supabase_product_id: product.id },
        });
        priceId = newPrice.id;
        logStep("Created Stripe price on-the-fly", { priceId });
      } else {
        priceId = prices.data[0].id;
      }

      lineItems.push({
        price: priceId,
        quantity: item.quantity || 1,
      });

      logStep("Added line item", { 
        productId: item.product_id, 
        priceId, 
        quantity: item.quantity || 1 
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/treats`,
      metadata: {
        supabase_user_id: user.id,
        cart_items: JSON.stringify(items)
      },
    });

    logStep("Created checkout session", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});