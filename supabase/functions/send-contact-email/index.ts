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
    const { name, email, country, subject, message } = body;

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields (name, email, message)" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const toAddress = "hechoenamerica369@gmail.com"; // destination inbox

    // Render React Email template
    const html = await renderAsync(
      React.createElement(ContactFormEmail, {
        name,
        email,
        country: country ?? "Not specified",
        subject: subject || "New message from HechoEnAmerica website",
        message,
      })
    );

    const { data, error } = await resend.emails.send({
      from: "Hecho En America <onboarding@resend.dev>",
      to: [toAddress],
      reply_to: email,
      subject: subject || `New contact form message from ${name}`,
      html,
    });

    if (error) {
      console.error("Resend send error:", error);
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ ok: true, id: data?.id }), {
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