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
      const response = await fetch(`https://eapbuoqkhckqaswfjexv.supabase.co/rest/v1/products?select=*&is_active=eq.true&order=category.asc,sort_order.asc`, {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhcGJ1b3FraGNrcWFzd2ZqZXh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NzM0NjMsImV4cCI6MjA3MTQ0OTQ2M30.oybb51fqUbvPklFND2ah5ko3PVUDRUIulSIojuPfoWE',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhcGJ1b3FraGNrcWFzd2ZqZXh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NzM0NjMsImV4cCI6MjA3MTQ0OTQ2M30.oybb51fqUbvPklFND2ah5ko3PVUDRUIulSIojuPfoWE'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch products');
      return await response.json() as Product[];
    },
    gcTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};