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
      // Use upsert to handle old users who don't have a profile yet
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          ...updates,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })
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
      if (newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

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
      console.error('Change password error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to change password. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateEmail = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (newEmail: string) => {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        throw new Error('Please enter a valid email address');
      }

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
      console.error('Update email error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update email. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteAccount = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(
        `https://eapbuoqkhckqaswfjexv.supabase.co/functions/v1/delete-user-account`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete account');
      }

      // Sign out after successful deletion
      await supabase.auth.signOut();
    },
    onSuccess: () => {
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      });
      // Redirect to home page after a brief delay
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    },
    onError: (error) => {
      console.error('Delete account error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete account. Please contact support.",
        variant: "destructive",
      });
    },
  });
};