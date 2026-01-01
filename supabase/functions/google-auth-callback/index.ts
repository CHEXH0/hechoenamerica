import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      console.error('Google OAuth error:', error);
      return new Response(
        `<html><body><script>window.opener.postMessage({ type: 'google-auth-error', error: '${error}' }, '*'); window.close();</script></body></html>`,
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    if (!code) {
      throw new Error('Authorization code not provided');
    }

    // Parse state to get user info
    let userId: string;
    try {
      const stateData = JSON.parse(atob(state || ''));
      userId = stateData.userId;
    } catch {
      throw new Error('Invalid state parameter');
    }

    if (!userId) {
      throw new Error('User ID not found in state');
    }

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    // Exchange code for tokens
    const redirectUri = `${supabaseUrl}/functions/v1/google-auth-callback`;
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();

    if (tokens.error) {
      console.error('Token exchange error:', tokens);
      throw new Error(tokens.error_description || tokens.error);
    }

    console.log('Successfully exchanged code for tokens');

    // Store tokens in database using service role
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    
    const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000));

    const { error: upsertError } = await supabase
      .from('producer_google_tokens')
      .upsert({
        user_id: userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt.toISOString(),
      }, { onConflict: 'user_id' });

    if (upsertError) {
      console.error('Error storing tokens:', upsertError);
      throw new Error('Failed to store tokens');
    }

    console.log('Successfully stored Google tokens for user:', userId);

    // Return success page that communicates with opener
    return new Response(
      `<html><body><script>
        window.opener.postMessage({ type: 'google-auth-success' }, '*');
        window.close();
      </script><p>Google Drive connected successfully! You can close this window.</p></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return new Response(
      `<html><body><script>window.opener.postMessage({ type: 'google-auth-error', error: '${error.message}' }, '*'); window.close();</script><p>Error: ${error.message}</p></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
});
