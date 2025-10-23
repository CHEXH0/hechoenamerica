import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type UserRole = 'admin' | 'producer' | 'user';

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

      // Return all roles as an array
      const roles = data?.map(r => r.role as UserRole) || [];
      
      return {
        roles,
        isAdmin: roles.includes('admin'),
        isProducer: roles.includes('producer'),
        hasAccess: roles.includes('admin') || roles.includes('producer'),
      };
    },
    enabled: !!user,
    gcTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};
