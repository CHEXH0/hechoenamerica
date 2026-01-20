import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-EXPIRED-REQUESTS] ${step}${detailsStr}`);
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
    logStep("Function started - checking for expired requests");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Find all pending requests that have passed their acceptance deadline
    const now = new Date().toISOString();
    const { data: expiredRequests, error: fetchError } = await supabaseAdmin
      .from("song_requests")
      .select("id, payment_intent_id, user_email, tier, price, song_idea")
      .eq("status", "pending")
      .is("refunded_at", null)
      .not("payment_intent_id", "is", null)
      .lt("acceptance_deadline", now);

    if (fetchError) {
      throw new Error(`Failed to fetch expired requests: ${fetchError.message}`);
    }

    logStep("Found expired requests", { count: expiredRequests?.length || 0 });

    const results = {
      processed: 0,
      refunded: 0,
      errors: [] as string[],
    };

    if (!expiredRequests || expiredRequests.length === 0) {
      logStep("No expired requests to process");
      return new Response(JSON.stringify({ 
        message: "No expired requests found",
        results 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Process each expired request
    for (const request of expiredRequests) {
      results.processed++;
      
      try {
        logStep("Processing refund for request", { 
          requestId: request.id, 
          paymentIntentId: request.payment_intent_id 
        });

        // Check the payment intent status
        const paymentIntent = await stripe.paymentIntents.retrieve(request.payment_intent_id);
        
        if (paymentIntent.status === "succeeded") {
          // Create a full refund
          const refund = await stripe.refunds.create({
            payment_intent: request.payment_intent_id,
            reason: "requested_by_customer",
            metadata: {
              request_id: request.id,
              reason: "No producer accepted within 48 hours",
            },
          });

          logStep("Refund created", { 
            refundId: refund.id, 
            amount: refund.amount,
            requestId: request.id 
          });

          // Update the song request
          const { error: updateError } = await supabaseAdmin
            .from("song_requests")
            .update({
              status: "refunded",
              refunded_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", request.id);

          if (updateError) {
            throw new Error(`Failed to update request: ${updateError.message}`);
          }

          results.refunded++;
          logStep("Request marked as refunded", { requestId: request.id });

          // Send notification email to customer about the refund
          try {
            await supabaseAdmin.functions.invoke("notify-customer-status", {
              body: {
                projectId: request.id,
                customerEmail: request.user_email,
                projectTitle: `${request.tier} Song`,
                newStatus: "refunded",
                message: "No producer was available to accept your project within 48 hours. Your payment has been fully refunded. Please try again or contact support for assistance.",
              },
            });
            logStep("Customer notified of refund", { email: request.user_email });
          } catch (emailError) {
            logStep("Failed to send refund notification email", { 
              error: emailError instanceof Error ? emailError.message : String(emailError) 
            });
          }

        } else if (paymentIntent.status === "requires_capture") {
          // Payment was authorized but not captured - just cancel it
          await stripe.paymentIntents.cancel(request.payment_intent_id, {
            cancellation_reason: "abandoned",
          });
          
          const { error: updateError } = await supabaseAdmin
            .from("song_requests")
            .update({
              status: "refunded",
              refunded_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", request.id);

          if (updateError) {
            throw new Error(`Failed to update request: ${updateError.message}`);
          }

          results.refunded++;
          logStep("Authorization cancelled", { requestId: request.id });
        } else {
          logStep("Payment intent not in refundable state", { 
            requestId: request.id, 
            status: paymentIntent.status 
          });
        }
      } catch (requestError) {
        const errorMsg = `Request ${request.id}: ${requestError instanceof Error ? requestError.message : String(requestError)}`;
        results.errors.push(errorMsg);
        logStep("Error processing request", { error: errorMsg });
      }
    }

    logStep("Processing complete", results);

    return new Response(JSON.stringify({
      message: "Expired requests processed",
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-expired-requests", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
