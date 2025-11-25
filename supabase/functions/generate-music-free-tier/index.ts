import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";
import { HfInference } from "https://esm.sh/@huggingface/inference@2.3.2";

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

    // Get Hugging Face API key
    const hfApiKey = Deno.env.get("HUGGING_FACE_API_KEY");
    if (!hfApiKey) {
      throw new Error("HUGGING_FACE_API_KEY not configured");
    }

    // Initialize Hugging Face Inference client
    console.log("Calling Hugging Face Inference API...");
    const hf = new HfInference(hfApiKey);

    // Generate music using MusicGen
    const audioBlob = await hf.textToAudio({
      model: "facebook/musicgen-large",
      inputs: songIdea,
      parameters: {
        max_new_tokens: 256, // Roughly 10 seconds of audio
      }
    });

    console.log("Music generation complete");

    // Convert blob to base64 for storage
    const arrayBuffer = await audioBlob.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    // Create a data URL
    const songUrl = `data:audio/wav;base64,${base64Audio}`;

    // Upload to Supabase Storage for permanent storage
    const fileName = `free-tier-${requestId}.wav`;
    const { data: uploadData, error: uploadError } = await supabaseClient
      .storage
      .from('audio-samples')
      .upload(fileName, audioBlob, {
        contentType: 'audio/wav',
        upsert: true
      });

    if (uploadError) {
      console.error("Error uploading to storage:", uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabaseClient
      .storage
      .from('audio-samples')
      .getPublicUrl(fileName);
    
    const publicSongUrl = urlData.publicUrl;

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
        download_url: publicSongUrl,
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
          <a href="${publicSongUrl}" style="display: inline-block; background: #9b87f5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
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
        songUrl: publicSongUrl 
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
