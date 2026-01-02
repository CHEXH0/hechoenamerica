import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Replicate from "https://esm.sh/replicate@0.25.2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY')
    if (!REPLICATE_API_KEY) {
      console.error('REPLICATE_API_KEY is not set')
      throw new Error('REPLICATE_API_KEY is not configured')
    }

    const replicate = new Replicate({
      auth: REPLICATE_API_KEY,
    })

    const body = await req.json()
    console.log("Request body:", JSON.stringify(body))

    // If it's a status check request
    if (body.predictionId) {
      console.log("Checking status for prediction:", body.predictionId)
      const prediction = await replicate.predictions.get(body.predictionId)
      console.log("Status check response:", prediction.status)
      return new Response(JSON.stringify(prediction), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // If it's a generation request
    if (!body.prompt) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required field: prompt is required" 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    console.log("Generating music with prompt:", body.prompt)
    
    // Use MusicGen model - facebook/musicgen for music generation
    // Duration in seconds (default 8, max 30 for free tier)
    const duration = Math.min(body.duration || 15, 30)
    
    // Start prediction (async mode for longer generations)
    const prediction = await replicate.predictions.create({
      version: "671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb",
      input: {
        prompt: body.prompt,
        duration: duration,
        model_version: "stereo-melody-large",
        output_format: "mp3",
        normalization_strategy: "peak"
      }
    })

    console.log("Prediction created:", prediction.id, "Status:", prediction.status)

    // If prediction completed immediately
    if (prediction.status === 'succeeded') {
      return new Response(JSON.stringify({ 
        output: prediction.output,
        status: 'succeeded'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Return prediction ID for polling
    return new Response(JSON.stringify({ 
      predictionId: prediction.id,
      status: prediction.status
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 202, // Accepted - processing
    })

  } catch (error) {
    console.error("Error in generate-music function:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
