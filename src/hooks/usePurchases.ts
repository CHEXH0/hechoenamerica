import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type Purchase = {
  id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  product_type: string;
  product_category: string;
  price: string;
  purchase_date: string;
  created_at: string;
  updated_at: string;
  status?: string;
  download_url?: string;
  song_idea?: string;
  file_urls?: string[];
};

export const usePurchases = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['purchases', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', user.id)
        .order('purchase_date', { ascending: false });
      
      if (error) throw error;
      return data as Purchase[];
    },
    enabled: !!user?.id,
    gcTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};