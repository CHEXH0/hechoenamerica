import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SongRequest = {
  id: string;
  user_id: string;
  user_email: string;
  song_idea: string;
  tier: string;
  price: string;
  status: string;
  file_urls?: string[];
  created_at: string;
  updated_at: string;
  stripe_session_id?: string;
  number_of_revisions?: number;
  wants_recorded_stems?: boolean;
  wants_analog?: boolean;
  wants_mixing?: boolean;
  wants_mastering?: boolean;
  assigned_producer_id?: string;
  genre_category?: string;
  complexity_level?: string;
};

export const useSongRequests = () => {
  return useQuery({
    queryKey: ['song_requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('song_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SongRequest[];
    },
    gcTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};
