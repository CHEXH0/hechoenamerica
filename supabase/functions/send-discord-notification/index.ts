import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Genre to Discord Role ID mapping
// Users need to create these roles in Discord and add their IDs here
const genreRoleMap: Record<string, string> = {
  electronic: "EDM-Producers",
  "hip-hop": "Hip-Hop-Producers",
  pop: "Pop-Producers",
  rock: "Rock-Producers",
  latin: "Latin-Producers",
  rnb: "RnB-Producers",
  country: "Country-Producers",
  jazz: "Jazz-Producers",
  classical: "Classical-Producers",
  other: "All-Producers",
};

// Status colors for embeds
const statusColorMap: Record<string, number> = {
  pending: 0xffa500, // Orange
  pending_payment: 0xffd700, // Gold
  paid: 0x3498db, // Blue
  accepted: 0x14b8a6, // Teal
  in_progress: 0x9b59b6, // Purple
  review: 0x1abc9c, // Teal
  revision: 0xe67e22, // Dark Orange
  completed: 0x2ecc71, // Green
  cancelled: 0xe74c3c, // Red
  refunded: 0xe74c3c, // Red
};

const APP_URL = "https://hechoenamericastudio.com";

// Add-on pricing per tier (matches frontend: tier index 1=$25, 2=$125, 3=$250)
const addOnPricing: Record<string, number[]> = {
  stems: [0, 10, 25, 40],
  analog: [0, 15, 35, 50],
  mixing: [0, 20, 50, 75],
  mastering: [0, 15, 40, 60],
  revision: [0, 5, 15, 25],
};

