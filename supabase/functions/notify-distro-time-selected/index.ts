import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@^4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APP_URL = "https://hechoenamericastudio.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Validate caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (authError || !user) throw new Error("Unauthorized");

    const { distroRequestId } = await req.json();
    if (!distroRequestId) throw new Error("Missing distroRequestId");

    const { data: distro, error: dErr } = await supabase
      .from("distro_requests")
      .select("id, user_email, client_selected_time, google_meet_link, song_request_id")
      .eq("id", distroRequestId)
      .maybeSingle();
    if (dErr || !distro) throw new Error("Distro request not found");

    // Caller must own this distro request
    if (distro.user_email && user.email && distro.user_email !== user.email) {
      throw new Error("Forbidden");
    }

    let songTier = "";
    let genre = "";
    if (distro.song_request_id) {
      const { data: song } = await supabase
        .from("song_requests")
        .select("tier, genre_category")
        .eq("id", distro.song_request_id)
        .maybeSingle();
      songTier = song?.tier || "";
      genre = song?.genre_category || "";
    }

    // Collect support team emails
    const { data: supportRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "support");

    const supportEmails: string[] = [];
    for (const r of supportRoles || []) {
      const { data: u } = await supabase.auth.admin.getUserById(r.user_id);
      if (u?.user?.email) supportEmails.push(u.user.email);
    }
    if (!supportEmails.includes("team@hechoenamericastudio.com")) {
      supportEmails.push("team@hechoenamericastudio.com");
    }

    const whenStr = distro.client_selected_time
      ? new Date(distro.client_selected_time).toLocaleString("en-US", {
          dateStyle: "full",
          timeStyle: "short",
        })
      : "(not provided)";

    await resend.emails.send({
      from: "HEA Support <team@hechoenamericastudio.com>",
      to: supportEmails,
      subject: `🧭 Distro consultation time picked — ${distro.user_email}`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); color: white; padding: 24px; border-radius: 12px; text-align: center;">
            <h1 style="margin: 0; font-size: 22px;">🧭 Client Picked a Time</h1>
            <p style="margin: 8px 0 0; opacity: 0.95;">A client has chosen a time for their Discover Your Distro consultation.</p>
          </div>
          <div style="background: #fff; border: 1px solid #eee; border-top: 0; padding: 24px; border-radius: 0 0 12px 12px;">
            <p><strong>Client:</strong> ${distro.user_email}</p>
            <p><strong>Requested time:</strong> ${whenStr}</p>
            ${songTier ? `<p><strong>Song tier:</strong> ${songTier}</p>` : ""}
            ${genre ? `<p><strong>Genre:</strong> ${genre}</p>` : ""}
            <p style="color:#555; font-size:14px;">Head to the Support Panel to accept this consultation. First support member to accept will own it.</p>
            <div style="margin-top: 20px; text-align:center;">
              <a href="${APP_URL}/support" style="display:inline-block; background:#7c3aed; color:white; padding:12px 28px; border-radius:8px; text-decoration:none; font-weight:600;">Open Support Panel →</a>
            </div>
            <p style="margin-top:16px; font-size:13px; color:#666;">Booking link: <a href="${distro.google_meet_link}">${distro.google_meet_link}</a></p>
          </div>
        </div>
      `,
    });

    return new Response(
      JSON.stringify({ ok: true, notified: supportEmails.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("notify-distro-time-selected error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
