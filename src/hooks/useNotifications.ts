import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";

// Areas that can have "new update" bubbles.
export type NotifArea = "client" | "producer" | "support";

const EPOCH = "1970-01-01T00:00:00.000Z";

const seenKey = (userId: string, area: NotifArea) => `hea_notif_seen_${area}_${userId}`;

const getLastSeen = (userId: string, area: NotifArea): string =>
  localStorage.getItem(seenKey(userId, area)) || EPOCH;

export interface NotificationCounts {
  client: number;
  producer: number;
  support: number;
}

const EMPTY: NotificationCounts = { client: 0, producer: 0, support: 0 };

/**
 * Lightweight "new update" counter.
 * Counts items changed (updated_at) since the user last opened each area.
 * "Last seen" is stored per-user in localStorage — no schema changes required.
 */
export const useNotifications = () => {
  const { user } = useAuth();
  const { data: role } = useUserRole();
  const queryClient = useQueryClient();

  const isProducer = role?.isProducer || false;
  const isSupport = role?.isSupport || false;

  const query = useQuery({
    queryKey: ["notifications", user?.id, isProducer, isSupport],
    enabled: !!user,
    refetchInterval: 60000, // keep counts fresh once a minute
    queryFn: async (): Promise<NotificationCounts> => {
      if (!user) return EMPTY;
      const counts: NotificationCounts = { ...EMPTY };

      // Client: updates to my own song requests
      const { count: clientCount } = await supabase
        .from("song_requests")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gt("updated_at", getLastSeen(user.id, "client"));
      counts.client = clientCount || 0;

      // Producer: updates to projects assigned to me
      if (isProducer && user.email) {
        const { data: producer } = await supabase
          .from("producers")
          .select("id")
          .eq("email", user.email)
          .maybeSingle();
        if (producer) {
          const { count } = await supabase
            .from("song_requests")
            .select("id", { count: "exact", head: true })
            .eq("assigned_producer_id", producer.id)
            .gt("updated_at", getLastSeen(user.id, "producer"));
          counts.producer = count || 0;
        }
      }

      // Support: distro consultations the support team can act on
      if (isSupport) {
        const { count } = await supabase
          .from("distro_requests")
          .select("id", { count: "exact", head: true })
          .not("client_selected_time", "is", null)
          .gt("updated_at", getLastSeen(user.id, "support"));
        counts.support = count || 0;
      }

      return counts;
    },
  });

  const counts = query.data || EMPTY;

  // Mark an area as seen — clears its bubble until the next change.
  const markSeen = (area: NotifArea) => {
    if (!user) return;
    localStorage.setItem(seenKey(user.id, area), new Date().toISOString());
    queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
  };

  return {
    counts,
    total: counts.client + counts.producer + counts.support,
    markSeen,
    isLoading: query.isLoading,
  };
};
