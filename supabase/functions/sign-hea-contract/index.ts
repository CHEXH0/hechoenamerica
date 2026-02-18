import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { token, signatureName, action } = await req.json();

    if (!token) throw new Error("Missing token");

    if (action === "fetch") {
      // Fetch project by token (public action, no auth needed)
      const { data: project, error } = await supabase
        .from("hea_projects")
        .select("id, full_name, email, address, price, terms, details, number_of_revisions, contract_signed, contract_signed_at, contract_signature_name")
        .eq("contract_token", token)
        .single();

      if (error || !project) {
        return new Response(
          JSON.stringify({ error: "Contract not found or invalid token" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, project }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "sign") {
      if (!signatureName || signatureName.trim().length < 2) {
        throw new Error("Please enter your full name as signature");
      }

      // Verify token and that contract isn't already signed
      const { data: project, error: fetchErr } = await supabase
        .from("hea_projects")
        .select("id, contract_signed")
        .eq("contract_token", token)
        .single();

      if (fetchErr || !project) throw new Error("Contract not found");
      if (project.contract_signed) throw new Error("Contract already signed");

      // Sign the contract
      const { error: updateErr } = await supabase
        .from("hea_projects")
        .update({
          contract_signed: true,
          contract_signed_at: new Date().toISOString(),
          contract_signature_name: signatureName.trim(),
          status: "contract_signed",
        })
        .eq("id", project.id);

      if (updateErr) throw updateErr;

      return new Response(
        JSON.stringify({ success: true, message: "Contract signed successfully" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Invalid action");
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
