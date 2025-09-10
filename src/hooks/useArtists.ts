import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Artist {
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
}

export const useArtists = () => {
  return useQuery({
    queryKey: ["artists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artists")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Artist[];
    },
  });
};

export const useArtist = (slug: string) => {
  return useQuery({
    queryKey: ["artist", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artists")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      return data as Artist | null;
    },
    enabled: !!slug,
  });
};