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

    const { requestId } = await req.json();

    if (!requestId) {
      throw new Error("Missing requestId");
    }

    console.log(`Initializing revisions for request: ${requestId}`);

    // Get the song request to find number of revisions
    const { data: songRequest, error: fetchError } = await supabase
      .from("song_requests")
      .select("number_of_revisions")
      .eq("id", requestId)
      .single();

    if (fetchError) {
      console.error("Error fetching song request:", fetchError);
      throw fetchError;
    }

    const numberOfRevisions = songRequest?.number_of_revisions || 0;

    if (numberOfRevisions === 0) {
      console.log("No revisions to create for this request");
      return new Response(
        JSON.stringify({ success: true, message: "No revisions needed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if revisions already exist
    const { data: existingRevisions } = await supabase
      .from("song_revisions")
      .select("id")
      .eq("song_request_id", requestId);

    if (existingRevisions && existingRevisions.length > 0) {
      console.log("Revisions already exist for this request");
      return new Response(
        JSON.stringify({ success: true, message: "Revisions already initialized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create revision records
    const revisions = [];
    for (let i = 1; i <= numberOfRevisions; i++) {
      revisions.push({
        song_request_id: requestId,
        revision_number: i,
        status: "pending",
      });
    }

    const { error: insertError } = await supabase
      .from("song_revisions")
      .insert(revisions);

    if (insertError) {
      console.error("Error inserting revisions:", insertError);
      throw insertError;
    }

    console.log(`Successfully created ${numberOfRevisions} revisions`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Created ${numberOfRevisions} revisions`,
        count: numberOfRevisions
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
