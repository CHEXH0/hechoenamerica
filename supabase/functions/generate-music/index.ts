import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Parse service account credentials and get access token
async function getAccessToken(): Promise<string> {
  const credentialsJson = Deno.env.get('GOOGLE_CLOUD_CREDENTIALS');
  if (!credentialsJson) {
    throw new Error('GOOGLE_CLOUD_CREDENTIALS is not configured');
  }

  let credentials;
  try {
    credentials = JSON.parse(credentialsJson);
  } catch (e) {
    console.error("Failed to parse GOOGLE_CLOUD_CREDENTIALS JSON:", e);
    throw new Error('GOOGLE_CLOUD_CREDENTIALS contains invalid JSON');
  }

  if (!credentials.client_email || !credentials.private_key) {
    throw new Error('GOOGLE_CLOUD_CREDENTIALS is missing required fields (client_email or private_key)');
  }
  
  // Create JWT for service account authentication
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  // Encode header and claim
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const claimB64 = btoa(JSON.stringify(claim)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const signatureInput = `${headerB64}.${claimB64}`;

  // Import private key and sign
  const privateKeyPem = credentials.private_key;
  const pemContents = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(signatureInput)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const jwt = `${signatureInput}.${signatureB64}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    console.error("Token exchange failed:", error);
    throw new Error(`Failed to get access token: ${error}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const projectId = Deno.env.get('GOOGLE_CLOUD_PROJECT_ID');
    if (!projectId) {
      throw new Error('GOOGLE_CLOUD_PROJECT_ID is not configured');
    }

    const body = await req.json();
    console.log("Request body:", JSON.stringify(body));

    if (!body.prompt) {
      return new Response(
        JSON.stringify({ error: "Missing required field: prompt is required" }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log("Getting access token...");
    const accessToken = await getAccessToken();
    console.log("Access token obtained successfully");

    console.log("Generating music with Lyria 2, prompt:", body.prompt);
    
    // Use the correct Vertex AI endpoint format for Lyria 2
    const location = "us-central1";
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/lyria-002:predict`;

    console.log("Calling endpoint:", endpoint);

    const requestBody = {
      instances: [{ 
        prompt: body.prompt,
        // Optional: add negative_prompt to filter out unwanted elements
        // negative_prompt: "vocals, distortion, noise"
      }],
      parameters: {
        // Generate one sample by default
        sample_count: 1
      }
    };

    console.log("Request payload:", JSON.stringify(requestBody));

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody)
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lyria API error:", response.status, errorText);
      
      // Parse the error to provide better user feedback
      try {
        const errorData = JSON.parse(errorText);
        const errorMessage = errorData.error?.message || errorText;
        
        // Check for common error types
        if (errorMessage.includes("recitation") || errorMessage.includes("blocked") || errorMessage.includes("Music generation failed")) {
          return new Response(JSON.stringify({ 
            error: "⚠️ Cannot reference specific songs or artists. Describe your music using mood, tempo, genre, and instruments instead. Example: 'energetic reggaeton with tropical synths and punchy drums at 95 BPM'",
            errorType: "CONTENT_FILTER"
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          });
        }

        // Check for quota/permission errors
        if (errorMessage.includes("quota") || errorMessage.includes("QUOTA_EXCEEDED")) {
          return new Response(JSON.stringify({ 
            error: "API quota exceeded. Please try again later.",
            errorType: "QUOTA_EXCEEDED"
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 429,
          });
        }

        if (errorMessage.includes("permission") || errorMessage.includes("PERMISSION_DENIED") || response.status === 403) {
          console.error("Permission denied - check if Lyria API is enabled and service account has access");
          return new Response(JSON.stringify({ 
            error: "API access denied. Please contact support.",
            errorType: "PERMISSION_DENIED"
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403,
          });
        }

        if (response.status === 404) {
          console.error("API endpoint not found - Lyria API may not be enabled for this project");
          return new Response(JSON.stringify({ 
            error: "Music generation service is currently unavailable.",
            errorType: "SERVICE_UNAVAILABLE"
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 503,
          });
        }
      } catch (parseError) {
        // If parsing fails, use the raw error
        console.error("Error parsing API response:", parseError);
      }
      
      throw new Error(`Lyria API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Lyria response received, predictions count:", data.predictions?.length);

    // Lyria returns audio as base64-encoded data
    if (data.predictions && data.predictions.length > 0) {
      const prediction = data.predictions[0];
      
      // The response format may vary - handle different possible structures
      let audioData = prediction.bytesBase64Encoded || prediction.audio || prediction.audioContent || prediction;
      
      // If audioData is an object, try to extract the audio
      if (typeof audioData === 'object') {
        audioData = audioData.bytesBase64Encoded || audioData.audio || audioData.audioContent || JSON.stringify(audioData);
        console.log("Extracted audio from object structure");
      }
      
      console.log("Audio data type:", typeof audioData);
      console.log("Audio data length:", typeof audioData === 'string' ? audioData.length : 'N/A');

      return new Response(JSON.stringify({ 
        output: audioData,
        status: 'succeeded',
        format: 'wav' // Lyria typically returns WAV format
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    console.error("No predictions in response:", JSON.stringify(data));
    throw new Error("No audio generated from Lyria API");

  } catch (error) {
    console.error("Error in generate-music function:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "An unexpected error occurred",
      errorType: "INTERNAL_ERROR"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
