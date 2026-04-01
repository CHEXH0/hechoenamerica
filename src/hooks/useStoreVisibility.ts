import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface VisibilitySetting {
  enabled: boolean;
}

const fetchSetting = async (key: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();

  if (error) throw error;
  if (!data) return true; // default visible
  return (data.value as unknown as VisibilitySetting).enabled ?? true;
};

export const useGomasChamoyVisible = () =>
  useQuery({
    queryKey: ["store-visibility", "gomas_chamoy_visible"],
    queryFn: () => fetchSetting("gomas_chamoy_visible"),
    staleTime: 1000 * 60 * 5,
  });

export const useSweetTreatsTabVisible = () =>
  useQuery({
    queryKey: ["store-visibility", "sweet_treats_tab_visible"],
    queryFn: () => fetchSetting("sweet_treats_tab_visible"),
    staleTime: 1000 * 60 * 5,
  });

export const useUpdateStoreVisibility = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, enabled }: { key: string; enabled: boolean }) => {
      // Upsert: try update first, insert if not found
      const { data: existing } = await supabase
        .from("app_settings")
        .select("id")
        .eq("key", key)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("app_settings")
          .update({ value: { enabled } as any })
          .eq("key", key);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("app_settings")
          .insert({ key, value: { enabled } as any });
        if (error) throw error;
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["store-visibility", variables.key] });
    },
  });
};
