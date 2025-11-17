import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Platform {
  id: string;
  artist_id: string;
  name: string;
  icon: string;
  url: string;
  created_at: string;
  updated_at: string;
}

export const usePlatforms = () => {
  return useQuery({
    queryKey: ["platforms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platforms")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Platform[];
    },
  });
};