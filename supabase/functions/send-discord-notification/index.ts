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
    const webhookUrl = Deno.env.get('DISCORD_WEBHOOK_URL')!;

    if (!webhookUrl) {
      throw new Error('DISCORD_WEBHOOK_URL is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { requestId, requestData } = await req.json();
    
    console.log('Processing Discord notification for request:', requestId);

    // Fetch the full request details from the database
    const { data: songRequest, error: fetchError } = await supabase
      .from('song_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError) {
      console.error('Error fetching song request:', fetchError);
      throw fetchError;
    }

    // Determine complexity level based on tier
    const complexityMap: Record<string, string> = {
      'free': 'basic',
      'basic': 'standard',
      'premium': 'premium',
      'custom': 'custom'
    };
    const complexityLevel = complexityMap[songRequest.tier.toLowerCase()] || 'standard';

    // Create Discord embed
    const embed = {
      title: "🎵 New Song Request",
      color: 0x7C3AED, // Purple color
      fields: [
        {
          name: "Request ID",
          value: `\`${requestId}\``,
          inline: true
        },
        {
          name: "Tier",
          value: songRequest.tier.toUpperCase(),
          inline: true
        },
        {
          name: "Price",
          value: songRequest.price,
          inline: true
        },
        {
          name: "Complexity",
          value: complexityLevel,
          inline: true
        },
        {
          name: "Status",
          value: songRequest.status,
          inline: true
        },
        {
          name: "Customer Email",
          value: songRequest.user_email,
          inline: true
        },
        {
          name: "Song Idea",
          value: songRequest.song_idea.substring(0, 1024) // Discord has a 1024 char limit per field
        }
      ],
      timestamp: new Date().toISOString()
    };

    // Add additional options if present
    const additionalOptions = [];
    if (songRequest.wants_recorded_stems) additionalOptions.push("✅ Recorded Stems");
    if (songRequest.wants_analog) additionalOptions.push("✅ Analog");
    if (songRequest.wants_mixing) additionalOptions.push("✅ Mixing");
    if (songRequest.wants_mastering) additionalOptions.push("✅ Mastering");
    if (songRequest.number_of_revisions > 0) {
      additionalOptions.push(`🔄 ${songRequest.number_of_revisions} Revisions`);
    }

    if (additionalOptions.length > 0) {
      embed.fields.push({
        name: "Additional Options",
        value: additionalOptions.join("\n"),
        inline: false
      });
    }

    // Add file information if present
    if (songRequest.file_urls && songRequest.file_urls.length > 0) {
      embed.fields.push({
        name: "Uploaded Files",
        value: `${songRequest.file_urls.length} file(s) attached`,
        inline: true
      });
    }

    // Add genre category for producer assignment
    if (songRequest.genre_category) {
      embed.fields.push({
        name: "Genre",
        value: songRequest.genre_category,
        inline: true
      });
    }

    // Send to Discord (with thread_name for forum channels)
    const discordResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: "🚨 New song request requires producer assignment!",
        embeds: [embed],
        thread_name: `Song Request ${songRequest.tier} - ${requestId.substring(0, 8)}`
      })
    });

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text();
      console.error('Discord webhook error:', errorText);
      throw new Error(`Discord webhook failed: ${discordResponse.status}`);
    }

    console.log('Discord notification sent successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Discord notification sent' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in send-discord-notification:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to send Discord notification'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
