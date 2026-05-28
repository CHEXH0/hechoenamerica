import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type UserRole = 'admin' | 'producer' | 'support' | 'user';

export const useUserRole = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['userRole', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching user roles:', error);
        return null;
      }

      const roles = data?.map(r => r.role as UserRole) || [];
      const isAdmin = roles.includes('admin');

      return {
        roles,
        isAdmin,
        // Admins automatically have producer + support permissions
        isProducer: isAdmin || roles.includes('producer'),
        isSupport: isAdmin || roles.includes('support'),
        hasAccess: isAdmin || roles.includes('producer'),
      };
    },
    enabled: !!user,
    gcTime: 1000 * 60 * 5,
  });
};
