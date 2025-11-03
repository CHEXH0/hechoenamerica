import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Platform {
  id: string;
  name: string;
  icon: string;
  url: string;
  artist_id: string;
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
        .order("name", { ascending: true });

      if (error) throw error;
      return data as Platform[];
    },
  });
};