import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

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

    const html = `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height: 1.6;">
        <h2 style="margin: 0 0 12px;">New Contact Form Submission</h2>
        <p style="margin: 0 0 8px;"><strong>Name:</strong> ${name}</p>
        <p style="margin: 0 0 8px;"><strong>Email:</strong> ${email}</p>
        <p style="margin: 0 0 8px;"><strong>Country:</strong> ${country ?? "Not specified"}</p>
        <p style="margin: 16px 0 8px;"><strong>Subject:</strong> ${subject || "New message from HechoEnAmerica website"}</p>
        <p style="white-space: pre-wrap; margin: 8px 0 0;">${message}</p>
      </div>
    `;

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