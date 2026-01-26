import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface HiringSetting {
  enabled: boolean;
}

export const useHiringStatus = () => {
  return useQuery({
    queryKey: ["hiring-status"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "producer_hiring")
        .maybeSingle();

      if (error) throw error;
      
      // Default to not hiring if no setting found
      if (!data) return { enabled: false };
      
      const value = data.value as unknown as HiringSetting;
      return value;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};

export const useUpdateHiringStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (enabled: boolean) => {
      const { data, error } = await supabase
        .from("app_settings")
        .update({ value: { enabled } })
        .eq("key", "producer_hiring")
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hiring-status"] });
    },
  });
};
