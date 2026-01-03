import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Genre to Discord Role ID mapping
// Users need to create these roles in Discord and add their IDs here
const genreRoleMap: Record<string, string> = {
  'electronic': 'EDM-Producers',
  'hip-hop': 'Hip-Hop-Producers', 
  'pop': 'Pop-Producers',
  'rock': 'Rock-Producers',
  'latin': 'Latin-Producers',
  'rnb': 'RnB-Producers',
  'country': 'Country-Producers',
  'jazz': 'Jazz-Producers',
  'classical': 'Classical-Producers',
  'other': 'All-Producers'
};

// Status colors for embeds
const statusColorMap: Record<string, number> = {
  'pending': 0xFFA500,      // Orange
  'pending_payment': 0xFFD700, // Gold
  'paid': 0x3498DB,         // Blue
  'in_progress': 0x9B59B6,  // Purple
  'review': 0x1ABC9C,       // Teal
  'revision': 0xE67E22,     // Dark Orange
  'completed': 0x2ECC71,    // Green
  'cancelled': 0xE74C3C     // Red
};

const APP_URL = 'https://eapbuoqkhckqaswfjexv.lovableproject.com';

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
    
    const { requestId, requestData, notificationType = 'new_request', oldStatus, newStatus } = await req.json();
    
    console.log('Processing Discord notification:', { requestId, notificationType, oldStatus, newStatus });

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

    let embed;
    let content;

    if (notificationType === 'status_change') {
      // Status change notification
      embed = createStatusChangeEmbed(songRequest, oldStatus, newStatus, requestId);
      content = `📊 Project status updated: **${oldStatus}** → **${newStatus}**`;
    } else if (notificationType === 'producer_assigned') {
      // Producer assigned notification
      embed = createProducerAssignedEmbed(songRequest, requestId);
      content = `🎧 Producer has been assigned to a project!`;
    } else {
      // New request notification (default)
      embed = createNewRequestEmbed(songRequest, requestId);
      
      // Add genre-based role mention
      const genreKey = songRequest.genre_category?.toLowerCase() || 'other';
      const roleMention = genreRoleMap[genreKey] || genreRoleMap['other'];
      content = `🚨 **@${roleMention}** - New ${songRequest.tier.toUpperCase()} song request needs a producer!`;
    }

    // Send to Discord
    const discordResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        embeds: [embed],
        thread_name: notificationType === 'new_request' 
          ? `🎵 ${songRequest.tier.toUpperCase()} - ${requestId.substring(0, 8)}`
          : undefined
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

function createNewRequestEmbed(songRequest: any, requestId: string) {
  const complexityMap: Record<string, string> = {
    'free': '🟢 Basic',
    'basic': '🟡 Standard',
    'premium': '🟠 Premium',
    'custom': '🔴 Custom'
  };
  const complexityLevel = complexityMap[songRequest.tier.toLowerCase()] || '🟡 Standard';

  const embed = {
    title: "🎵 New Song Request",
    color: 0x7C3AED,
    fields: [
      {
        name: "📋 Request ID",
        value: `\`${requestId.substring(0, 8)}...\``,
        inline: true
      },
      {
        name: "🎯 Tier",
        value: songRequest.tier.toUpperCase(),
        inline: true
      },
      {
        name: "💰 Price",
        value: songRequest.price,
        inline: true
      },
      {
        name: "⚡ Complexity",
        value: complexityLevel,
        inline: true
      },
      {
        name: "📧 Customer",
        value: songRequest.user_email,
        inline: true
      },
      {
        name: "🎸 Genre",
        value: songRequest.genre_category || 'Not specified',
        inline: true
      },
      {
        name: "💡 Song Idea",
        value: songRequest.song_idea.substring(0, 500) + (songRequest.song_idea.length > 500 ? '...' : '')
      }
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: "Click the link below to manage this project"
    }
  };

  // Add additional options
  const additionalOptions = [];
  if (songRequest.wants_recorded_stems) additionalOptions.push("🎹 Recorded Stems");
  if (songRequest.wants_analog) additionalOptions.push("📻 Analog");
  if (songRequest.wants_mixing) additionalOptions.push("🎚️ Mixing");
  if (songRequest.wants_mastering) additionalOptions.push("🔊 Mastering");
  if (songRequest.number_of_revisions > 0) {
    additionalOptions.push(`🔄 ${songRequest.number_of_revisions} Revisions`);
  }

  if (additionalOptions.length > 0) {
    embed.fields.push({
      name: "✨ Add-ons",
      value: additionalOptions.join(" • "),
      inline: false
    });
  }

  if (songRequest.file_urls && songRequest.file_urls.length > 0) {
    embed.fields.push({
      name: "📎 Files",
      value: `${songRequest.file_urls.length} file(s) attached`,
      inline: true
    });
  }

  // Add admin dashboard link
  embed.fields.push({
    name: "🔗 Quick Actions",
    value: `[View in Admin Dashboard](${APP_URL}/admin)`,
    inline: false
  });

  return embed;
}

function createStatusChangeEmbed(songRequest: any, oldStatus: string, newStatus: string, requestId: string) {
  const statusEmoji: Record<string, string> = {
    'pending': '⏳',
    'pending_payment': '💳',
    'paid': '✅',
    'in_progress': '🎹',
    'review': '👀',
    'revision': '🔄',
    'completed': '🎉',
    'cancelled': '❌'
  };

  return {
    title: "📊 Project Status Updated",
    color: statusColorMap[newStatus] || 0x7C3AED,
    fields: [
      {
        name: "📋 Request ID",
        value: `\`${requestId.substring(0, 8)}...\``,
        inline: true
      },
      {
        name: "🎯 Tier",
        value: songRequest.tier.toUpperCase(),
        inline: true
      },
      {
        name: "📧 Customer",
        value: songRequest.user_email,
        inline: true
      },
      {
        name: "Status Change",
        value: `${statusEmoji[oldStatus] || '❓'} **${oldStatus}** → ${statusEmoji[newStatus] || '❓'} **${newStatus}**`,
        inline: false
      },
      {
        name: "🔗 Quick Actions",
        value: `[View in Admin Dashboard](${APP_URL}/admin)`,
        inline: false
      }
    ],
    timestamp: new Date().toISOString()
  };
}

function createProducerAssignedEmbed(songRequest: any, requestId: string) {
  return {
    title: "🎧 Producer Assigned",
    color: 0x2ECC71,
    fields: [
      {
        name: "📋 Request ID",
        value: `\`${requestId.substring(0, 8)}...\``,
        inline: true
      },
      {
        name: "🎯 Tier",
        value: songRequest.tier.toUpperCase(),
        inline: true
      },
      {
        name: "📧 Customer",
        value: songRequest.user_email,
        inline: true
      },
      {
        name: "🎸 Genre",
        value: songRequest.genre_category || 'Not specified',
        inline: true
      },
      {
        name: "🔗 Quick Actions",
        value: `[View in Admin Dashboard](${APP_URL}/admin)`,
        inline: false
      }
    ],
    timestamp: new Date().toISOString()
  };
}