const tierIndexMap: Record<string, number> = {
  $0: 0,
  $25: 1,
  $125: 2,
  $250: 3,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const botToken = Deno.env.get("DISCORD_BOT_TOKEN")!;
    const channelId = Deno.env.get("DISCORD_CHANNEL_ID")!;

    // Fallback to webhook if bot token not configured
    const webhookUrl = Deno.env.get("DISCORD_WEBHOOK_URL");

    if (!botToken && !webhookUrl) {
      throw new Error("Neither DISCORD_BOT_TOKEN nor DISCORD_WEBHOOK_URL is configured");
    }

    if (!channelId && botToken) {
      throw new Error("DISCORD_CHANNEL_ID is required when using bot token");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      requestId,
      requestData,
      notificationType = "new_request",
      oldStatus,
      newStatus,
      driveLink,
    } = await req.json();

    console.log("Processing Discord notification:", {
      requestId,
      notificationType,
      oldStatus,
      newStatus,
      driveLink,
      useBotApi: !!botToken,
    });

    // Only allow project-acceptance-related notifications to Discord
    const allowedTypes = ["new_request", "producer_changed"];
    if (!allowedTypes.includes(notificationType)) {
      console.log(
        `Skipping Discord notification for type: ${notificationType} (only accept-related notifications allowed)`,
      );
      return new Response(
        JSON.stringify({ success: true, message: `Skipped Discord notification for type: ${notificationType}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    // Fetch the full request details from the database
    const { data: songRequest, error: fetchError } = await supabase
      .from("song_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (fetchError) {
      console.error("Error fetching song request:", fetchError);
      throw fetchError;
    }

    let content;
    const embed = createNewRequestEmbed(songRequest, requestId);
    const genreKey = songRequest.genre_category?.toLowerCase() || "other";
    const roleMention = genreRoleMap[genreKey] || genreRoleMap["other"];

    if (notificationType === "producer_changed") {
      content = `🔄 **@${roleMention}** - Producer changed! ${songRequest.tier.toUpperCase()} project needs a new producer!`;
    } else {
      content = `🚨 **@${roleMention}** - New ${songRequest.tier.toUpperCase()} song request needs a producer!`;
    }

    // Build message payload
    const messagePayload: any = {
      content,
      embeds: [embed],
    };

    // Add Accept buttons for new requests and producer changes
    // Note: Interactive components only work with Bot API, not webhooks
    if (botToken) {
      messagePayload.components = [
        {
          type: 1, // Action Row
          components: [
            {
              type: 2, // Button
              style: 3, // Success (green)
              label: "✅ Accept Project",
              custom_id: `accept_${requestId}`,
            },
            {
              type: 2, // Button
              style: 5, // Link
              label: "📋 View Details",
              url: `${APP_URL}/my-projects`,
            },
          ],
        },
      ];
    }

    let discordResponse;
    let usedFallback = false;

    if (botToken && channelId) {
      // Try Discord Bot API for interactive buttons
      console.log("Sending message via Discord Bot API to channel:", channelId);
      discordResponse = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bot ${botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messagePayload),
      });

      // If bot API fails with 403, fall back to webhook
      if (!discordResponse.ok && discordResponse.status === 403 && webhookUrl) {
        console.warn("Bot API returned 403, falling back to webhook (no interactive buttons)");
        usedFallback = true;
        // Remove components for webhook (not supported)
        delete messagePayload.components;
        discordResponse = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(messagePayload),
        });
      }
    } else if (webhookUrl) {
      // Use webhook directly (no interactive buttons)
      console.log("Sending message via webhook (no interactive buttons)");
      // Remove components for webhook
      delete messagePayload.components;
      discordResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messagePayload),
      });
    }

    if (!discordResponse || !discordResponse.ok) {
      const errorText = discordResponse ? await discordResponse.text() : "No response";
      console.error("Discord API error:", errorText);
      throw new Error(`Discord API failed: ${discordResponse?.status} - ${errorText}`);
    }

    const responseData = await discordResponse.json();
    console.log(
      "Discord notification sent successfully, message ID:",
      responseData.id,
      usedFallback ? "(via webhook fallback)" : "",
    );

    return new Response(
      JSON.stringify({ success: true, message: "Discord notification sent", messageId: responseData.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error in send-discord-notification:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: "Failed to send Discord notification",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});

function createNewRequestEmbed(songRequest: any, requestId: string) {
  const complexityMap: Record<string, string> = {
    $0: "🟢 Free AI",
    $25: "🟡 Demo",
    $125: "🟠 Artist",
    $250: "🔴 Industry",
  };
  const complexityLevel = complexityMap[songRequest.tier] || "🟡 Standard";
  const tierIndex = tierIndexMap[songRequest.tier] || 1;

  // Calculate price breakdown
  const basePrice = parseInt(songRequest.tier.replace("$", "")) || 0;
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

  // Audio quality info
  const bitDepth = songRequest.bit_depth || "24";
  const sampleRate = songRequest.sample_rate || "44.1";
  const bitDepthLabels: Record<string, string> = { "16": "16-bit", "24": "24-bit", "32": "32-bit float" };
  const sampleRateLabels: Record<string, string> = { "44.1": "44.1 kHz", "48": "48 kHz", "88.2": "88.2 kHz", "96": "96 kHz", "176.4": "176.4 kHz", "192": "192 kHz" };
  const bitDepthLabel = bitDepthLabels[bitDepth] || `${bitDepth}-bit`;
  const sampleRateLabel = sampleRateLabels[sampleRate] || `${sampleRate} kHz`;

  const totalPrice = basePrice + addOnTotal;

  // Build production settings summary
  const productionSettings: string[] = [];
  if (songRequest.wants_recorded_stems) productionSettings.push("🎹 Stems");
  if (songRequest.wants_analog) productionSettings.push("📻 Analog");
  if (songRequest.wants_mixing) productionSettings.push("🎚️ Mixing");
  if (songRequest.wants_mastering) productionSettings.push("🔊 Mastering");
  if (songRequest.number_of_revisions > 0) productionSettings.push(`🔄 ${songRequest.number_of_revisions}x Revisions`);

  // Build price breakdown text
  let priceBreakdownText = `**Base:** $${basePrice}`;
  if (addOnBreakdown.length > 0) {
    priceBreakdownText += "\n" + addOnBreakdown.join("\n");
    priceBreakdownText += `\n──────────\n**TOTAL: $${totalPrice}**`;
  } else {
    priceBreakdownText += `\n**TOTAL: $${totalPrice}**`;
  }

  const embed: any = {
    title: "🎵 New Song Request",
    color: 0x7c3aed,
    description: `**${complexityLevel}** tier project • ${songRequest.genre_category || "No genre specified"}`,
    fields: [
      // ─── Project Overview ───
      {
        name: "📋 Request ID",
        value: `\`${requestId.substring(0, 8)}...\``,
        inline: true,
      },
      {
        name: "📧 Customer",
        value: songRequest.user_email,
        inline: true,
      },
      {
        name: "📅 Submitted",
        value: new Date(songRequest.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        inline: true,
      },
      // ─── Song Details ───
      {
        name: "💡 Song Idea",
        value:
          songRequest.song_idea.length > 400 ? songRequest.song_idea.substring(0, 400) + "..." : songRequest.song_idea,
        inline: false,
      },
      // ─── Technical Specifications ───
      {
        name: "🎛️ Bit Depth",
        value: bitDepthLabel,
        inline: true,
      },
      {
        name: "📊 Sample Rate",
        value: sampleRateLabel,
        inline: true,
      },
      {
        name: "📊 Status",
        value: songRequest.status.replace("_", " ").toUpperCase(),
        inline: true,
      },
      // ─── Production Add-ons ───
      {
        name: "⚙️ Production Settings",
        value: productionSettings.length > 0 ? productionSettings.join(" • ") : "Raw production only",
        inline: false,
      },
      // ─── Pricing ───
      {
        name: "💰 Price Breakdown",
        value: priceBreakdownText,
        inline: false,
      },
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: "HechoEnAmerica • LA MUSIC ES MEDICINE",
    },
  };

  // Files section
  if (songRequest.file_urls && songRequest.file_urls.length > 0) {
    embed.fields.push({
      name: "📎 Attached Files",
      value: `${songRequest.file_urls.length} file(s) uploaded`,
      inline: true,
    });
  }

  // Acceptance deadline
  if (songRequest.acceptance_deadline) {
    const deadline = new Date(songRequest.acceptance_deadline);
    embed.fields.push({
      name: "⏰ Acceptance Deadline",
      value: deadline.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      inline: true,
    });
  }

  // Admin link
  embed.fields.push({
    name: "🔗 Quick Actions",
    value: `[View in Admin Dashboard](${APP_URL}/admin)`,
    inline: false,
  });

  return embed;
}

function createStatusChangeEmbed(songRequest: any, oldStatus: string, newStatus: string, requestId: string) {
  const statusEmoji: Record<string, string> = {
    pending: "⏳",
    pending_payment: "💳",
    paid: "✅",
    accepted: "🤝",
    in_progress: "🎹",
    review: "👀",
    revision: "🔄",
    completed: "🎉",
    cancelled: "❌",
    refunded: "💸",
  };

  return {
    title: "📊 Project Status Updated",
    color: statusColorMap[newStatus] || 0x7c3aed,
    fields: [
      {
        name: "📋 Request ID",
        value: `\`${requestId.substring(0, 8)}...\``,
        inline: true,
      },
      {
        name: "🎯 Tier",
        value: songRequest.tier.toUpperCase(),
        inline: true,
      },
      {
        name: "📧 Customer",
        value: songRequest.user_email,
        inline: true,
      },
      {
        name: "Status Change",
        value: `${statusEmoji[oldStatus] || "❓"} **${oldStatus}** → ${statusEmoji[newStatus] || "❓"} **${newStatus}**`,
        inline: false,
      },
      {
        name: "🔗 Quick Actions",
        value: `[View in Admin Dashboard](${APP_URL}/admin)`,
        inline: false,
      },
    ],
    timestamp: new Date().toISOString(),
  };
}

function createProducerAssignedEmbed(songRequest: any, requestId: string) {
  return {
    title: "🎧 Producer Assigned",
    color: 0x2ecc71,
    fields: [
      {
        name: "📋 Request ID",
        value: `\`${requestId.substring(0, 8)}...\``,
        inline: true,
      },
      {
        name: "🎯 Tier",
        value: songRequest.tier.toUpperCase(),
        inline: true,
      },
      {
        name: "📧 Customer",
        value: songRequest.user_email,
        inline: true,
      },
      {
        name: "🎸 Genre",
        value: songRequest.genre_category || "Not specified",
        inline: true,
      },
      {
        name: "🔗 Quick Actions",
        value: `[View in Admin Dashboard](${APP_URL}/admin)`,
        inline: false,
      },
    ],
    timestamp: new Date().toISOString(),
  };
}

function createFileDeliveredEmbed(songRequest: any, requestId: string, driveLink: string) {
  return {
    title: "📦 Files Delivered to Google Drive",
    color: 0x2ecc71, // Green
    fields: [
      {
        name: "📋 Request ID",
        value: `\`${requestId.substring(0, 8)}...\``,
        inline: true,
      },
      {
        name: "🎯 Tier",
        value: songRequest.tier.toUpperCase(),
        inline: true,
      },
      {
        name: "📧 Customer",
        value: songRequest.user_email,
        inline: true,
      },
      {
        name: "💰 Price",
        value: songRequest.price,
        inline: true,
      },
      {
        name: "💡 Song Idea",
        value:
          songRequest.song_idea.length > 200 ? songRequest.song_idea.substring(0, 200) + "..." : songRequest.song_idea,
        inline: false,
      },
      {
        name: "📁 Google Drive Folder",
        value: `[Open Delivery Folder](${driveLink})`,
        inline: false,
      },
      {
        name: "🔗 Quick Actions",
        value: `[View in Admin Dashboard](${APP_URL}/admin)`,
        inline: false,
      },
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: "HechoEnAmerica • Delivery Complete ✅",
    },
  };
}
