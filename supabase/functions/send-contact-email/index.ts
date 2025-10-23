import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { ContactFormEmail } from './_templates/contact-form.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactPayload {
  name: string;
  email: string;
  country?: string;
  subject?: string;
  message: string;
  fileUrls?: string[];
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const body = (await req.json()) as ContactPayload;
    const { name, email, country, subject, message, fileUrls } = body;

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields (name, email, message)" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const toAddress = "hechoenamerica369@gmail.com"; // destination inbox

    // Add file links to message if provided
    let fullMessage = message;
    if (fileUrls && fileUrls.length > 0) {
      fullMessage += "\n\n=== Attached Files ===\n";
      fileUrls.forEach((url, index) => {
        const fileName = url.split('/').pop() || `File ${index + 1}`;
        fullMessage += `\n${index + 1}. ${fileName}\n   Download: ${url}`;
      });
    }

    // Render React Email template for business
    const businessHtml = await renderAsync(
      React.createElement(ContactFormEmail, {
        name,
        email,
        country: country ?? "Not specified",
        subject: subject || "New message from HechoEnAmerica website",
        message: fullMessage,
      })
    );

    // Send to business email
    const { error: businessError } = await resend.emails.send({
      from: "Hecho En America <onboarding@resend.dev>",
      to: [toAddress],
      reply_to: email,
      subject: subject || `New contact form message from ${name}`,
      html: businessHtml,
    });

    if (businessError) {
      console.error("Resend send error (business):", businessError);
      return new Response(JSON.stringify({ error: String(businessError) }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Send confirmation to user
    const userMessage = `Thank you for your submission!\n\nWe've received your request:\n\n${message}`;
    const userHtml = await renderAsync(
      React.createElement(ContactFormEmail, {
        name: "HechoEnAmerica Team",
        email: toAddress,
        country: "Confirmation",
        subject: "Request Received - HechoEnAmerica",
        message: fileUrls && fileUrls.length > 0 
          ? `${userMessage}\n\nYour uploaded files:\n${fileUrls.map((url, i) => `${i + 1}. ${url}`).join('\n')}`
          : userMessage,
      })
    );

    const { error: userError } = await resend.emails.send({
      from: "Hecho En America <onboarding@resend.dev>",
      to: [email],
      subject: "Your Request Has Been Received",
      html: userHtml,
    });

    if (userError) {
      console.error("User confirmation email failed:", userError);
      // Don't fail the request if user email fails
    }

    return new Response(JSON.stringify({ ok: true, sentToUser: !userError }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    console.error("send-contact-email error:", err);
    return new Response(JSON.stringify({ error: err?.message || "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});