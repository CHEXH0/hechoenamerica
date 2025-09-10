import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Platform {
  id: string;
  name: string;
  logo: string;
  tagline: string;
  sort_order: number;
}

export const usePlatforms = () => {
  return useQuery({
    queryKey: ["platforms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platforms")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as Platform[];
    },
  });
};