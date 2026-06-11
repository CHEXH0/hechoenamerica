import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Compass, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useNotifications } from "@/hooks/useNotifications";
import { DistroRequestsAdmin } from "@/components/DistroRequestsAdmin";

const Support = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: userRole, isLoading: roleLoading } = useUserRole();
  const { markSeen } = useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  // Viewing the support panel clears its "new update" bubble.
  useEffect(() => {
    if (user && userRole?.isSupport) markSeen("support");
  }, [user, userRole?.isSupport]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  if (!user) return null;

  const isSupport = userRole?.isSupport;

  if (!isSupport) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <Compass className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-2xl font-semibold">Support panel</h1>
        <p className="text-muted-foreground max-w-md">
          You need the Support or Admin role to view this page. Ask an admin to grant you access.
        </p>
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold flex items-center gap-2">
              <Compass className="h-6 w-6 text-primary" />
              HEA Support Panel
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Help clients with their Discover Your Distro consultations.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" /> Home
          </Button>
        </div>

        <DistroRequestsAdmin />
      </div>
    </div>
  );
};

export default Support;
