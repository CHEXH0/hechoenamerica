import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StorageStats {
  totalBytes: number;
  totalFiles: number;
  userUploads: {
    bytes: number;
    files: number;
    items: Array<{
      name: string;
      size: number;
      createdAt: string;
      path: string;
    }>;
  };
  deliverables: {
    bytes: number;
    files: number;
    items: Array<{
      name: string;
      size: number;
      createdAt: string;
      path: string;
    }>;
  };
  other: {
    bytes: number;
    files: number;
    items: Array<{
      name: string;
      size: number;
      createdAt: string;
      path: string;
    }>;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is admin
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching storage stats for admin:', user.id);

    const stats: StorageStats = {
      totalBytes: 0,
      totalFiles: 0,
      userUploads: { bytes: 0, files: 0, items: [] },
      deliverables: { bytes: 0, files: 0, items: [] },
      other: { bytes: 0, files: 0, items: [] },
    };

    // List all files in product-assets bucket (the main bucket with user uploads)
    const buckets = ['product-assets', 'audio-samples', 'product-images'];
    
    for (const bucketName of buckets) {
      // List root folders
      const { data: rootItems, error: rootError } = await supabaseClient.storage
        .from(bucketName)
        .list('', { limit: 1000 });

      if (rootError) {
        console.error(`Error listing ${bucketName} root:`, rootError);
        continue;
      }

      for (const item of rootItems || []) {
        if (item.id) {
          // It's a file at root level
          const fileSize = item.metadata?.size || 0;
          stats.totalBytes += fileSize;
          stats.totalFiles += 1;
          
          if (bucketName === 'product-assets') {
            stats.other.bytes += fileSize;
            stats.other.files += 1;
            stats.other.items.push({
              name: item.name,
              size: fileSize,
              createdAt: item.created_at || '',
              path: `${bucketName}/${item.name}`,
            });
          }
        } else {
          // It's a folder - list its contents
          const folderPath = item.name;
          const { data: folderItems, error: folderError } = await supabaseClient.storage
            .from(bucketName)
            .list(folderPath, { limit: 1000 });

          if (folderError) {
            console.error(`Error listing ${bucketName}/${folderPath}:`, folderError);
            continue;
          }

          for (const file of folderItems || []) {
            if (file.id) {
              const fileSize = file.metadata?.size || 0;
              stats.totalBytes += fileSize;
              stats.totalFiles += 1;

              const fileInfo = {
                name: file.name,
                size: fileSize,
                createdAt: file.created_at || '',
                path: `${bucketName}/${folderPath}/${file.name}`,
              };

              // Categorize files
              if (bucketName === 'product-assets') {
                if (folderPath === 'song-uploads' || folderPath.startsWith('uploads/')) {
                  // User uploads (reference files)
                  stats.userUploads.bytes += fileSize;
                  stats.userUploads.files += 1;
                  stats.userUploads.items.push(fileInfo);
                } else if (folderPath === 'songs' || folderPath === 'deliverables') {
                  // Deliverables (completed songs)
                  stats.deliverables.bytes += fileSize;
                  stats.deliverables.files += 1;
                  stats.deliverables.items.push(fileInfo);
                } else {
                  stats.other.bytes += fileSize;
                  stats.other.files += 1;
                  stats.other.items.push(fileInfo);
                }
              } else {
                // Other buckets go into "other" category
                stats.other.bytes += fileSize;
                stats.other.files += 1;
                stats.other.items.push(fileInfo);
              }
            } else {
              // Nested folder - go one level deeper
              const nestedPath = `${folderPath}/${file.name}`;
              const { data: nestedItems } = await supabaseClient.storage
                .from(bucketName)
                .list(nestedPath, { limit: 1000 });

              for (const nestedFile of nestedItems || []) {
                if (nestedFile.id) {
                  const fileSize = nestedFile.metadata?.size || 0;
                  stats.totalBytes += fileSize;
                  stats.totalFiles += 1;

                  const fileInfo = {
                    name: nestedFile.name,
                    size: fileSize,
                    createdAt: nestedFile.created_at || '',
                    path: `${bucketName}/${nestedPath}/${nestedFile.name}`,
                  };

                  if (bucketName === 'product-assets') {
                    if (folderPath === 'song-uploads' || folderPath.startsWith('uploads/')) {
                      stats.userUploads.bytes += fileSize;
                      stats.userUploads.files += 1;
                      stats.userUploads.items.push(fileInfo);
                    } else if (folderPath === 'songs' || folderPath === 'deliverables') {
                      stats.deliverables.bytes += fileSize;
                      stats.deliverables.files += 1;
                      stats.deliverables.items.push(fileInfo);
                    } else {
                      stats.other.bytes += fileSize;
                      stats.other.files += 1;
                      stats.other.items.push(fileInfo);
                    }
                  } else {
                    stats.other.bytes += fileSize;
                    stats.other.files += 1;
                    stats.other.items.push(fileInfo);
                  }
                }
              }
            }
          }
        }
      }
    }

    console.log('Storage stats calculated:', {
      totalFiles: stats.totalFiles,
      totalBytes: stats.totalBytes,
      userUploads: stats.userUploads.files,
      deliverables: stats.deliverables.files,
    });

    return new Response(
      JSON.stringify({ success: true, stats }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error getting storage stats:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
