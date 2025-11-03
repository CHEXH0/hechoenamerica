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
      // Direct REST API call to fetch products
      const response = await fetch(`https://supabase.hechoenamericastudio.com/rest/v1/products?select=*&is_active=eq.true&order=category.asc,sort_order.asc`, {
        headers: {
          'apikey': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MjE0NjQ4MCwiZXhwIjo0OTE3ODIwMDgwLCJyb2xlIjoiYW5vbiJ9.vn3eKDv8DrLGoxqWnu4PYBx_rlRWT1BHfu-N5mq6nK4',
          'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MjE0NjQ4MCwiZXhwIjo0OTE3ODIwMDgwLCJyb2xlIjoiYW5vbiJ9.vn3eKDv8DrLGoxqWnu4PYBx_rlRWT1BHfu-N5mq6nK4'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch products');
      return await response.json() as Product[];
    },
    gcTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};