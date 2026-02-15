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
  name?: string;
  country?: string;
  genre?: string;
  bio?: string;
  image?: string;
  discord_user_id?: string | null;
  spotify_url?: string | null;
  youtube_url?: string | null;
  apple_music_url?: string | null;
  youtube_channel_url?: string | null;
  instagram_url?: string | null;
  website_url?: string | null;
  showcase_video_1?: string | null;
  showcase_video_2?: string | null;
  showcase_video_3?: string | null;
};

export const useUpdateProducerProfile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: ProducerProfileUpdate) => {
      if (!user?.email) throw new Error("Not authenticated");

      // Check if discord_user_id is being changed
      const { data: currentProfile } = await supabase
        .from("producers")
        .select("discord_user_id, name")
        .eq("email", user.email)
        .single();

      const discordIdChanged =
        updates.discord_user_id !== undefined &&
        updates.discord_user_id !== (currentProfile?.discord_user_id || null);

      const { data, error } = await supabase
        .from("producers")
        .update(updates)
        .eq("email", user.email)
        .select()
        .single();

      if (error) throw error;

      // Send email notification if Discord User ID was updated
      if (discordIdChanged) {
        try {
          await supabase.functions.invoke("send-contact-email", {
            body: {
              name: currentProfile?.name || user.email,
              email: "team@hechoenamericastudio.com",
              subject: "Producer Discord ID Updated",
              message: `Producer "${currentProfile?.name || user.email}" has updated their Discord User ID.\n\nNew Discord User ID: ${updates.discord_user_id || "(removed)"}\nPrevious Discord User ID: ${currentProfile?.discord_user_id || "(none)"}\n\nPlease update their Discord roles accordingly.`,
            },
          });
        } catch (emailError) {
          console.error("Failed to send Discord ID update email:", emailError);
        }
      }

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

export const useUploadProducerVideo = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (file: File) => {
      // Validate file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        throw new Error("Video must be under 50MB");
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `producer-video-${Date.now()}.${fileExt}`;
      const filePath = `producers/videos/${fileName}`;

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
      console.error("Error uploading video:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload video.",
        variant: "destructive",
      });
    },
  });
};
