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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting cleanup of completed project files...');

    // Find all completed song requests that still have file_urls
    const { data: completedRequests, error: fetchError } = await supabase
      .from('song_requests')
      .select('id, file_urls, user_email, completed_at, updated_at')
      .eq('status', 'completed')
      .not('file_urls', 'is', null);

    if (fetchError) {
      console.error('Error fetching completed requests:', fetchError);
      throw fetchError;
    }

    if (!completedRequests || completedRequests.length === 0) {
      console.log('No completed requests with files to clean up');
      return new Response(
        JSON.stringify({ success: true, message: 'No files to clean up', cleaned: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${completedRequests.length} completed requests with files`);

    let totalFilesDeleted = 0;
    let totalRequestsCleaned = 0;
    const errors: string[] = [];

    for (const request of completedRequests) {
      // Only clean up files from requests completed more than 24 hours ago
      const completedDate = new Date(request.updated_at);
      const now = new Date();
      const hoursSinceCompletion = (now.getTime() - completedDate.getTime()) / (1000 * 60 * 60);

      if (hoursSinceCompletion < 24) {
        console.log(`Skipping request ${request.id} - completed only ${hoursSinceCompletion.toFixed(1)} hours ago`);
        continue;
      }

      const fileUrls = request.file_urls as string[];
      if (!fileUrls || fileUrls.length === 0) continue;

      console.log(`Processing request ${request.id} with ${fileUrls.length} files`);

      let filesDeletedForRequest = 0;

      for (const fileUrl of fileUrls) {
        try {
          // Extract file path from the signed URL
          // URL format: https://xxx.supabase.co/storage/v1/object/sign/product-assets/song-uploads/xxx/file.mp3?token=...
          const urlObj = new URL(fileUrl);
          const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/sign\/product-assets\/(.+)$/);
          
          if (pathMatch) {
            const filePath = decodeURIComponent(pathMatch[1]);
            console.log(`Deleting file: ${filePath}`);

            const { error: deleteError } = await supabase.storage
              .from('product-assets')
              .remove([filePath]);

            if (deleteError) {
              console.error(`Error deleting file ${filePath}:`, deleteError);
              errors.push(`Failed to delete ${filePath}: ${deleteError.message}`);
            } else {
              filesDeletedForRequest++;
              totalFilesDeleted++;
              console.log(`Successfully deleted: ${filePath}`);
            }
          } else {
            console.log(`Could not extract path from URL: ${fileUrl.substring(0, 100)}...`);
          }
        } catch (urlError) {
          console.error(`Error processing URL:`, urlError);
          errors.push(`URL parsing error: ${urlError}`);
        }
      }

      // Clear the file_urls array in the database if any files were deleted
      if (filesDeletedForRequest > 0) {
        const { error: updateError } = await supabase
          .from('song_requests')
          .update({ 
            file_urls: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', request.id);

        if (updateError) {
          console.error(`Error clearing file_urls for request ${request.id}:`, updateError);
          errors.push(`Failed to update request ${request.id}: ${updateError.message}`);
        } else {
          totalRequestsCleaned++;
          console.log(`Cleared file_urls for request ${request.id}`);
        }
      }
    }

    const summary = {
      success: true,
      message: `Cleanup complete`,
      totalFilesDeleted,
      totalRequestsCleaned,
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log('Cleanup summary:', summary);

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in cleanup-completed-files:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
