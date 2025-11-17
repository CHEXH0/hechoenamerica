import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Producer {
  id: string;
  slug: string;
  name: string;
  image: string;
  country: string;
  genre: string;
  bio: string;
  spotify_url?: string;
  youtube_url?: string;
  apple_music_url?: string;
  youtube_channel_url?: string;
  instagram_url?: string;
  website_url?: string;
}

export const useProducers = () => {
  return useQuery({
    queryKey: ["producers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("producers")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Producer[];
    },
  });
};

export const useProducer = (slug: string) => {
  return useQuery({
    queryKey: ["producer", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("producers")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      return data as Producer | null;
    },
    enabled: !!slug,
  });
};
