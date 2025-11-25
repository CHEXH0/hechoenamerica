import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateMusicRequest {
  requestId: string;
  songIdea: string;
  userEmail: string;
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { requestId, songIdea, userEmail }: GenerateMusicRequest = await req.json();

    console.log("Starting music generation for request:", requestId);

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get Suno API key
    const sunoApiKey = Deno.env.get("SUNO_API_KEY");
    if (!sunoApiKey) {
      throw new Error("SUNO_API_KEY not configured");
    }

    // Call Suno AI to generate music
    console.log("Calling Suno AI API...");
    const generateResponse = await fetch("https://api.sunoaiapi.com/api/v1/gateway/generate/music", {
      method: "POST",
      headers: {
        "api-key": sunoApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: songIdea.substring(0, 80), // Limit title length
        tags: "free tier, ai generated",
        prompt: songIdea,
        mv: "chirp-v3-5", // Latest Suno model
        continue_at: 0,
        continue_clip_id: null
      }),
    });

    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      console.error("Suno API error:", errorText);
      throw new Error(`Suno API failed: ${generateResponse.status} - ${errorText}`);
    }

    const generateData = await generateResponse.json();
    console.log("Generation started:", generateData);

    const taskIds = generateData.data?.task_id || generateData.data?.map((item: any) => item.id);
    if (!taskIds || taskIds.length === 0) {
      throw new Error("No task ID returned from Suno API");
    }

    const taskId = Array.isArray(taskIds) ? taskIds[0] : taskIds;

    // Poll for completion (max 5 minutes, check every 10 seconds)
    console.log("Polling for completion, task ID:", taskId);
    let songUrl = null;
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes

    while (!songUrl && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      attempts++;

      const statusResponse = await fetch(`https://api.sunoaiapi.com/api/v1/gateway/query?ids=${taskId}`, {
        method: "GET",
        headers: {
          "api-key": sunoApiKey,
        },
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log(`Poll attempt ${attempts}:`, statusData);

        const songs = Array.isArray(statusData) ? statusData : [statusData];
        const completedSong = songs.find((s: any) => s.status === "complete" && s.audio_url);

        if (completedSong) {
          songUrl = completedSong.audio_url;
          console.log("Song generation complete:", songUrl);
          break;
        }
      }
    }

    if (!songUrl) {
      throw new Error("Song generation timed out or failed");
    }

    // Update song request with download URL
    const { error: updateError } = await supabaseClient
      .from("song_requests")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (updateError) {
      console.error("Error updating song request:", updateError);
    }

    // Create purchase record with song URL
    const { error: purchaseError } = await supabaseClient
      .from("purchases")
      .insert({
        user_id: (await supabaseClient.auth.getUser()).data.user?.id,
        product_id: "free-tier-song",
        product_name: "AI Generated Song (Free Tier)",
        product_category: "song",
        product_type: "digital",
        price: "0",
        download_url: songUrl,
        song_idea: songIdea,
        status: "completed",
      });

    if (purchaseError) {
      console.error("Error creating purchase record:", purchaseError);
    }

    // Send email with song link
    console.log("Sending email to:", userEmail);
    const emailResponse = await resend.emails.send({
      from: "HEA Music <onboarding@resend.dev>",
      to: [userEmail],
      subject: "Your AI Generated Song is Ready! 🎵",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Your Song is Ready!</h1>
          <p>Great news! Your AI-generated song has been created based on your idea:</p>
          <blockquote style="background: #f5f5f5; padding: 15px; border-left: 4px solid #9b87f5; margin: 20px 0;">
            "${songIdea}"
          </blockquote>
          <p>Click the button below to listen and download your song:</p>
          <a href="${songUrl}" style="display: inline-block; background: #9b87f5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
            🎧 Listen to Your Song
          </a>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            This song was generated using AI as part of our free tier service. Enjoy your music!
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            Want more features? Upgrade to a paid tier for professional production, mixing, mastering, and more!
          </p>
        </div>
      `,
    });

    console.log("Email sent:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Song generated and email sent successfully",
        songUrl 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error("Error in generate-music-free-tier:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to generate music",
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
