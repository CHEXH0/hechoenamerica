import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Settings, RefreshCw, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
const Admin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20 flex items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  // Check if user is admin
  const isAdmin = user?.email === 'hechoenamerica369@gmail.com';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20 flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
              <p className="text-muted-foreground mb-4">
                You don't have permission to access this page.
              </p>
              <Button onClick={() => navigate('/')}>
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSyncProducts = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-products-to-stripe', {
        body: {},
      });

      if (error) throw error;

      const payload: any = data || {};
      const results = Array.isArray(payload.results) ? payload.results : [];
      const successCount = results.filter((r: any) => r.status === 'success').length;
      const errorCount = results.filter((r: any) => r.status === 'error').length;

      toast({
        title: payload.success ? "Sync Successful" : "Sync Completed",
        description: `${payload.message || 'Finished syncing.'} ${successCount ? `✓ ${successCount} ok.` : ''} ${errorCount ? `⚠️ ${errorCount} with issues.` : ''}`.trim(),
      });

      if (errorCount) {
        toast({
          title: "Tips to fix issues",
          description: "Ensure product prices are numeric (e.g., 49.99) or 'Free', then run sync again.",
        });
      }
    } catch (err) {
      console.error('Sync error:', err);
      toast({
        title: "Sync Failed",
        description: "Failed to sync products to Stripe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            className="mb-4 hover:bg-muted/50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage system settings and configurations
          </p>
        </motion.div>

        {/* Admin Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Stripe Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Sync products from Supabase to Stripe for payment processing.
              </p>
              <Button 
                onClick={handleSyncProducts}
                disabled={isSyncing}
                className="w-full"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? "Syncing..." : "Sync Products to Stripe"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Configure system-wide settings and preferences.
              </p>
              <Button variant="outline" className="w-full" disabled>
                <Settings className="mr-2 h-4 w-4" />
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Admin;