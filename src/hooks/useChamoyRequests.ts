import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export type ChamoyRequest = {
  id: string;
  user_id: string;
  user_email: string;
  description: string;
  status: string;
  admin_price: string | null;
  admin_description: string | null;
  admin_reviewed_at: string | null;
  user_accepted: boolean | null;
  user_responded_at: string | null;
  stripe_session_id: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

export const useChamoyRequests = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["chamoy-requests", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("chamoy_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ChamoyRequest[];
    },
    enabled: !!user?.id,
  });
};

export const useAllChamoyRequests = () => {
  return useQuery({
    queryKey: ["chamoy-requests-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chamoy_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ChamoyRequest[];
    },
  });
};

export const useCreateChamoyRequest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (description: string) => {
      if (!user?.id || !user?.email) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("chamoy_requests")
        .insert({
          user_id: user.id,
          user_email: user.email,
          description,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chamoy-requests"] });
      toast({ title: "Request submitted!", description: "Your chamoy gummy request has been sent. Approval takes 2-4 business days." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit request.", variant: "destructive" });
    },
  });
};

export const useAdminUpdateChamoyRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, admin_price, admin_description, status }: { id: string; admin_price: string; admin_description: string; status: string }) => {
      const { error } = await supabase
        .from("chamoy_requests")
        .update({ admin_price, admin_description, status, admin_reviewed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chamoy-requests-admin"] });
      toast({ title: "Request updated", description: "The chamoy request has been reviewed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update request.", variant: "destructive" });
    },
  });
};

export const useRespondChamoyRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, accepted }: { id: string; accepted: boolean }) => {
      const { error } = await supabase
        .from("chamoy_requests")
        .update({
          user_accepted: accepted,
          user_responded_at: new Date().toISOString(),
          status: accepted ? "accepted" : "declined",
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { accepted }) => {
      queryClient.invalidateQueries({ queryKey: ["chamoy-requests"] });
      toast({
        title: accepted ? "Accepted!" : "Declined",
        description: accepted ? "You'll be redirected to pay shortly." : "The offer has been declined.",
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to respond.", variant: "destructive" });
    },
  });
};
