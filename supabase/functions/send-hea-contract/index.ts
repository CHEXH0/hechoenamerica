import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const isAdmin = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin.data) throw new Error("Admin access required");

    const { projectId, sendSigned } = await req.json();
    if (!projectId) throw new Error("Missing projectId");

    // Fetch the project
    const { data: project, error: fetchError } = await supabase
      .from("hea_projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (fetchError || !project) throw new Error("Project not found");

    const APP_URL = "https://hechoenamerica.lovable.app";
    const signUrl = `${APP_URL}/sign-contract?token=${project.contract_token}`;

    // Build producer name
    let producerName = "TBD";
    if (project.assigned_producer_id) {
      const { data: producer } = await supabase
        .from("producers")
        .select("name")
        .eq("id", project.assigned_producer_id)
        .single();
      if (producer) producerName = producer.name;
    }

    const escapeHtml = (str: string) =>
      str?.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;") || "";

    const isSigned = sendSigned && project.contract_signed;
    const signedDate = project.contract_signed_at
      ? new Date(project.contract_signed_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      : "";

    // Contract + Receipt Email
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#111;border-radius:12px;overflow:hidden;border:1px solid #222;">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:40px 30px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:28px;letter-spacing:1px;">HECHO EN AMERICA</h1>
      <p style="color:#888;margin:8px 0 0;font-size:14px;">${isSigned ? "Signed Contract & Receipt" : "Music Production Contract & Receipt"}</p>
    </div>

    <!-- Content -->
    <div style="padding:30px;">
      <p style="color:#ccc;font-size:16px;line-height:1.6;">
        Hello <strong style="color:#fff;">${escapeHtml(project.full_name)}</strong>,
      </p>
      <p style="color:#aaa;font-size:14px;line-height:1.6;">
        ${isSigned
          ? "Please find below your signed contract and receipt for your records."
          : "Thank you for choosing Hecho En America. Below are the details of your project agreement."}
      </p>

      <!-- Project Details -->
      <div style="background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:20px;margin:20px 0;">
        <h2 style="color:#fff;font-size:18px;margin:0 0 16px;">Project Details</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="color:#888;padding:6px 0;font-size:14px;">Client:</td><td style="color:#fff;padding:6px 0;font-size:14px;">${escapeHtml(project.full_name)}</td></tr>
          <tr><td style="color:#888;padding:6px 0;font-size:14px;">Email:</td><td style="color:#fff;padding:6px 0;font-size:14px;">${escapeHtml(project.email)}</td></tr>
          ${project.address ? `<tr><td style="color:#888;padding:6px 0;font-size:14px;">Address:</td><td style="color:#fff;padding:6px 0;font-size:14px;">${escapeHtml(project.address)}</td></tr>` : ""}
          <tr><td style="color:#888;padding:6px 0;font-size:14px;">Producer:</td><td style="color:#fff;padding:6px 0;font-size:14px;">${escapeHtml(producerName)}</td></tr>
          <tr><td style="color:#888;padding:6px 0;font-size:14px;">Revisions:</td><td style="color:#fff;padding:6px 0;font-size:14px;">${project.number_of_revisions}</td></tr>
        </table>
      </div>

      <!-- Receipt -->
      <div style="background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:20px;margin:20px 0;">
        <h2 style="color:#fff;font-size:18px;margin:0 0 16px;">Receipt</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr style="border-bottom:1px solid #333;"><td style="color:#888;padding:10px 0;font-size:14px;">Music Production Services</td><td style="color:#fff;padding:10px 0;font-size:14px;text-align:right;">$${escapeHtml(project.price)}</td></tr>
          <tr><td style="color:#fff;padding:10px 0;font-size:16px;font-weight:bold;">Total</td><td style="color:#fff;padding:10px 0;font-size:16px;font-weight:bold;text-align:right;">$${escapeHtml(project.price)}</td></tr>
        </table>
      </div>

      ${project.details ? `
      <div style="background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:20px;margin:20px 0;">
        <h2 style="color:#fff;font-size:18px;margin:0 0 12px;">Scope of Work</h2>
        <p style="color:#aaa;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(project.details)}</p>
      </div>` : ""}

      ${project.terms ? `
      <div style="background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:20px;margin:20px 0;">
        <h2 style="color:#fff;font-size:18px;margin:0 0 12px;">Terms & Conditions</h2>
        <p style="color:#aaa;font-size:13px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(project.terms)}</p>
      </div>` : ""}

      ${isSigned ? `
      <!-- Signature Block -->
      <div style="background:#0d2818;border:1px solid #1a5c2e;border-radius:8px;padding:20px;margin:20px 0;">
        <h2 style="color:#4ade80;font-size:18px;margin:0 0 12px;">✓ Contract Signed</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="color:#888;padding:6px 0;font-size:14px;">Signed by:</td><td style="color:#fff;padding:6px 0;font-size:14px;font-weight:bold;">${escapeHtml(project.contract_signature_name || "")}</td></tr>
          <tr><td style="color:#888;padding:6px 0;font-size:14px;">Date:</td><td style="color:#fff;padding:6px 0;font-size:14px;">${signedDate}</td></tr>
        </table>
      </div>
      ` : `
      <!-- Sign CTA -->
      <div style="text-align:center;margin:30px 0;">
        <a href="${signUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:14px 40px;border-radius:8px;font-size:16px;font-weight:bold;">
          Review & Sign Contract
        </a>
        <p style="color:#666;font-size:12px;margin-top:12px;">Click the button above to review and electronically sign your contract.</p>
      </div>
      `}
    </div>

    <!-- Footer -->
    <div style="background:#0a0a0a;padding:20px 30px;text-align:center;border-top:1px solid #222;">
      <p style="color:#555;font-size:12px;margin:0;">© ${new Date().getFullYear()} Hecho En America. All rights reserved.</p>
      <p style="color:#444;font-size:11px;margin:4px 0 0;">team@hechoenamericastudio.com</p>
    </div>
  </div>
</body>
</html>`;

    const emailSubject = isSigned
      ? `Signed Contract — ${project.full_name} | HEA`
      : `Your HEA Project Contract — ${project.full_name}`;

    const emailResponse = await resend.emails.send({
      from: "Hecho En America <team@hechoenamericastudio.com>",
      to: [project.email],
      reply_to: "team@hechoenamericastudio.com",
      subject: emailSubject,
      html,
    });

    console.log("Email sent:", emailResponse);

    // Only update status if sending unsigned contract
    if (!isSigned) {
      await supabase
        .from("hea_projects")
        .update({ status: "contract_sent", receipt_sent: true })
        .eq("id", projectId);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
