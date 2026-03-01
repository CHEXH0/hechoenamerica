import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Product = {
  id: string;
  name: string;
  type: string;
  category: 'samples' | 'vsts' | 'candies';
  price: string;
  description: string;
  image: string;
  showcase: string;
  duration?: string | null;
  size?: string | null;
  weight?: string | null;
  has_comparison: boolean;
  is_instrument: boolean;
  audio_preview_url?: string | null;
  audio_preview_dry?: string | null;
  audio_preview_wet?: string | null;
  audio_preview_comparison?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as Product[];
    },
    staleTime: 1000 * 60 * 5, // Products rarely change — stay fresh 5 min
    gcTime: 1000 * 60 * 15, // Keep cache 15 min
  });
};
