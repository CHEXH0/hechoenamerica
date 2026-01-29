import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Producer } from "./useProducers";

export const useProducerProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["producerProfile", user?.email],
    queryFn: async () => {
      if (!user?.email) return null;

      const { data, error } = await supabase
        .from("producers")
        .select("*")
        .eq("email", user.email)
        .maybeSingle();

      if (error) throw error;
      return data as Producer | null;
    },
    enabled: !!user?.email,
  });
};

export type ProducerProfileUpdate = {
  bio?: string;
  image?: string;
  discord_user_id?: string;
  spotify_url?: string;
  youtube_url?: string;
  apple_music_url?: string;
  youtube_channel_url?: string;
  instagram_url?: string;
  website_url?: string;
};

export const useUpdateProducerProfile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: ProducerProfileUpdate) => {
      if (!user?.email) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("producers")
        .update(updates)
        .eq("email", user.email)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["producerProfile"] });
      queryClient.invalidateQueries({ queryKey: ["producers"] });
      toast({
        title: "Profile updated",
        description: "Your producer profile has been saved successfully.",
      });
    },
    onError: (error) => {
      console.error("Error updating producer profile:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile.",
        variant: "destructive",
      });
    },
  });
};

export const useUploadProducerImage = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split(".").pop();
      const fileName = `producer-${Date.now()}.${fileExt}`;
      const filePath = `producers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    },
    onError: (error) => {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image.",
        variant: "destructive",
      });
    },
  });
};
