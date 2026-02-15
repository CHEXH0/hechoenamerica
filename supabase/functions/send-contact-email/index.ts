import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { ContactFormEmail } from './_templates/contact-form.tsx';
import { ProducerApplicationEmail } from './_templates/producer-application.tsx';
import { ProducerApplicationConfirmation } from './_templates/producer-application-confirmation.tsx';

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
  // Producer application specific fields
  isProducerApplication?: boolean;
  genres?: string[];
  bio?: string;
  imageUrl?: string;
  spotifyUrl?: string;
  youtubeUrl?: string;
  appleMusicUrl?: string;
  instagramUrl?: string;
  websiteUrl?: string;
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
    const { 
      name, 
      email, 
      country, 
      subject, 
      message, 
      fileUrls,
      isProducerApplication,
      genres,
      bio,
      imageUrl,
      spotifyUrl,
      youtubeUrl,
      appleMusicUrl,
      instagramUrl,
      websiteUrl,
    } = body;

    // Input validation
    if (!name || !email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields (name, email)" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Length limits
    if (typeof name !== 'string' || name.length > 100) {
      return new Response(
        JSON.stringify({ error: "Name must be under 100 characters" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    if (email.length > 255) {
      return new Response(
        JSON.stringify({ error: "Email must be under 255 characters" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    if (message && message.length > 10000) {
      return new Response(
        JSON.stringify({ error: "Message must be under 10000 characters" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    if (subject && subject.length > 200) {
      return new Response(
        JSON.stringify({ error: "Subject must be under 200 characters" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    if (fileUrls && fileUrls.length > 10) {
      return new Response(
        JSON.stringify({ error: "Too many file attachments (max 10)" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate file URLs are from expected Supabase storage domain
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    if (fileUrls && fileUrls.length > 0) {
      for (const url of fileUrls) {
        if (typeof url !== 'string' || !url.startsWith(supabaseUrl)) {
          return new Response(
            JSON.stringify({ error: "Invalid file URL" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
      }
    }

    // Sanitize inputs for HTML email rendering
    const sanitize = (text: string) => text.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const toAddress = "hechoenamerica369@gmail.com";

    // Handle Producer Application
    if (isProducerApplication) {
      if (!genres || !bio || !country) {
        return new Response(
          JSON.stringify({ error: "Missing required producer application fields" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      console.log("Processing producer application from:", sanitize(name));

      // Render business email with sanitized application details
      const businessHtml = await renderAsync(
        React.createElement(ProducerApplicationEmail, {
          name: sanitize(name),
          email: sanitize(email),
          country: sanitize(country),
          genres: genres.map(g => sanitize(g)),
          bio: sanitize(bio),
          imageUrl: imageUrl || "",
          spotifyUrl: spotifyUrl || undefined,
          youtubeUrl: youtubeUrl || undefined,
          appleMusicUrl: appleMusicUrl || undefined,
          instagramUrl: instagramUrl || undefined,
          websiteUrl: websiteUrl || undefined,
        })
      );

      // Send to business email
      const { error: businessError } = await resend.emails.send({
        from: "Hecho En America <team@hechoenamericastudio.com>",
      to: [toAddress],
      reply_to: email,
      subject: `🎵 New Producer Application: ${sanitize(name)}`,
        html: businessHtml,
      });

      if (businessError) {
        console.error("Resend send error (business):", businessError);
        return new Response(JSON.stringify({ error: String(businessError) }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Render and send confirmation email to applicant
      const confirmationHtml = await renderAsync(
        React.createElement(ProducerApplicationConfirmation, { name: sanitize(name) })
      );

      const { error: confirmError } = await resend.emails.send({
        from: "Hecho En America <team@hechoenamericastudio.com>",
        to: [email],
        subject: "🎉 Application Received - Hecho En América",
        html: confirmationHtml,
      });

      if (confirmError) {
        console.error("User confirmation email failed:", confirmError);
      }

      console.log("Producer application emails sent successfully");

      return new Response(JSON.stringify({ ok: true, sentToUser: !confirmError }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Handle regular contact form
    if (!message) {
      return new Response(
        JSON.stringify({ error: "Missing required field (message)" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Add file links to message if provided
    let fullMessage = sanitize(message);
    if (fileUrls && fileUrls.length > 0) {
      fullMessage += "\n\n=== Attached Files ===\n";
      fileUrls.forEach((url, index) => {
        const fileName = sanitize(url.split('/').pop() || `File ${index + 1}`);
        fullMessage += `\n${index + 1}. ${fileName}\n   Download: ${url}`;
      });
    }

    // Render React Email template for business
    const businessHtml = await renderAsync(
      React.createElement(ContactFormEmail, {
        name: sanitize(name),
        email: sanitize(email),
        country: sanitize(country ?? "Not specified"),
        subject: sanitize(subject || "New message from HechoEnAmerica website"),
        message: fullMessage,
      })
    );

    // Send to business email
    const { error: businessError } = await resend.emails.send({
      from: "Hecho En America <team@hechoenamericastudio.com>",
      to: [toAddress],
      reply_to: email,
      subject: sanitize(subject || `New contact form message from ${name}`),
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
    const userMessage = `Thank you for your submission!\n\nWe've received your request:\n\n${sanitize(message)}`;
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
      from: "Hecho En America <team@hechoenamericastudio.com>",
      to: [email],
      subject: "Your Request Has Been Received",
      html: userHtml,
    });

    if (userError) {
      console.error("User confirmation email failed:", userError);
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