import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

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
    gcTime: 1000 * 60 * 5,
  });
};

export const useDeletePurchase = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (purchaseId: string) => {
      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('id', purchaseId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases', user?.id] });
      toast({
        title: "Purchase deleted",
        description: "The purchase record has been removed from your history.",
      });
    },
    onError: (error) => {
      console.error('Delete purchase error:', error);
      toast({
        title: "Error",
        description: "Failed to delete purchase. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteAllPurchases = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases', user?.id] });
      toast({
        title: "Purchase history cleared",
        description: "All purchase records have been removed from your history.",
      });
    },
    onError: (error) => {
      console.error('Delete all purchases error:', error);
      toast({
        title: "Error",
        description: "Failed to clear purchase history. Please try again.",
        variant: "destructive",
      });
    },
  });
};
