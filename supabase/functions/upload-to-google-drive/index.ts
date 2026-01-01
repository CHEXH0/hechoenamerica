import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: Date }> {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const tokens = await response.json();

  if (tokens.error) {
    throw new Error(`Token refresh failed: ${tokens.error_description || tokens.error}`);
  }

  return {
    accessToken: tokens.access_token,
    expiresAt: new Date(Date.now() + (tokens.expires_in * 1000)),
  };
}

async function getValidAccessToken(supabase: any, userId: string): Promise<string> {
  const { data: tokenData, error } = await supabase
    .from('producer_google_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !tokenData) {
    throw new Error('Google Drive not connected. Please connect your Google Drive first.');
  }

  const expiresAt = new Date(tokenData.token_expires_at);
  const now = new Date();

  // If token expires in less than 5 minutes, refresh it
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    console.log('Token expired or expiring soon, refreshing...');
    const { accessToken, expiresAt: newExpiresAt } = await refreshAccessToken(tokenData.refresh_token);

    // Update token in database
    await supabase
      .from('producer_google_tokens')
      .update({
        access_token: accessToken,
        token_expires_at: newExpiresAt.toISOString(),
      })
      .eq('user_id', userId);

    return accessToken;
  }

  return tokenData.access_token;
}

async function uploadFileToDrive(accessToken: string, fileName: string, fileContent: Uint8Array, mimeType: string): Promise<{ id: string; webViewLink: string }> {
  // Create file metadata
  const metadata = {
    name: fileName,
    mimeType: mimeType,
  };

  // Create multipart form data
  const boundary = '-------314159265358979323846';
  const delimiter = "\r\n--" + boundary + "\r\n";
  const closeDelimiter = "\r\n--" + boundary + "--";

  // Convert file content to base64
  const base64Data = btoa(String.fromCharCode(...fileContent));

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: ' + mimeType + '\r\n' +
    'Content-Transfer-Encoding: base64\r\n\r\n' +
    base64Data +
    closeDelimiter;

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary="${boundary}"`,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google Drive upload error:', errorText);
    throw new Error(`Failed to upload to Google Drive: ${response.status}`);
  }

  return response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Verify user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Invalid authorization');
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string || file.name;

    if (!file) {
      throw new Error('No file provided');
    }

    console.log(`Uploading file "${fileName}" for user ${user.id}`);

    // Get valid access token (refreshes if needed)
    const accessToken = await getValidAccessToken(supabase, user.id);

    // Read file content
    const fileContent = new Uint8Array(await file.arrayBuffer());

    // Upload to Google Drive
    const driveFile = await uploadFileToDrive(accessToken, fileName, fileContent, file.type);

    console.log('Successfully uploaded to Google Drive:', driveFile);

    return new Response(
      JSON.stringify({
        success: true,
        fileId: driveFile.id,
        webViewLink: driveFile.webViewLink,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Upload to Google Drive error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
