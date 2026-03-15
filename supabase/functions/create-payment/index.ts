import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PAYMENT] ${step}${detailsStr}`);
};

// Latin American country codes for shipping restrictions
const LATIN_AMERICA_COUNTRIES = [
  "MX", "GT", "HN", "SV", "NI", "CR", "PA", // Central America
  "CO", "VE", "EC", "PE", "BO", "CL", "AR", "UY", "PY", "BR", // South America
  "DO", "PR", "HT", "JM", "TT", "BB", "BS", "BZ", "GY", "SR", // Caribbean & others
];

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

    // Try to authenticate user (optional for guest checkout)
    let user = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader && authHeader !== "Bearer ") {
      const token = authHeader.replace("Bearer ", "");
      try {
        const { data: userData } = await supabaseClient.auth.getUser(token);
        user = userData.user;
        logStep("User authenticated", { userId: user?.id, email: user?.email });
      } catch {
        logStep("Auth token invalid, proceeding as guest");
      }
    } else {
      logStep("No auth header, proceeding as guest checkout");
    }

    const { items, coupon_code } = await req.json();
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("Invalid or empty cart items");
    }

    logStep("Processing cart items", { itemCount: items.length, couponCode: coupon_code || 'none' });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // If authenticated, find or create Stripe customer
    let customerId: string | undefined;
    if (user?.email) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
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
    }

    // Get product details from Supabase to verify prices
    const productIds = items.map((item: any) => item.product_id);
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
    let hasPhysicalProduct = false;

    for (const item of items) {
      const product = products?.find((p: any) => p.id === item.product_id);
      if (!product) {
        throw new Error(`Product ${item.product_id} not found or inactive`);
      }

      // Validate stock for physical products
      const stock = product.stock ?? 100;
      const requestedQty = item.quantity || 1;
      if (product.category === "candies" && requestedQty > stock) {
        throw new Error(`Insufficient stock for ${product.name}. Only ${stock} available.`);
      }

      // Check if this is a physical product (candies category needs shipping)
      if (product.category === "candies") {
        hasPhysicalProduct = true;
      }

      // Search for Stripe price with matching supabase product id
      const prices = await stripe.prices.search({
        query: `metadata['supabase_product_id']:'${item.product_id}'`,
      });

      let priceId: string;
      const activePrice = prices.data.find((p: any) => p.active);

      if (activePrice) {
        priceId = activePrice.id;
      } else if (prices.data.length > 0) {
        const priceStr = String(product.price).replace(/[$,]/g, '');
        let desiredAmount: number;

        if (/^free$/i.test(priceStr.trim())) {
          desiredAmount = 0;
        } else {
          desiredAmount = Math.round(parseFloat(priceStr) * 100);
          if (!Number.isFinite(desiredAmount) || desiredAmount < 0) {
            throw new Error(`Invalid product price for ${product.id}: ${product.price}`);
          }
        }

        const anyPrice: any = prices.data[0];
        if (typeof anyPrice.unit_amount === 'number' && anyPrice.unit_amount === desiredAmount) {
          await stripe.prices.update(anyPrice.id, { active: true });
          priceId = anyPrice.id;
          logStep("Reactivated existing Stripe price", { priceId, amount: desiredAmount });
        } else {
          const stripeProductId = typeof anyPrice.product === 'string' ? anyPrice.product : anyPrice.product.id;
          const newPrice = await stripe.prices.create({
            product: stripeProductId,
            unit_amount: desiredAmount,
            currency: 'usd',
            metadata: { supabase_product_id: product.id },
          });
          priceId = newPrice.id;
          logStep("Created new active Stripe price", { priceId, amount: desiredAmount });
        }
      } else {
        logStep("No existing Stripe price found, creating...", { productId: item.product_id });

        const existingProducts = await stripe.products.search({
          query: `metadata['supabase_id']:'${product.id}'`,
        });

        let stripeProduct = existingProducts.data[0];
        if (!stripeProduct) {
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
              } catch (_) {}
            }
          }

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
          logStep("Created Stripe product on-the-fly", { stripeProductId: stripeProduct.id });
        }

        const priceStr = String(product.price).replace(/[$,]/g, '');
        let priceAmount: number;
        
        if (/^free$/i.test(priceStr.trim())) {
          priceAmount = 0;
        } else {
          priceAmount = Math.round(parseFloat(priceStr) * 100);
          if (!Number.isFinite(priceAmount) || priceAmount < 0) {
            throw new Error(`Invalid product price for ${product.id}: ${product.price}`);
          }
        }

        const newPrice = await stripe.prices.create({
          product: stripeProduct.id,
          unit_amount: priceAmount,
          currency: 'usd',
          metadata: { supabase_product_id: product.id },
        });
        priceId = newPrice.id;
        logStep("Created Stripe price on-the-fly", { priceId });
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
    const forwardedProto = req.headers.get("x-forwarded-proto") ?? "https";
    const forwardedHost = req.headers.get("x-forwarded-host") ?? "";
    const originHeader = req.headers.get("origin");
    const origin = originHeader || (forwardedHost ? `${forwardedProto}://${forwardedHost}` : "");

    // Build session options
    const sessionOptions: any = {
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/treats`,
      allow_promotion_codes: !coupon_code,
      metadata: {
        supabase_user_id: user?.id || "guest",
        cart_items: JSON.stringify(items)
      },
    };

    // Set customer or allow guest email entry
    if (customerId) {
      sessionOptions.customer = customerId;
    } else {
      // Guest checkout: Stripe will collect email
      sessionOptions.customer_creation = "always";
    }

    // If physical products, collect full shipping info (Latin America only)
    if (hasPhysicalProduct) {
      sessionOptions.shipping_address_collection = {
        allowed_countries: LATIN_AMERICA_COUNTRIES,
      };
      // Collect phone number for delivery coordination
      sessionOptions.phone_number_collection = { enabled: true };
      // Always collect billing address for physical goods
      sessionOptions.billing_address_collection = "required";
    }

    // If a coupon code was provided, try to find and apply it
    if (coupon_code) {
      logStep("Looking up coupon/promotion code", { couponCode: coupon_code });
      
      try {
        const promotionCodes = await stripe.promotionCodes.list({
          code: coupon_code,
          active: true,
          limit: 1
        });

        if (promotionCodes.data.length > 0) {
          sessionOptions.discounts = [{ promotion_code: promotionCodes.data[0].id }];
          logStep("Applied promotion code", { promoCodeId: promotionCodes.data[0].id });
        } else {
          try {
            const coupon = await stripe.coupons.retrieve(coupon_code);
            if (coupon && coupon.valid) {
              sessionOptions.discounts = [{ coupon: coupon.id }];
              logStep("Applied coupon", { couponId: coupon.id });
            }
          } catch (couponError) {
            logStep("Coupon not found, proceeding without discount", { error: couponError });
          }
        }
      } catch (promoError) {
        logStep("Error looking up promotion code, proceeding without discount", { error: promoError });
      }
    }

    const session = await stripe.checkout.sessions.create(sessionOptions);

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
