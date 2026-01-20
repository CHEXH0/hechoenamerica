import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Refresh Google access token using refresh token
async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: Date }> {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID')!;
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')!;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  const data = await response.json();
  const expiresAt = new Date(Date.now() + (data.expires_in * 1000));

  return {
    accessToken: data.access_token,
    expiresAt,
  };
}

// Get or refresh valid access token for producer
async function getValidAccessToken(supabase: any, userId: string): Promise<string> {
  const { data: tokenData, error } = await supabase
    .from('producer_google_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !tokenData) {
    throw new Error('No Google Drive connection found. Please connect your Google Drive first.');
  }

  const expiresAt = new Date(tokenData.token_expires_at);
  const now = new Date();

  // Refresh if expires in less than 5 minutes
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    console.log('Refreshing expired token');
    const { accessToken, expiresAt: newExpiresAt } = await refreshAccessToken(tokenData.refresh_token);

    // Update token in database
    await supabase
      .from('producer_google_tokens')
      .update({
        access_token: accessToken,
        token_expires_at: newExpiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    return accessToken;
  }

  return tokenData.access_token;
}

// Create folder in Google Drive
async function createDriveFolder(accessToken: string, folderName: string): Promise<string> {
  const response = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create folder: ${error}`);
  }

  const data = await response.json();
  return data.id;
}

// Set folder permissions to allow anyone with link to view
async function setFolderPermissions(accessToken: string, folderId: string): Promise<void> {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}/permissions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      role: 'reader',
      type: 'anyone',
    }),
  });

  if (!response.ok) {
    console.error('Failed to set folder permissions:', await response.text());
    // Don't throw - the upload should still succeed
  }
}

// Upload file to Google Drive folder
async function uploadFileToDrive(
  accessToken: string, 
  fileName: string, 
  fileContent: Uint8Array, 
  mimeType: string,
  folderId: string
): Promise<{ id: string; webViewLink: string }> {
  const boundary = '-------314159265358979323846';
  
  const metadata = JSON.stringify({
    name: fileName,
    parents: [folderId],
  });

  const multipartBody = new Uint8Array([
    ...new TextEncoder().encode(
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${metadata}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: ${mimeType}\r\n\r\n`
    ),
    ...fileContent,
    ...new TextEncoder().encode(`\r\n--${boundary}--`),
  ]);

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload file: ${error}`);
  }

  return await response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('Processing upload for user:', user.id);

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const requestId = formData.get('requestId') as string;
    const customerEmail = formData.get('customerEmail') as string;

    if (!file || !requestId) {
      throw new Error('Missing file or requestId');
    }

    console.log('Uploading file:', file.name, 'for request:', requestId);

    // Get valid access token
    const accessToken = await getValidAccessToken(supabase, user.id);

    // Create folder for this delivery
    const folderName = `HEA_Delivery_${requestId.substring(0, 8)}_${customerEmail?.split('@')[0] || 'customer'}`;
    const folderId = await createDriveFolder(accessToken, folderName);
    console.log('Created folder:', folderId);

    // Set folder to be viewable by anyone with link
    await setFolderPermissions(accessToken, folderId);

    // Upload file to the folder
    const fileContent = new Uint8Array(await file.arrayBuffer());
    const result = await uploadFileToDrive(
      accessToken, 
      file.name, 
      fileContent, 
      file.type || 'application/octet-stream',
      folderId
    );

    console.log('File uploaded to Drive:', result);

    // Get folder web link
    const folderLink = `https://drive.google.com/drive/folders/${folderId}`;

    // Fetch the song request to get current data
    const { data: songRequest, error: fetchError } = await supabase
      .from('song_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError) throw fetchError;

    // Update song_request with Google Drive link and mark as completed
    const { error: updateError } = await supabase
      .from('song_requests')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (updateError) throw updateError;

    // Create/update purchase record with Drive link
    const { error: purchaseError } = await supabase
      .from('purchases')
      .upsert({
        user_id: songRequest.user_id,
        product_id: requestId,
        product_name: `Song Generation - ${songRequest.tier}`,
        product_type: 'song_generation',
        product_category: songRequest.tier,
        price: songRequest.price,
        status: 'ready',
        download_url: folderLink,
        song_idea: songRequest.song_idea,
      }, {
        onConflict: 'product_id'
      });

    if (purchaseError) {
      console.error('Purchase upsert error:', purchaseError);
    }

    // Send Discord notification with Drive link
    try {
      await supabase.functions.invoke('send-discord-notification', {
        body: {
          requestId,
          notificationType: 'file_delivered',
          driveLink: folderLink,
        }
      });
    } catch (discordError) {
      console.error('Discord notification failed:', discordError);
    }

    // Notify customer
    try {
      await supabase.functions.invoke('notify-customer-status', {
        body: {
          requestId,
          oldStatus: songRequest.status,
          newStatus: 'completed',
          driveLink: folderLink,
        }
      });
    } catch (emailError) {
      console.error('Customer email failed:', emailError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        driveLink: folderLink,
        fileId: result.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error uploading to Drive:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
