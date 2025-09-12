import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
};

export const usePurchases = () => {
  return useQuery({
    queryKey: ['purchases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .order('purchase_date', { ascending: false });
      
      if (error) throw error;
      return data as Purchase[];
    },
    gcTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};