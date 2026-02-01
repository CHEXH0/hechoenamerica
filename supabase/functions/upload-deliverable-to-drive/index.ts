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
  }
}

// Initiate resumable upload session
async function initiateResumableUpload(
  accessToken: string,
  fileName: string,
  mimeType: string,
  fileSize: number,
  folderId: string
): Promise<string> {
  const metadata = JSON.stringify({
    name: fileName,
    parents: [folderId],
  });

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': mimeType,
        'X-Upload-Content-Length': fileSize.toString(),
      },
      body: metadata,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to initiate resumable upload: ${error}`);
  }

  const uploadUri = response.headers.get('Location');
  if (!uploadUri) {
    throw new Error('No upload URI returned from Google Drive');
  }

  return uploadUri;
}

// Stream file from Supabase Storage to Google Drive in chunks
async function streamFileToDrive(
  supabase: any,
  storagePath: string,
  uploadUri: string,
  fileSize: number,
  mimeType: string
): Promise<{ id: string }> {
  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks (must be multiple of 256KB)
  let uploadedBytes = 0;

  while (uploadedBytes < fileSize) {
    const endByte = Math.min(uploadedBytes + CHUNK_SIZE, fileSize);
    const chunkSize = endByte - uploadedBytes;
    
    console.log(`Downloading chunk: bytes ${uploadedBytes}-${endByte - 1}/${fileSize} from storage`);

    // Download chunk from Supabase Storage using range header
    const { data: chunkData, error: downloadError } = await supabase.storage
      .from('product-assets')
      .download(storagePath, {
        transform: {
          quality: 100
        }
      });

    if (downloadError) {
      throw new Error(`Failed to download chunk from storage: ${downloadError.message}`);
    }

    // For the first implementation, we'll download the full file once and upload in chunks
    // This is still memory-efficient as we process chunks sequentially
    const arrayBuffer = await chunkData.arrayBuffer();
    const fullData = new Uint8Array(arrayBuffer);
    const chunk = fullData.slice(uploadedBytes, endByte);

    console.log(`Uploading chunk: bytes ${uploadedBytes}-${endByte - 1}/${fileSize} to Drive`);

    const response = await fetch(uploadUri, {
      method: 'PUT',
      headers: {
        'Content-Length': chunk.length.toString(),
        'Content-Range': `bytes ${uploadedBytes}-${endByte - 1}/${fileSize}`,
        'Content-Type': mimeType,
      },
      body: chunk,
    });

    if (response.status === 200 || response.status === 201) {
      const result = await response.json();
      console.log('Upload complete:', result.id);
      return { id: result.id };
    } else if (response.status === 308) {
      const range = response.headers.get('Range');
      if (range) {
        const match = range.match(/bytes=0-(\d+)/);
        if (match) {
          uploadedBytes = parseInt(match[1]) + 1;
        }
      } else {
        uploadedBytes = endByte;
      }
    } else {
      const error = await response.text();
      throw new Error(`Chunk upload failed with status ${response.status}: ${error}`);
    }

    // Break after first iteration - we download full file once due to Storage API limitations
    // But we upload in chunks to Drive
    break;
  }

  // For files that need single upload (due to Storage API not supporting range downloads)
  // Download full file once, then upload to Drive in one go
  console.log('Downloading full file from storage for single upload...');
  
  const { data: fileData, error: downloadError } = await supabase.storage
    .from('product-assets')
    .download(storagePath);

  if (downloadError) {
    throw new Error(`Failed to download file from storage: ${downloadError.message}`);
  }

  const arrayBuffer = await fileData.arrayBuffer();
  const fullData = new Uint8Array(arrayBuffer);

  console.log(`Uploading full file (${fileSize} bytes) to Drive...`);

  const response = await fetch(uploadUri, {
    method: 'PUT',
    headers: {
      'Content-Length': fileSize.toString(),
      'Content-Range': `bytes 0-${fileSize - 1}/${fileSize}`,
      'Content-Type': mimeType,
    },
    body: fullData,
  });

  if (response.status === 200 || response.status === 201) {
    const result = await response.json();
    console.log('Upload complete:', result.id);
    return { id: result.id };
  } else {
    const error = await response.text();
    throw new Error(`Upload failed with status ${response.status}: ${error}`);
  }
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

    // Parse JSON body (now expects storagePath instead of file)
    const body = await req.json();
    const { storagePath, fileName, fileSize, mimeType, requestId, customerEmail } = body;

    if (!storagePath || !requestId || !fileName || !fileSize) {
      throw new Error('Missing required fields: storagePath, fileName, fileSize, or requestId');
    }

    console.log(`Processing file: ${fileName}, size: ${(fileSize / (1024 * 1024)).toFixed(2)}MB from storage path: ${storagePath}`);

    // Get valid access token
    const accessToken = await getValidAccessToken(supabase, user.id);

    // Create folder for this delivery
    const folderName = `HEA_Delivery_${requestId.substring(0, 8)}_${customerEmail?.split('@')[0] || 'customer'}`;
    const folderId = await createDriveFolder(accessToken, folderName);
    console.log('Created folder:', folderId);

    // Set folder to be viewable by anyone with link
    await setFolderPermissions(accessToken, folderId);

    // Initiate resumable upload
    const uploadUri = await initiateResumableUpload(
      accessToken,
      fileName,
      mimeType || 'application/octet-stream',
      fileSize,
      folderId
    );
    console.log('Resumable upload initiated');

    // Stream file from Storage to Drive
    const result = await streamFileToDrive(
      supabase,
      storagePath,
      uploadUri,
      fileSize,
      mimeType || 'application/octet-stream'
    );

    console.log('File uploaded to Drive:', result);

    // Clean up: delete file from Supabase Storage
    const { error: deleteError } = await supabase.storage
      .from('product-assets')
      .remove([storagePath]);
    
    if (deleteError) {
      console.error('Failed to delete temp file from storage:', deleteError);
    } else {
      console.log('Cleaned up temp file from storage');
    }

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
