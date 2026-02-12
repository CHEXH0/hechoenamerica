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
  'cancelled': 0xE74C3C,    // Red
  'refunded': 0xE74C3C      // Red
};

const APP_URL = 'https://hechoenamericastudio.com';

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
    const botToken = Deno.env.get('DISCORD_BOT_TOKEN')!;
    const channelId = Deno.env.get('DISCORD_CHANNEL_ID')!;
    
    // Fallback to webhook if bot token not configured
    const webhookUrl = Deno.env.get('DISCORD_WEBHOOK_URL');

    if (!botToken && !webhookUrl) {
      throw new Error('Neither DISCORD_BOT_TOKEN nor DISCORD_WEBHOOK_URL is configured');
    }
    
    if (!channelId && botToken) {
      throw new Error('DISCORD_CHANNEL_ID is required when using bot token');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { requestId, requestData, notificationType = 'new_request', oldStatus, newStatus, driveLink } = await req.json();
    
    console.log('Processing Discord notification:', { requestId, notificationType, oldStatus, newStatus, driveLink, useBotApi: !!botToken });

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

    if (notificationType === 'file_delivered') {
      embed = createFileDeliveredEmbed(songRequest, requestId, driveLink);
      content = `📦 **Files Delivered!** Project has been completed and files uploaded to Google Drive.`;
    } else if (notificationType === 'status_change') {
      embed = createStatusChangeEmbed(songRequest, oldStatus, newStatus, requestId);
      content = `📊 Project status updated: **${oldStatus}** → **${newStatus}**`;
    } else if (notificationType === 'producer_assigned') {
      embed = createProducerAssignedEmbed(songRequest, requestId);
      content = `🎧 Producer has been assigned to a project!`;
    } else if (notificationType === 'cancellation_processed') {
      // Cancellation notification - do NOT repost as new request
      const { action: cancellationAction, refundAmount: refundAmountStr } = await req.json().catch(() => ({}));
      embed = {
        title: cancellationAction === 'approve' ? "❌ Project Cancelled" : "ℹ️ Cancellation Denied",
        color: cancellationAction === 'approve' ? 0xE74C3C : 0xF59E0B,
        fields: [
          { name: "📋 Request ID", value: `\`${requestId.substring(0, 8)}...\``, inline: true },
          { name: "🎯 Tier", value: songRequest.tier.toUpperCase(), inline: true },
          { name: "📧 Customer", value: songRequest.user_email, inline: true },
          { name: "💰 Refund", value: refundAmountStr || 'None', inline: true },
        ],
        timestamp: new Date().toISOString(),
      };
      content = cancellationAction === 'approve' 
        ? `❌ Project has been cancelled and refunded.`
        : `ℹ️ Cancellation request was denied. Project continues.`;
    } else if (notificationType === 'producer_changed') {
      // Producer change - repost for new producer acceptance
      embed = createNewRequestEmbed(songRequest, requestId);
      const genreKey = songRequest.genre_category?.toLowerCase() || 'other';
      const roleMention = genreRoleMap[genreKey] || genreRoleMap['other'];
      content = `🔄 **@${roleMention}** - Producer changed! ${songRequest.tier.toUpperCase()} project needs a new producer!`;
    } else if (notificationType === 'new_request') {
      embed = createNewRequestEmbed(songRequest, requestId);
      const genreKey = songRequest.genre_category?.toLowerCase() || 'other';
      const roleMention = genreRoleMap[genreKey] || genreRoleMap['other'];
      content = `🚨 **@${roleMention}** - New ${songRequest.tier.toUpperCase()} song request needs a producer!`;
    } else {
      // Unknown notification type - log and create a generic status embed
      console.warn('Unknown notification type:', notificationType);
      embed = createStatusChangeEmbed(songRequest, songRequest.status, songRequest.status, requestId);
      content = `📊 Project update for ${songRequest.tier.toUpperCase()} request.`;
    }

    // Build message payload
    const messagePayload: any = {
      content,
      embeds: [embed],
    };

    // Add Accept/Decline buttons for new requests and producer assignments
    // Note: Interactive components only work with Bot API, not webhooks
    if (botToken && (notificationType === 'new_request' || notificationType === 'producer_assigned')) {
      messagePayload.components = [
        {
          type: 1, // Action Row
          components: [
            {
              type: 2, // Button
              style: 3, // Success (green)
              label: '✅ Accept Project',
              custom_id: `accept_${requestId}`
            },
            {
              type: 2, // Button
              style: 5, // Link
              label: '📋 View Details',
              url: `${APP_URL}/my-projects`
            }
          ]
        }
      ];
    }

    let discordResponse;
    let usedFallback = false;
    
    if (botToken && channelId) {
      // Try Discord Bot API for interactive buttons
      console.log('Sending message via Discord Bot API to channel:', channelId);
      discordResponse = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${botToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messagePayload)
      });
      
      // If bot API fails with 403, fall back to webhook
      if (!discordResponse.ok && discordResponse.status === 403 && webhookUrl) {
        console.warn('Bot API returned 403, falling back to webhook (no interactive buttons)');
        usedFallback = true;
        // Remove components for webhook (not supported)
        delete messagePayload.components;
        discordResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(messagePayload)
        });
      }
    } else if (webhookUrl) {
      // Use webhook directly (no interactive buttons)
      console.log('Sending message via webhook (no interactive buttons)');
      // Remove components for webhook
      delete messagePayload.components;
      discordResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messagePayload)
      });
    }

    if (!discordResponse || !discordResponse.ok) {
      const errorText = discordResponse ? await discordResponse.text() : 'No response';
      console.error('Discord API error:', errorText);
      throw new Error(`Discord API failed: ${discordResponse?.status} - ${errorText}`);
    }

    const responseData = await discordResponse.json();
    console.log('Discord notification sent successfully, message ID:', responseData.id, usedFallback ? '(via webhook fallback)' : '');

    return new Response(
      JSON.stringify({ success: true, message: 'Discord notification sent', messageId: responseData.id }),
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
    'cancelled': '❌',
    'refunded': '💸'
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

function createFileDeliveredEmbed(songRequest: any, requestId: string, driveLink: string) {
  return {
    title: "📦 Files Delivered to Google Drive",
    color: 0x2ECC71, // Green
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
        name: "💰 Price",
        value: songRequest.price,
        inline: true
      },
      {
        name: "💡 Song Idea",
        value: songRequest.song_idea.length > 200 
          ? songRequest.song_idea.substring(0, 200) + '...' 
          : songRequest.song_idea,
        inline: false
      },
      {
        name: "📁 Google Drive Folder",
        value: `[Open Delivery Folder](${driveLink})`,
        inline: false
      },
      {
        name: "🔗 Quick Actions",
        value: `[View in Admin Dashboard](${APP_URL}/admin)`,
        inline: false
      }
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: "HechoEnAmerica • Delivery Complete ✅"
    }
  };
}
