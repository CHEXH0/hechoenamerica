import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, details?: unknown) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[ADMIN-DELETE-USER] ${step}${d}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    // Validate the caller's JWT in code (works regardless of gateway verify_jwt).
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await callerClient.auth.getUser(token);
    if (userError || !userData?.user) {
      throw new Error(`Unauthorized: ${userError?.message || "no user"}`);
    }
    const caller = userData.user;

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify caller is an admin
    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: caller.id,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Only admins can delete users");

    const { userId } = await req.json();
    if (!userId || typeof userId !== "string") {
      throw new Error("Missing userId");
    }
    if (userId === caller.id) {
      throw new Error("You cannot delete your own account from here");
    }

    log("Deleting user", { userId, by: caller.id });

    // Resolve target email (for producer cleanup)
    const { data: targetData } = await admin.auth.admin.getUserById(userId);
    const targetEmail = targetData?.user?.email;

    // Remove related data
    await admin.from("purchases").delete().eq("user_id", userId);
    await admin.from("song_requests").delete().eq("user_id", userId);
    await admin.from("ai_song_generations").delete().eq("user_id", userId);
    await admin.from("distro_requests").delete().eq("user_id", userId);
    await admin.from("chamoy_requests").delete().eq("user_id", userId);
    await admin.from("contact_submissions").delete().eq("user_id", userId);
    await admin.from("producer_google_tokens").delete().eq("user_id", userId);
    await admin.from("user_roles").delete().eq("user_id", userId);
    await admin.from("profiles").delete().eq("id", userId);

    if (targetEmail) {
      await admin.from("producers").delete().eq("email", targetEmail);
    }

    // Delete the auth user last
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) {
      throw new Error(`Failed to delete user: ${deleteError.message}`);
    }

    log("User deleted", { userId });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
