import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SYNC-PRODUCTS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting product sync to Stripe");

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Initialize Supabase with service role key for admin access
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get all active products from Supabase
    const { data: products, error: productsError } = await supabaseClient
      .from('products')
      .select('*')
      .eq('is_active', true);

    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`);
    }

    logStep("Fetched products from Supabase", { count: products?.length });

    const results = [];

    for (const product of products || []) {
      try {
        logStep("Processing product", { id: product.id, name: product.name });

        // Check if Stripe product already exists
        const existingProducts = await stripe.products.search({
          query: `metadata['supabase_id']:'${product.id}'`,
        });

        let stripeProduct;
        
        if (existingProducts.data.length > 0) {
          stripeProduct = existingProducts.data[0];
          logStep("Found existing Stripe product", { stripeId: stripeProduct.id });
        } else {
          // Create new Stripe product
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
          logStep("Created new Stripe product", { stripeId: stripeProduct.id });
        }

        // Check if price already exists for this product
        const existingPrices = await stripe.prices.list({
          product: stripeProduct.id,
          active: true,
        });

        let stripePrice;
        
        if (existingPrices.data.length > 0) {
          stripePrice = existingPrices.data[0];
          logStep("Found existing Stripe price", { priceId: stripePrice.id });
        } else {
          // Parse price from string (assuming format like "$12.99")
          const priceStr = product.price.replace(/[$,]/g, '');
          const priceAmount = Math.round(parseFloat(priceStr) * 100); // Convert to cents

          // Create new Stripe price
          stripePrice = await stripe.prices.create({
            product: stripeProduct.id,
            unit_amount: priceAmount,
            currency: 'usd',
            metadata: {
              supabase_product_id: product.id,
            },
          });
          logStep("Created new Stripe price", { priceId: stripePrice.id, amount: priceAmount });
        }

        results.push({
          supabase_id: product.id,
          name: product.name,
          stripe_product_id: stripeProduct.id,
          stripe_price_id: stripePrice.id,
          status: 'success'
        });

      } catch (error) {
        logStep("Error processing product", { 
          productId: product.id, 
          error: error.message 
        });
        results.push({
          supabase_id: product.id,
          name: product.name,
          status: 'error',
          error: error.message
        });
      }
    }

    logStep("Sync completed", { 
      total: results.length, 
      successful: results.filter(r => r.status === 'success').length,
      errors: results.filter(r => r.status === 'error').length
    });

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Synced ${results.length} products`,
      results 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in sync-products-to-stripe", { message: errorMessage });
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});