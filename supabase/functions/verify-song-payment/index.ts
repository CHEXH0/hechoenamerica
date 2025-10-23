import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-SONG-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting song payment verification");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY is not set");

    const { session_id } = await req.json();
    if (!session_id) {
      throw new Error("Session ID is required");
    }

    logStep("Retrieving checkout session", { sessionId: session_id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['line_items', 'line_items.data.price.product']
    });

    if (session.payment_status !== 'paid') {
      throw new Error('Payment not completed');
    }

    logStep("Payment verified as paid", { 
      sessionId: session_id, 
      paymentStatus: session.payment_status 
    });

    // Get purchase details from session
    const tier = session.metadata?.tier || 'Unknown Tier';
    const idea = session.metadata?.idea || 'No idea provided';
    const fileUrlsStr = session.metadata?.file_urls || "";
    const fileUrls = fileUrlsStr ? JSON.parse(fileUrlsStr) : [];
    const customerEmail = session.customer_details?.email || session.customer_email;
    const amountTotal = session.amount_total ? (session.amount_total / 100).toFixed(2) : '0.00';
    const currency = session.currency?.toUpperCase() || 'USD';

    // Get product name from line items
    const lineItem = session.line_items?.data[0];
    const productName = lineItem?.description || tier;

    logStep("Purchase details retrieved", { 
      tier, 
      customerEmail, 
      amount: `${amountTotal} ${currency}`,
      fileCount: fileUrls.length 
    });

    // Send confirmation email using Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'HechoEnAmerica <onboarding@resend.dev>',
        to: [customerEmail],
        subject: `Song Generation Purchase Confirmed - ${tier}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #8b5cf6;">🎶 Purchase Confirmed! 🎶</h1>
            <p>Thank you for your purchase! We've received your song generation request.</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin-top: 0; color: #374151;">Purchase Details</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #d1d5db;"><strong>Tier:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #d1d5db;">${tier}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #d1d5db;"><strong>Product:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #d1d5db;">${productName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #d1d5db;"><strong>Amount Paid:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #d1d5db;">${currency} ${amountTotal}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Payment Status:</strong></td>
                  <td style="padding: 8px 0;"><span style="color: #10b981; font-weight: bold;">✓ PAID</span></td>
                </tr>
              </table>
            </div>

            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #92400e;">Your Song Idea:</h3>
              <p style="color: #78350f; white-space: pre-wrap;">${idea}</p>
            </div>

            ${fileUrls.length > 0 ? `
              <div style="background: #e0f2fe; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #075985;">Your Uploaded Files:</h3>
                ${fileUrls.map((url: string, index: number) => {
                  const fileName = url.split('/').pop() || `File ${index + 1}`;
                  return `<p style="margin: 8px 0;"><a href="${url}" style="color: #0284c7; text-decoration: none;" target="_blank">${index + 1}. ${decodeURIComponent(fileName)}</a></p>`;
                }).join('')}
              </div>
            ` : ''}

            <p>We'll start working on your song right away. You'll receive updates at this email address.</p>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              <strong>LA MUSIC ES MEDICINA</strong><br>
              HechoEnAmerica
            </p>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const emailError = await emailResponse.text();
      logStep("Failed to send confirmation email", { error: emailError });
      throw new Error(`Failed to send email: ${emailError}`);
    }

    logStep("Confirmation email sent to user successfully");

    // Send notification to business email
    const businessEmailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'HechoEnAmerica <onboarding@resend.dev>',
        to: ['hechoenamerica369@gmail.com'],
        subject: `New Song Purchase - ${tier}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #8b5cf6;">🎶 New Song Generation Purchase 🎶</h1>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin-top: 0; color: #374151;">Order Details</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #d1d5db;"><strong>Customer:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #d1d5db;">${customerEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #d1d5db;"><strong>Tier:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #d1d5db;">${tier}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #d1d5db;"><strong>Product:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #d1d5db;">${productName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Amount Paid:</strong></td>
                  <td style="padding: 8px 0;"><strong>${currency} ${amountTotal}</strong></td>
                </tr>
              </table>
            </div>

            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #92400e;">Customer's Song Idea:</h3>
              <p style="color: #78350f; white-space: pre-wrap;">${idea}</p>
            </div>

            ${fileUrls.length > 0 ? `
              <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #1e40af;">Uploaded Files (${fileUrls.length}):</h3>
                ${fileUrls.map((url: string, index: number) => {
                  const fileName = url.split('/').pop() || `File ${index + 1}`;
                  return `<p style="margin: 8px 0;"><a href="${url}" style="color: #2563eb; text-decoration: none; font-weight: 500;" target="_blank">${index + 1}. Download: ${decodeURIComponent(fileName)}</a></p>`;
                }).join('')}
              </div>
            ` : '<p style="color: #6b7280;">No files were uploaded with this order.</p>'}
          </div>
        `,
      }),
    });

    if (!businessEmailResponse.ok) {
      logStep("Failed to send business notification email");
    } else {
      logStep("Business notification email sent successfully");
    }

    logStep("All emails sent successfully");

    // Create purchase record with pending status
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.57.2");
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { error: purchaseError } = await supabaseAdmin
      .from('purchases')
      .insert({
        user_id: session.client_reference_id,
        product_id: session.id,
        product_name: productName || 'Song Generation',
        product_type: 'Song Generation',
        product_category: tier || 'Custom',
        price: `${currency} ${amountTotal}`,
        status: 'pending',
        song_idea: idea,
        file_urls: fileUrls,
        purchase_date: new Date().toISOString(),
      });

    if (purchaseError) {
      logStep("Error creating purchase record", { error: purchaseError });
    } else {
      logStep("Purchase record created successfully");
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Payment verified and confirmation emails sent',
      purchaseDetails: {
        tier,
        productName,
        amount: `${currency} ${amountTotal}`,
        email: customerEmail,
        filesIncluded: fileUrls.length > 0
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in verify-song-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
