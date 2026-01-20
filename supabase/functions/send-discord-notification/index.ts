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
  'accepted': 0x14B8A6,     // Teal
  'in_progress': 0x9B59B6,  // Purple
  'review': 0x1ABC9C,       // Teal
  'revision': 0xE67E22,     // Dark Orange
  'completed': 0x2ECC71,    // Green
  'cancelled': 0xE74C3C     // Red
};

const APP_URL = 'https://eapbuoqkhckqaswfjexv.lovableproject.com';

// Add-on pricing per tier (matches frontend: tier index 1=$25, 2=$125, 3=$250)
const addOnPricing: Record<string, number[]> = {
  stems: [0, 10, 25, 40],
  analog: [0, 15, 35, 50],
  mixing: [0, 20, 50, 75],
  mastering: [0, 15, 40, 60],
  revision: [0, 5, 15, 25],
};

const tierIndexMap: Record<string, number> = {
  '$0': 0,
  '$25': 1,
  '$125': 2,
  '$250': 3,
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
    '$0': '🟢 Free AI',
    '$25': '🟡 Demo',
    '$125': '🟠 Artist',
    '$250': '🔴 Industry'
  };
  const complexityLevel = complexityMap[songRequest.tier] || '🟡 Standard';
  const tierIndex = tierIndexMap[songRequest.tier] || 1;

  // Calculate price breakdown
  const basePrice = parseInt(songRequest.tier.replace('$', '')) || 0;
  let addOnTotal = 0;
  const addOnBreakdown: string[] = [];

  if (songRequest.wants_recorded_stems) {
    const cost = addOnPricing.stems[tierIndex];
    addOnTotal += cost;
    addOnBreakdown.push(`🎹 Stems: +$${cost}`);
  }
  if (songRequest.wants_analog) {
    const cost = addOnPricing.analog[tierIndex];
    addOnTotal += cost;
    addOnBreakdown.push(`📻 Analog: +$${cost}`);
  }
  if (songRequest.wants_mixing) {
    const cost = addOnPricing.mixing[tierIndex];
    addOnTotal += cost;
    addOnBreakdown.push(`🎚️ Mixing: +$${cost}`);
  }
  if (songRequest.wants_mastering) {
    const cost = addOnPricing.mastering[tierIndex];
    addOnTotal += cost;
    addOnBreakdown.push(`🔊 Mastering: +$${cost}`);
  }
  if (songRequest.number_of_revisions > 0) {
    const cost = addOnPricing.revision[tierIndex] * songRequest.number_of_revisions;
    addOnTotal += cost;
    addOnBreakdown.push(`🔄 ${songRequest.number_of_revisions}x Revisions: +$${cost}`);
  }

  const totalPrice = basePrice + addOnTotal;

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
        value: `${songRequest.tier} (${complexityLevel})`,
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
        name: "📅 Submitted",
        value: new Date(songRequest.created_at).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        inline: true
      },
      {
        name: "📊 Status",
        value: songRequest.status.replace('_', ' ').toUpperCase(),
        inline: true
      },
      {
        name: "💡 Song Idea",
        value: songRequest.song_idea.length > 400 
          ? songRequest.song_idea.substring(0, 400) + '...' 
          : songRequest.song_idea
      }
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: "HechoEnAmerica • LA MUSIC ES MEDICINA"
    }
  };

  // Add price breakdown section
  let priceBreakdownText = `**Base:** $${basePrice}`;
  if (addOnBreakdown.length > 0) {
    priceBreakdownText += '\n' + addOnBreakdown.join('\n');
    priceBreakdownText += `\n──────────\n**TOTAL: $${totalPrice}**`;
  } else {
    priceBreakdownText += `\n**TOTAL: $${totalPrice}**`;
  }

  embed.fields.push({
    name: "💰 Price Breakdown",
    value: priceBreakdownText,
    inline: false
  });

  // Files section
  if (songRequest.file_urls && songRequest.file_urls.length > 0) {
    embed.fields.push({
      name: "📎 Attached Files",
      value: `${songRequest.file_urls.length} file(s) uploaded`,
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
    'accepted': '🤝',
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
