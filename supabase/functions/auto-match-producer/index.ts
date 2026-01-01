import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[AUTO-MATCH-PRODUCER] ${step}${detailsStr}`);
};

// Genre mapping: maps user genre selections to producer specialty keywords
const genreKeywordMap: Record<string, string[]> = {
  "hip-hop": ["hip hop", "trap", "rap", "hiphop"],
  "rnb": ["r&b", "rnb", "soul", "alternative r&b"],
  "reggae": ["reggae", "dancehall", "dub"],
  "latin": ["latin", "reggaeton", "bachata", "salsa"],
  "electronic": ["electronic", "edm", "house", "techno"],
  "pop": ["pop", "alternative", "indie pop"],
  "rock": ["rock", "indie", "alternative rock"],
  "world": ["world", "indigenous", "medicina", "musica medicina"],
  "other": [],
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { requestId } = await req.json();
    if (!requestId) {
      throw new Error("Request ID is required");
    }
    logStep("Processing request", { requestId });

    // Get the song request
    const { data: request, error: requestError } = await supabaseClient
      .from("song_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (requestError || !request) {
      throw new Error(`Failed to fetch request: ${requestError?.message}`);
    }
    logStep("Found request", { genre: request.genre_category, tier: request.tier });

    // Get all producers
    const { data: producers, error: producersError } = await supabaseClient
      .from("producers")
      .select("id, name, genre");

    if (producersError || !producers || producers.length === 0) {
      throw new Error("No producers available");
    }
    logStep("Found producers", { count: producers.length });

    // Find matching producer based on genre
    let matchedProducer = null;
    const genreCategory = request.genre_category;

    if (genreCategory && genreKeywordMap[genreCategory]) {
      const keywords = genreKeywordMap[genreCategory];
      
      // Score each producer based on keyword matches
      const scoredProducers = producers.map(producer => {
        const producerGenre = (producer.genre || "").toLowerCase();
        let score = 0;
        
        for (const keyword of keywords) {
          if (producerGenre.includes(keyword)) {
            score += 1;
          }
        }
        
        return { ...producer, score };
      });

      // Sort by score and pick highest
      scoredProducers.sort((a, b) => b.score - a.score);
      
      if (scoredProducers[0].score > 0) {
        matchedProducer = scoredProducers[0];
        logStep("Matched producer by genre", { 
          producer: matchedProducer.name, 
          score: matchedProducer.score 
        });
      }
    }

    // If no genre match, pick random producer
    if (!matchedProducer) {
      matchedProducer = producers[Math.floor(Math.random() * producers.length)];
      logStep("No genre match, assigned random producer", { producer: matchedProducer.name });
    }

    // Update the request with the assigned producer
    const { error: updateError } = await supabaseClient
      .from("song_requests")
      .update({ assigned_producer_id: matchedProducer.id })
      .eq("id", requestId);

    if (updateError) {
      throw new Error(`Failed to assign producer: ${updateError.message}`);
    }

    logStep("Producer assigned successfully", { 
      requestId, 
      producerId: matchedProducer.id,
      producerName: matchedProducer.name 
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        producerId: matchedProducer.id,
        producerName: matchedProducer.name 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
