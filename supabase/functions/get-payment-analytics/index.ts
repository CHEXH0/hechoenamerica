import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-PAYMENT-ANALYTICS] ${step}${detailsStr}`);
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

    // Authenticate the request (admin only)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");

    // Check if user is admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      throw new Error("Unauthorized: Admin role required");
    }
    logStep("Admin role verified");

    // Get all song requests with payment data
    const { data: requests, error: requestsError } = await supabaseAdmin
      .from("song_requests")
      .select(`
        id,
        tier,
        price,
        status,
        payment_intent_id,
        platform_fee_cents,
        producer_payout_cents,
        producer_paid_at,
        refunded_at,
        acceptance_deadline,
        created_at,
        assigned_producer_id,
        producers(id, name, email, stripe_connect_account_id)
      `)
      .order("created_at", { ascending: false });

    if (requestsError) {
      throw new Error(`Failed to fetch requests: ${requestsError.message}`);
    }

    // Calculate analytics
    const now = new Date();
    const totalRequests = requests?.length || 0;
    
    // Pending refunds - expired but not yet refunded
    const pendingRefunds = requests?.filter(r => 
      r.status === "pending_producer" && 
      r.acceptance_deadline && 
      new Date(r.acceptance_deadline) < now && 
      !r.refunded_at
    ) || [];

    // Completed refunds
    const completedRefunds = requests?.filter(r => r.refunded_at) || [];

    // Pending payouts - completed but not yet paid
    const pendingPayouts = requests?.filter(r => 
      r.status === "completed" && 
      !r.producer_paid_at && 
      r.payment_intent_id
    ) || [];

    // Completed payouts
    const completedPayouts = requests?.filter(r => r.producer_paid_at) || [];

    // Revenue calculations
    const totalRevenue = requests?.reduce((sum, r) => {
      if (r.status !== "refunded" && !r.refunded_at) {
        return sum + (parseFloat(r.price) || 0);
      }
      return sum;
    }, 0) || 0;

    const totalPlatformFees = completedPayouts.reduce((sum, r) => 
      sum + ((r.platform_fee_cents || 0) / 100), 0
    );

    const totalProducerPayouts = completedPayouts.reduce((sum, r) => 
      sum + ((r.producer_payout_cents || 0) / 100), 0
    );

    const pendingPayoutAmount = pendingPayouts.reduce((sum, r) => {
      const price = parseFloat(r.price) || 0;
      // Estimate 85% for producer
      return sum + (price * 0.85);
    }, 0);

    // Get producers with Stripe Connect status
    const { data: producers } = await supabaseAdmin
      .from("producers")
      .select("id, name, email, stripe_connect_account_id, stripe_connect_onboarded_at");

    const producersWithConnect = producers?.filter(p => p.stripe_connect_account_id) || [];
    const producersOnboarded = producers?.filter(p => p.stripe_connect_onboarded_at) || [];

    logStep("Analytics calculated", {
      totalRequests,
      pendingRefundsCount: pendingRefunds.length,
      pendingPayoutsCount: pendingPayouts.length,
      completedPayoutsCount: completedPayouts.length,
    });

    return new Response(JSON.stringify({
      overview: {
        totalRequests,
        totalRevenue,
        totalPlatformFees,
        totalProducerPayouts,
        pendingPayoutAmount,
      },
      refunds: {
        pending: pendingRefunds.map(r => ({
          id: r.id,
          tier: r.tier,
          price: r.price,
          deadline: r.acceptance_deadline,
          createdAt: r.created_at,
        })),
        completed: completedRefunds.map(r => ({
          id: r.id,
          tier: r.tier,
          price: r.price,
          refundedAt: r.refunded_at,
          createdAt: r.created_at,
        })),
      },
      payouts: {
        pending: pendingPayouts.map(r => ({
          id: r.id,
          tier: r.tier,
          price: r.price,
          estimatedPayout: (parseFloat(r.price) || 0) * 0.85,
          producer: r.producers,
          createdAt: r.created_at,
        })),
        completed: completedPayouts.map(r => ({
          id: r.id,
          tier: r.tier,
          price: r.price,
          platformFee: (r.platform_fee_cents || 0) / 100,
          producerPayout: (r.producer_payout_cents || 0) / 100,
          paidAt: r.producer_paid_at,
          producer: r.producers,
          createdAt: r.created_at,
        })),
      },
      producers: {
        total: producers?.length || 0,
        withConnect: producersWithConnect.length,
        onboarded: producersOnboarded.length,
        list: producers?.map(p => ({
          id: p.id,
          name: p.name,
          email: p.email,
          hasConnect: !!p.stripe_connect_account_id,
          isOnboarded: !!p.stripe_connect_onboarded_at,
        })),
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in get-payment-analytics", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
