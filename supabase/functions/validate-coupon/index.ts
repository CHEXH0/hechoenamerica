import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VALIDATE-COUPON] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting coupon validation");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const { coupon_code } = await req.json();
    if (!coupon_code) {
      return new Response(JSON.stringify({ 
        valid: false, 
        message: "Coupon code is required" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Validating coupon", { couponCode: coupon_code });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Try to find the coupon as a promotion code first (user-facing codes)
    try {
      const promotionCodes = await stripe.promotionCodes.list({
        code: coupon_code,
        active: true,
        limit: 1
      });

      if (promotionCodes.data.length > 0) {
        const promoCode = promotionCodes.data[0];
        const coupon = promoCode.coupon;
        
        let discountDescription = '';
        if (coupon.percent_off) {
          discountDescription = `${coupon.percent_off}% off`;
        } else if (coupon.amount_off) {
          discountDescription = `$${(coupon.amount_off / 100).toFixed(2)} off`;
        }

        logStep("Valid promotion code found", { 
          promoCodeId: promoCode.id, 
          couponId: coupon.id,
          discount: discountDescription
        });

        return new Response(JSON.stringify({ 
          valid: true, 
          promotion_code_id: promoCode.id,
          message: `Coupon applied: ${discountDescription}`,
          discount: discountDescription
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    } catch (promoError) {
      logStep("No promotion code found, trying direct coupon lookup", { error: promoError });
    }

    // Try to find as a direct coupon (admin-created codes)
    try {
      const coupon = await stripe.coupons.retrieve(coupon_code);
      
      if (coupon && coupon.valid) {
        let discountDescription = '';
        if (coupon.percent_off) {
          discountDescription = `${coupon.percent_off}% off`;
        } else if (coupon.amount_off) {
          discountDescription = `$${(coupon.amount_off / 100).toFixed(2)} off`;
        }

        logStep("Valid coupon found", { 
          couponId: coupon.id,
          discount: discountDescription
        });

        return new Response(JSON.stringify({ 
          valid: true, 
          coupon_id: coupon.id,
          message: `Coupon applied: ${discountDescription}`,
          discount: discountDescription
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    } catch (couponError) {
      logStep("Coupon not found or invalid", { error: couponError });
    }

    return new Response(JSON.stringify({ 
      valid: false, 
      message: "Invalid or expired coupon code" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in validate-coupon", { message: errorMessage });
    return new Response(JSON.stringify({ 
      valid: false, 
      message: "Error validating coupon" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
