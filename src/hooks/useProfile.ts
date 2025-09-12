import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type Profile = {
  id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export const useProfile = (userId?: string) => {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!userId,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Partial<Profile> }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useChangePassword = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (newPassword: string) => {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Password changed",
        description: "Your password has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to change password. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateEmail = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (newEmail: string) => {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Email update requested",
        description: "Please check your new email for a confirmation link.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update email. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteAccount = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.admin.deleteUser(
        (await supabase.auth.getUser()).data.user?.id || ''
      );
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete account. Please contact support.",
        variant: "destructive",
      });
    },
  });
};