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
    const requestId = session.metadata?.request_id || "";
    const userId = session.metadata?.user_id || "";
    const totalPrice = session.metadata?.total_price || "";
    const basePrice = session.metadata?.base_price || "";
    const addOnsStr = session.metadata?.add_ons || "{}";
    const addOns = JSON.parse(addOnsStr);
    const customerEmail = session.customer_details?.email || session.customer_email;
    const amountTotal = session.amount_total ? (session.amount_total / 100).toFixed(2) : '0.00';
    const currency = session.currency?.toUpperCase() || 'USD';
    
    // Get payment tracking data
    const platformFeeCents = session.metadata?.platform_fee_cents || "0";
    const producerPayoutCents = session.metadata?.producer_payout_cents || "0";
    const acceptanceDeadline = session.metadata?.acceptance_deadline || null;
    const paymentIntentId = session.payment_intent as string || null;

    // Get product name from line items
    const lineItem = session.line_items?.data[0];
    const productName = lineItem?.description || tier;

    logStep("Purchase details retrieved", { 
      tier, 
      customerEmail, 
      amount: `${amountTotal} ${currency}`,
      fileCount: fileUrls.length,
      basePrice,
      totalPrice,
      addOns,
      paymentIntentId,
      acceptanceDeadline,
    });

    // Format add-ons for email display
    const addOnsList = [];
    if (addOns.wants_mixing) addOnsList.push('Professional Mixing');
    if (addOns.wants_mastering) addOnsList.push('Mastering');
    if (addOns.wants_recorded_stems) addOnsList.push('Recorded Stems');
    if (addOns.wants_analog) addOnsList.push('Analog Processing');
    if (addOns.number_of_revisions > 0) addOnsList.push(`${addOns.number_of_revisions} Revision${addOns.number_of_revisions > 1 ? 's' : ''}`);
    
    // Format genre for display
    const genreCategory = session.metadata?.genre_category || '';
    const genreDisplayNames: Record<string, string> = {
      'hip-hop': 'Hip Hop / Trap / Rap',
      'rnb': 'R&B / Soul',
      'reggae': 'Reggae / Dancehall',
      'latin': 'Latin / Reggaeton',
      'electronic': 'Electronic / EDM',
      'pop': 'Pop / Alternative',
      'rock': 'Rock / Indie',
      'world': 'World / Indigenous / Medicina',
      'other': 'Other / Mixed'
    };
    const genreDisplay = genreDisplayNames[genreCategory] || genreCategory || 'Not specified';

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
        subject: `🎵 Project Confirmed - ${tier} | HechoEnAmerica`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
            
            <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); padding: 40px 32px; text-align: center; color: white;">
                <div style="font-size: 48px; margin-bottom: 16px;">🎶</div>
                <h1 style="margin: 0 0 8px 0; font-size: 28px;">Project Confirmed!</h1>
                <p style="margin: 0; opacity: 0.9; font-size: 16px;">Your song request has been received and paid</p>
              </div>

              <!-- 48 Hour Notice -->
              <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); padding: 20px 24px; border-bottom: 1px solid #FCD34D;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="font-size: 32px;">⏰</div>
                  <div>
                    <h3 style="margin: 0 0 4px 0; color: #92400E; font-size: 16px;">What Happens Next?</h3>
                    <p style="margin: 0; color: #78350F; font-size: 14px;">
                      A producer will review and accept your project within <strong>48 hours</strong>. 
                      We'll notify you immediately when your project is matched with a producer!
                    </p>
                  </div>
                </div>
              </div>

              <!-- Project Summary -->
              <div style="padding: 24px; border-bottom: 1px solid #eee;">
                <h3 style="margin: 0 0 16px 0; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">📋 Project Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 10px 0; color: #666; width: 120px; vertical-align: top;">Tier:</td>
                    <td style="padding: 10px 0; font-weight: 600;">${tier}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #666; vertical-align: top;">Genre:</td>
                    <td style="padding: 10px 0; font-weight: 600;">${genreDisplay}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #666; vertical-align: top;">Amount Paid:</td>
                    <td style="padding: 10px 0; font-weight: 600; color: #10B981;">${currency} ${amountTotal}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #666; vertical-align: top;">Status:</td>
                    <td style="padding: 10px 0;">
                      <span style="background: #DCFCE7; color: #166534; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">✓ PAID - Awaiting Producer</span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Add-ons Section (if any) -->
              ${addOnsList.length > 0 ? `
              <div style="padding: 24px; border-bottom: 1px solid #eee;">
                <h3 style="margin: 0 0 16px 0; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">✨ Selected Add-ons</h3>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                  ${addOnsList.map(addon => `
                    <span style="background: #EDE9FE; color: #7C3AED; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 500;">${addon}</span>
                  `).join('')}
                </div>
              </div>
              ` : ''}

              <!-- Song Idea -->
              <div style="padding: 24px; border-bottom: 1px solid #eee;">
                <h3 style="margin: 0 0 12px 0; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">💡 Your Song Idea</h3>
                <div style="background: #F8F4FF; padding: 16px; border-radius: 8px; border-left: 4px solid #8B5CF6;">
                  <p style="margin: 0; color: #555; white-space: pre-wrap;">${idea}</p>
                </div>
              </div>

              <!-- Uploaded Files -->
              ${fileUrls.length > 0 ? `
              <div style="padding: 24px; border-bottom: 1px solid #eee;">
                <h3 style="margin: 0 0 12px 0; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">📁 Your Uploaded Files (${fileUrls.length})</h3>
                <div style="background: #EFF6FF; padding: 16px; border-radius: 8px;">
                  ${fileUrls.map((url: string, index: number) => {
                    const fileName = url.split('/').pop() || `File ${index + 1}`;
                    return `<p style="margin: 8px 0;"><a href="${url}" style="color: #2563EB; text-decoration: none; font-weight: 500;" target="_blank">📎 ${decodeURIComponent(fileName)}</a></p>`;
                  }).join('')}
                </div>
              </div>
              ` : ''}

              <!-- Timeline -->
              <div style="padding: 24px; border-bottom: 1px solid #eee;">
                <h3 style="margin: 0 0 16px 0; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">📆 Project Timeline</h3>
                <div style="position: relative; padding-left: 24px;">
                  <div style="position: absolute; left: 8px; top: 8px; bottom: 8px; width: 2px; background: #E5E7EB;"></div>
                  
                  <div style="position: relative; margin-bottom: 16px;">
                    <div style="position: absolute; left: -20px; width: 12px; height: 12px; background: #10B981; border-radius: 50%;"></div>
                    <p style="margin: 0; font-weight: 600; color: #10B981;">✓ Order Confirmed</p>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #666;">Payment received successfully</p>
                  </div>
                  
                  <div style="position: relative; margin-bottom: 16px;">
                    <div style="position: absolute; left: -20px; width: 12px; height: 12px; background: #F59E0B; border-radius: 50%; animation: pulse 2s infinite;"></div>
                    <p style="margin: 0; font-weight: 600; color: #F59E0B;">⏳ Awaiting Producer (48h)</p>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #666;">A producer will accept your project</p>
                  </div>
                  
                  <div style="position: relative; margin-bottom: 16px;">
                    <div style="position: absolute; left: -20px; width: 12px; height: 12px; background: #E5E7EB; border-radius: 50%;"></div>
                    <p style="margin: 0; color: #9CA3AF;">Production Begins</p>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #9CA3AF;">Your song is being created</p>
                  </div>
                  
                  <div style="position: relative;">
                    <div style="position: absolute; left: -20px; width: 12px; height: 12px; background: #E5E7EB; border-radius: 50%;"></div>
                    <p style="margin: 0; color: #9CA3AF;">Delivery</p>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #9CA3AF;">Download your finished track</p>
                  </div>
                </div>
              </div>

              <!-- CTA -->
              <div style="padding: 32px; text-align: center;">
                <a href="https://hechoenamerica.lovable.app/my-projects" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); color: white; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  Track Your Project →
                </a>
                <p style="margin: 16px 0 0 0; color: #999; font-size: 14px;">
                  View your project status and updates anytime
                </p>
              </div>

            </div>

            <!-- Footer -->
            <div style="text-align: center; padding: 24px; color: #999; font-size: 13px;">
              <p style="margin: 0 0 8px 0;">Questions? Reply to this email or contact us.</p>
              <p style="margin: 0;"><strong>LA MUSIC ES MEDICINA</strong></p>
              <p style="margin: 4px 0 0 0;">HechoEnAmerica</p>
            </div>

          </body>
          </html>
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

    // Update song request status to completed
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.57.2");
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (requestId) {
      const updateData: Record<string, any> = {
        status: 'paid',
        stripe_session_id: session_id,
        payment_intent_id: paymentIntentId,
        platform_fee_cents: parseInt(platformFeeCents),
        producer_payout_cents: parseInt(producerPayoutCents),
      };
      
      // Set acceptance deadline if available
      if (acceptanceDeadline) {
        updateData.acceptance_deadline = acceptanceDeadline;
      }
      
      const { error: updateError } = await supabaseAdmin
        .from('song_requests')
        .update(updateData)
        .eq('id', requestId);

      if (updateError) {
        logStep("Error updating song request", { error: updateError });
      } else {
        logStep("Song request updated to paid status with payment tracking");
        
        // Send Discord notification for paid request
        try {
          const { error: notifError } = await supabaseAdmin.functions.invoke('send-discord-notification', {
            body: {
              requestId: requestId,
              requestData: {
                tier,
                idea,
                fileCount: fileUrls.length
              }
            }
          });
          
          if (notifError) {
            logStep("Failed to send Discord notification", { error: notifError });
          } else {
            logStep("Discord notification sent successfully");
          }
        } catch (notifError) {
          logStep("Error sending Discord notification", { error: notifError });
        }
      }
    } else if (userId) {
      // Fallback: create new request if no requestId
      const { error: insertError } = await supabaseAdmin
        .from('song_requests')
        .insert({
          user_id: userId,
          user_email: customerEmail,
          song_idea: idea,
          tier: tier,
          price: `${currency} ${amountTotal}`,
          status: 'paid',
          file_urls: fileUrls.length > 0 ? fileUrls : null,
          stripe_session_id: session_id,
        });

      if (insertError) {
        logStep("Error creating song request record", { error: insertError });
      } else {
        logStep("Song request record created successfully");
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Payment verified and confirmation emails sent',
      purchaseDetails: {
        tier,
        productName,
        amount: `${currency} ${amountTotal}`,
        email: customerEmail,
        filesIncluded: fileUrls.length > 0,
        basePrice: basePrice ? `$${basePrice}` : null,
        totalPrice: totalPrice ? `$${totalPrice}` : null,
        addOns: addOns
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
