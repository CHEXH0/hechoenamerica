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

    // Require authenticated admin user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user?.email) {
      return new Response(JSON.stringify({ error: "Invalid user" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const isAdmin = userData.user.email === "hechoenamerica369@gmail.com";
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: Admins only" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

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
        
        // Prepare image URLs for product
        const origin = req.headers.get("origin") ?? "";
        let images: string[] = [];
        if (product.image) {
          const img = String(product.image);
          if (img.startsWith("http://") || img.startsWith("https://")) {
            images = [img];
          } else if (origin && img.startsWith("/")) {
            try {
              const absolute = new URL(img, origin).href;
              images = [absolute];
            } catch (_) {
              // ignore invalid URL
            }
          }
        }

        if (existingProducts.data.length > 0) {
          stripeProduct = existingProducts.data[0];
          logStep("Found existing Stripe product", { stripeId: stripeProduct.id });
          
          // Update existing product with current data
          stripeProduct = await stripe.products.update(stripeProduct.id, {
            name: product.name,
            description: product.description,
            ...(images.length ? { images } : {}),
            metadata: {
              supabase_id: product.id,
              category: product.category,
              type: product.type,
            },
          });
          logStep("Updated existing Stripe product", { stripeId: stripeProduct.id });
        } else {
          // Create new Stripe product
          stripeProduct = await stripe.products.create({
            name: product.name,
            description: product.description,
            ...(images.length ? { images } : {}),
            metadata: {
              supabase_id: product.id,
              category: product.category,
              type: product.type,
            },
          });
          logStep("Created new Stripe product", { stripeId: stripeProduct.id });
        }

        // Parse current price from Supabase
        const priceStr = product.price.replace(/[$,]/g, '');
        let currentPriceAmount;
        
        // Handle "Free" products by setting price to 0
        if (priceStr.toLowerCase() === 'free' || isNaN(parseFloat(priceStr))) {
          currentPriceAmount = 0;
          logStep("Setting free product price to 0", { productId: product.id, originalPrice: product.price });
        } else {
          currentPriceAmount = Math.round(parseFloat(priceStr) * 100); // Convert to cents
        }

        // Check if price already exists for this product
        const existingPrices = await stripe.prices.list({
          product: stripeProduct.id,
          active: true,
        });

        let stripePrice;
        
        if (existingPrices.data.length > 0) {
          const existingPrice = existingPrices.data[0];
          
          // Check if price has changed
          if (existingPrice.unit_amount === currentPriceAmount) {
            stripePrice = existingPrice;
            logStep("Found existing Stripe price (unchanged)", { priceId: stripePrice.id, amount: currentPriceAmount });
          } else {
            // Price has changed - deactivate old price and create new one
            await stripe.prices.update(existingPrice.id, { active: false });
            logStep("Deactivated old price", { oldPriceId: existingPrice.id, oldAmount: existingPrice.unit_amount });
            
            stripePrice = await stripe.prices.create({
              product: stripeProduct.id,
              unit_amount: currentPriceAmount,
              currency: 'usd',
              metadata: {
                supabase_product_id: product.id,
              },
            });
            logStep("Created new Stripe price (price changed)", { priceId: stripePrice.id, newAmount: currentPriceAmount });
          }
        } else {
          // Create new Stripe price
          stripePrice = await stripe.prices.create({
            product: stripeProduct.id,
            unit_amount: currentPriceAmount,
            currency: 'usd',
            metadata: {
              supabase_product_id: product.id,
            },
          });
          logStep("Created new Stripe price", { priceId: stripePrice.id, amount: currentPriceAmount });
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