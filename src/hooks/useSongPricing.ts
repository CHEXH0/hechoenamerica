import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TierPricing {
  label: string;
  price: number;
  description: string;
  priceId: string | null;
  info: string;
}

export interface AddOnPricing {
  prices: number[];
  info: string;
}

export interface AudioQualityOption {
  value: string;
  label: string;
  surcharge: number[];
}

export interface SongPricingConfig {
  tiers: TierPricing[];
  addOns: {
    stems: AddOnPricing;
    analog: AddOnPricing;
    mixing: AddOnPricing;
    mastering: AddOnPricing;
    revision: AddOnPricing;
  };
  bitDepthOptions: AudioQualityOption[];
  sampleRateOptions: AudioQualityOption[];
  platformFeePercent: number;
}

// Default pricing (fallback if DB has no config yet)
export const DEFAULT_PRICING: SongPricingConfig = {
  tiers: [
    { label: "$0", price: 0, description: "Free AI Generated - for comparison", priceId: null, info: "Get a quick AI-generated demo using Google Lyria 2. Great for testing ideas before committing. Limited to 3 per 5 hours." },
    { label: "$25", price: 25, description: "Demo Project - for ideas (≈30sec)", priceId: "price_1SHdNFQchHjxRXODM3DJdjEE", info: "A human-produced demo track by one of our producers. Perfect for pitch decks, social media teasers, or validating a concept before full production." },
    { label: "$125", price: 125, description: "Artist-grade quality - for production (≈180sec)", priceId: "price_1SHdNVQchHjxRXODn3lW4vDj", info: "A full production-ready track. Includes professional arrangement, sound design, and high-quality mix. Ideal for singles, EPs, or album tracks." },
    { label: "$250", price: 250, description: "Industry standard - for masterpiece (≈300sec)", priceId: "price_1SHdNmQchHjxRXODgqWhW9TO", info: "A premium track with top-tier production, detailed arrangement, and radio-ready quality. Includes priority producer matching and faster turnaround." },
  ],
  addOns: {
    stems: { prices: [0, 10, 25, 40], info: "We record individual instrument/vocal tracks (stems) so we can provide the best quality for your sound." },
    analog: { prices: [0, 15, 35, 50], info: "Your track will be processed through real analog hardware for warmer, richer sound character." },
    mixing: { prices: [0, 20, 50, 75], info: "Professional mixing by our engineer: balancing levels, EQ, compression, effects, and spatial positioning." },
    mastering: { prices: [0, 15, 40, 60], info: "Final mastering to optimize loudness, clarity, and consistency across all playback systems." },
    revision: { prices: [0, 5, 15, 25], info: "Each revision allows you to request specific changes to your track." },
  },
  bitDepthOptions: [
    { value: "16", label: "16-bit", surcharge: [0, 0, 0, 0] },
    { value: "24", label: "24-bit", surcharge: [0, 0, 0, 0] },
    { value: "32", label: "32-bit float", surcharge: [0, 5, 10, 15] },
  ],
  sampleRateOptions: [
    { value: "44.1", label: "44.1 kHz", surcharge: [0, 0, 0, 0] },
    { value: "48", label: "48 kHz", surcharge: [0, 0, 0, 0] },
    { value: "88.2", label: "88.2 kHz", surcharge: [0, 5, 10, 15] },
    { value: "96", label: "96 kHz", surcharge: [0, 5, 10, 15] },
    { value: "176.4", label: "176.4 kHz", surcharge: [0, 10, 20, 30] },
    { value: "192", label: "192 kHz", surcharge: [0, 10, 20, 30] },
  ],
  platformFeePercent: 10,
};

export const useSongPricing = () => {
  return useQuery({
    queryKey: ["song-pricing"],
    queryFn: async (): Promise<SongPricingConfig> => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "song_pricing")
        .maybeSingle();

      if (error) {
        console.error("Error fetching song pricing:", error);
        return DEFAULT_PRICING;
      }

      if (!data?.value) return DEFAULT_PRICING;

      // Merge with defaults to ensure all fields exist
      const stored = data.value as unknown as Partial<SongPricingConfig>;
      return {
        ...DEFAULT_PRICING,
        ...stored,
        addOns: { ...DEFAULT_PRICING.addOns, ...(stored.addOns || {}) },
      };
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
};

export const useUpdateSongPricing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: SongPricingConfig) => {
      // Upsert: try update first, then insert
      const { data: existing } = await supabase
        .from("app_settings")
        .select("id")
        .eq("key", "song_pricing")
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("app_settings")
          .update({ value: config as unknown as Record<string, unknown> })
          .eq("key", "song_pricing");
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("app_settings")
          .insert({ key: "song_pricing", value: config as unknown as Record<string, unknown> });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["song-pricing"] });
    },
  });
};

// Inflation & tax suggestion helpers
export const calculateInflationAdjusted = (price: number, inflationRate: number, years: number): number => {
  return Math.round(price * Math.pow(1 + inflationRate / 100, years));
};

export const calculateWithTax = (price: number, taxRate: number): number => {
  return Math.round(price * (1 + taxRate / 100));
};

export const getSuggestedPrice = (currentPrice: number, inflationRate: number, taxRate: number, years: number = 1): number => {
  const inflationAdjusted = currentPrice * Math.pow(1 + inflationRate / 100, years);
  return Math.round(inflationAdjusted * (1 + taxRate / 100));
};
