import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CleanupRequest {
  action: 'delete_files' | 'run_cleanup' | 'delete_completed_uploads';
  filePaths?: string[]; // For delete_files action
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

    const body: CleanupRequest = await req.json();
    const { action, filePaths } = body;

    console.log('Admin cleanup action:', action, 'by user:', user.id);

    let result: any = {};

    switch (action) {
      case 'delete_files': {
        if (!filePaths || filePaths.length === 0) {
          return new Response(
            JSON.stringify({ error: 'No file paths provided' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const deleted: string[] = [];
        const errors: string[] = [];

        for (const fullPath of filePaths) {
          // Parse bucket and path from full path like "product-assets/songs/file.mp3"
          const parts = fullPath.split('/');
          const bucket = parts[0];
          const filePath = parts.slice(1).join('/');

          const { error } = await supabaseClient.storage
            .from(bucket)
            .remove([filePath]);

          if (error) {
            console.error(`Failed to delete ${fullPath}:`, error);
            errors.push(`${fullPath}: ${error.message}`);
          } else {
            deleted.push(fullPath);
            console.log(`Deleted: ${fullPath}`);
          }
        }

        result = {
          success: true,
          deleted,
          errors,
          message: `Deleted ${deleted.length} files. ${errors.length} errors.`,
        };
        break;
      }

      case 'run_cleanup': {
        // Run the same cleanup logic as the scheduled job
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const { data: completedRequests, error: fetchError } = await supabaseClient
          .from('song_requests')
          .select('id, file_urls, updated_at')
          .eq('status', 'completed')
          .not('file_urls', 'is', null);

        if (fetchError) {
          throw fetchError;
        }

        let filesDeleted = 0;
        let requestsUpdated = 0;
        const errors: string[] = [];

        for (const request of completedRequests || []) {
          const updatedAt = new Date(request.updated_at);
          const cutoffDate = new Date(twentyFourHoursAgo);

          if (updatedAt < cutoffDate && request.file_urls && request.file_urls.length > 0) {
            // Extract file paths from signed URLs
            const filePaths: string[] = [];
            for (const signedUrl of request.file_urls) {
              try {
                const url = new URL(signedUrl);
                const pathMatch = url.pathname.match(/\/storage\/v1\/object\/sign\/product-assets\/(.+)/);
                if (pathMatch) {
                  filePaths.push(decodeURIComponent(pathMatch[1].split('?')[0]));
                }
              } catch (e) {
                console.error('Failed to parse URL:', signedUrl, e);
              }
            }

            if (filePaths.length > 0) {
              const { error: deleteError } = await supabaseClient.storage
                .from('product-assets')
                .remove(filePaths);

              if (deleteError) {
                errors.push(`Request ${request.id}: ${deleteError.message}`);
              } else {
                filesDeleted += filePaths.length;

                // Clear file_urls in the database
                await supabaseClient
                  .from('song_requests')
                  .update({ file_urls: null })
                  .eq('id', request.id);

                requestsUpdated++;
              }
            }
          }
        }

        result = {
          success: true,
          filesDeleted,
          requestsUpdated,
          errors,
          message: `Cleanup complete. Deleted ${filesDeleted} files from ${requestsUpdated} requests.`,
        };
        break;
      }

      case 'delete_completed_uploads': {
        // Delete all user uploads from completed song requests
        const { data: completedRequests, error: fetchError } = await supabaseClient
          .from('song_requests')
          .select('id, file_urls')
          .eq('status', 'completed')
          .not('file_urls', 'is', null);

        if (fetchError) {
          throw fetchError;
        }

        let filesDeleted = 0;
        let requestsUpdated = 0;
        const errors: string[] = [];

        for (const request of completedRequests || []) {
          if (request.file_urls && request.file_urls.length > 0) {
            const filePaths: string[] = [];
            for (const signedUrl of request.file_urls) {
              try {
                const url = new URL(signedUrl);
                const pathMatch = url.pathname.match(/\/storage\/v1\/object\/sign\/product-assets\/(.+)/);
                if (pathMatch) {
                  filePaths.push(decodeURIComponent(pathMatch[1].split('?')[0]));
                }
              } catch (e) {
                console.error('Failed to parse URL:', signedUrl, e);
              }
            }

            if (filePaths.length > 0) {
              const { error: deleteError } = await supabaseClient.storage
                .from('product-assets')
                .remove(filePaths);

              if (deleteError) {
                errors.push(`Request ${request.id}: ${deleteError.message}`);
              } else {
                filesDeleted += filePaths.length;

                await supabaseClient
                  .from('song_requests')
                  .update({ file_urls: null })
                  .eq('id', request.id);

                requestsUpdated++;
              }
            }
          }
        }

        result = {
          success: true,
          filesDeleted,
          requestsUpdated,
          errors,
          message: `Deleted ${filesDeleted} upload files from ${requestsUpdated} completed requests.`,
        };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log('Cleanup result:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in admin cleanup:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
