import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Settings, RefreshCw, Shield, Music, Upload, Users, User, Database, TrendingUp, DollarSign, FileText, HardDrive, UserPlus, Candy, Trash2, Bell, XCircle, Truck, ChevronRight, Compass } from "lucide-react";
import NotificationBadge from "@/components/NotificationBadge";
import { useAdminNotifications } from "@/hooks/useNotifications";
import PricingAdmin from "@/components/PricingAdmin";
import { GoogleDriveConnect } from "@/components/GoogleDriveConnect";
import { ProducerProjects } from "@/components/ProducerProjects";
import { PaymentAnalyticsDashboard } from "@/components/PaymentAnalyticsDashboard";
import { StripeConnectOnboarding } from "@/components/StripeConnectOnboarding";
import { StorageManagement } from "@/components/StorageManagement";
import { ProducerApplicationsAdmin } from "@/components/ProducerApplicationsAdmin";
import { CancellationRequestsAdmin } from "@/components/CancellationRequestsAdmin";
import ChamoyRequestsAdmin from "@/components/ChamoyRequestsAdmin";
import CandyOrdersAdmin from "@/components/CandyOrdersAdmin";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useHiringStatus, useUpdateHiringStatus } from "@/hooks/useHiringStatus";
import { useGomasChamoyVisible, useSweetTreatsTabVisible, useUpdateStoreVisibility, useDistroAddOnVisible, useHeaBoxAddOnVisible } from "@/hooks/useStoreVisibility";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Purchase } from "@/hooks/usePurchases";

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: userRole, isLoading: roleLoading } = useUserRole();
  const { counts: adminCounts, total: adminTotal } = useAdminNotifications();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingPurchases, setPendingPurchases] = useState<Purchase[]>([]);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, string[]>>({});
  const [assigningRole, setAssigningRole] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);

  const [linkedProducerId, setLinkedProducerId] = useState<string | null>(null);
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalPurchases: 0,
    pendingPurchases: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalProducers: 0,
    storageUsed: 0,
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    } else if (userRole?.hasAccess) {
      fetchPendingPurchases();
      fetchLinkedProducer();
      if (userRole?.isAdmin) {
        fetchUsers();
        fetchSystemStats();
      }
    }
  }, [user, navigate, userRole]);

  const fetchLinkedProducer = async () => {
    if (!user?.email) return;
    
    // Try to find a producer linked to this user's email
    const { data: producer } = await supabase
      .from("producers")
      .select("id")
      .eq("email", user.email)
      .single();
    
    if (producer) {
      setLinkedProducerId(producer.id);
    }
  };

  const fetchPendingPurchases = async () => {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPendingPurchases(data || []);
    } catch (error) {
      console.error("Error fetching pending purchases:", error);
    }
  };

  const fetchSystemStats = async () => {
    try {
      // Fetch total users from auth
      const { data: allUsersData } = await supabase.functions.invoke('get-all-users');
      const usersCount = allUsersData?.users?.length || 0;

      // Fetch all purchases for stats
      const { data: purchasesData } = await supabase
        .from('purchases')
        .select('price, status');

      const totalPurchases = purchasesData?.length || 0;
      const pendingCount = purchasesData?.filter(p => p.status === 'pending').length || 0;
      
      // Calculate total revenue (convert string prices to numbers)
      const totalRevenue = purchasesData?.reduce((sum, purchase) => {
        const price = parseFloat(purchase.price) || 0;
        return sum + price;
      }, 0) || 0;

      // Fetch products count
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      // Fetch producers count
      const { count: producersCount } = await supabase
        .from('producers')
        .select('*', { count: 'exact', head: true });

      // Fetch storage usage (approximate from product-assets bucket)
      const { data: storageFiles } = await supabase.storage
        .from('product-assets')
        .list();
      
      const storageUsed = storageFiles?.length || 0;

      setSystemStats({
        totalUsers: usersCount || 0,
        totalPurchases,
        pendingPurchases: pendingCount,
        totalRevenue,
        totalProducts: productsCount || 0,
        totalProducers: producersCount || 0,
        storageUsed,
      });
    } catch (error) {
      console.error("Error fetching system stats:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-all-users');

      if (error) throw error;

      const rolesMap: Record<string, string[]> = {};
      data.users?.forEach((u: any) => {
        if (u.roles) {
          rolesMap[u.id] = u.roles;
        }
      });

      setUsers(data.users || []);
      setUserRoles(rolesMap);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users. Please refresh the page.",
        variant: "destructive",
      });
    }
  };

  const handleAssignRole = async (userId: string, role: string, action: 'add' | 'remove') => {
    setAssigningRole(userId);
    try {
      const { data, error } = await supabase.functions.invoke('assign-user-role', {
        body: { userId, role, action }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: data.message,
      });

      fetchUsers();
    } catch (error) {
      console.error("Error assigning role:", error);
      toast({
        title: "Error",
        description: "Failed to update user role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAssigningRole(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setDeletingUser(userId);
    try {
      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: { userId }
      });

      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      toast({
        title: "User deleted",
        description: "The user account and related data were removed.",
      });

      fetchUsers();
      fetchSystemStats();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user.",
        variant: "destructive",
      });
    } finally {
      setDeletingUser(null);
    }
  };


  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20 flex items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Check if user has admin or producer access
  const hasAccess = userRole?.hasAccess || false;
  const isAdmin = userRole?.isAdmin || false;
  const isProducer = userRole?.isProducer || false;

  if (!hasAccess) {
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

  const handleFileUpload = async (purchaseId: string, file: File) => {
    setUploadingId(purchaseId);
    try {
      const timestamp = Date.now();
      const fileName = `songs/${purchaseId}/${timestamp}_${file.name}`;
      
      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('product-assets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get signed URL (valid for 10 years)
      const { data: signedData, error: signError } = await supabase.storage
        .from('product-assets')
        .createSignedUrl(fileName, 315360000);

      if (signError || !signedData) throw signError;

      // Update purchase with download URL
      const { error: updateError } = await supabase.functions.invoke('update-purchase-status', {
        body: {
          purchaseId,
          downloadUrl: signedData.signedUrl,
          status: 'ready',
        }
      });

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Song uploaded and purchase updated!",
      });

      fetchPendingPurchases();
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error",
        description: "Failed to upload song. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingId(null);
    }
  };

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
        description: "Failed to sync products. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Store Visibility Control Component
  const StoreVisibilityControl = () => {
    const { data: gomasVisible, isLoading: gomasLoading } = useGomasChamoyVisible();
    const { data: treatsVisible, isLoading: treatsLoading } = useSweetTreatsTabVisible();
    const { data: distroAddOnVisible, isLoading: distroLoading } = useDistroAddOnVisible();
    const { data: heaBoxAddOnVisible, isLoading: heaBoxLoading } = useHeaBoxAddOnVisible();
    const updateVisibility = useUpdateStoreVisibility();

    const handleToggle = async (key: string, checked: boolean, label: string) => {
      try {
        await updateVisibility.mutateAsync({ key, enabled: checked });
        toast({
          title: checked ? `${label} Enabled` : `${label} Disabled`,
          description: checked ? `${label} is now visible to users.` : `${label} is now hidden from users.`,
        });
      } catch (error) {
        console.error("Error updating visibility:", error);
        toast({ title: "Error", description: "Failed to update visibility.", variant: "destructive" });
      }
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Candy className="h-5 w-5" />
            Store Visibility
          </CardTitle>
          <CardDescription>Control which candy/treats pages are visible to users</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Gomas Chamoy Page</Label>
              <p className="text-sm text-muted-foreground">
                {gomasVisible ? "The /gomas-chamoy page is live." : "The /gomas-chamoy page is hidden."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={gomasVisible ? "default" : "secondary"} className={gomasVisible ? "bg-green-500" : ""}>
                {gomasVisible ? "Visible" : "Hidden"}
              </Badge>
              <Switch
                checked={gomasVisible ?? true}
                onCheckedChange={(c) => handleToggle("gomas_chamoy_visible", c, "Gomas Chamoy Page")}
                disabled={gomasLoading || updateVisibility.isPending}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Sweet Treats Tab</Label>
              <p className="text-sm text-muted-foreground">
                {treatsVisible ? "The Sweet Treats tab is shown on /treats." : "The Sweet Treats tab is hidden on /treats."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={treatsVisible ? "default" : "secondary"} className={treatsVisible ? "bg-green-500" : ""}>
                {treatsVisible ? "Visible" : "Hidden"}
              </Badge>
              <Switch
                checked={treatsVisible ?? true}
                onCheckedChange={(c) => handleToggle("sweet_treats_tab_visible", c, "Sweet Treats Tab")}
                disabled={treatsLoading || updateVisibility.isPending}
              />
            </div>
          </div>

          <div className="border-t pt-6 space-y-6">
            <p className="text-sm font-medium text-muted-foreground">Pre-Checkout Add-Ons</p>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base">Find Your Distro</Label>
                <p className="text-sm text-muted-foreground">
                  {distroAddOnVisible ? "Offered as an add-on before song checkout." : "Hidden from the pre-checkout add-ons."}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={distroAddOnVisible ? "default" : "secondary"} className={distroAddOnVisible ? "bg-green-500" : ""}>
                  {distroAddOnVisible ? "Enabled" : "Disabled"}
                </Badge>
                <Switch
                  checked={distroAddOnVisible ?? true}
                  onCheckedChange={(c) => handleToggle("addon_distro_help_visible", c, "Find Your Distro Add-On")}
                  disabled={distroLoading || updateVisibility.isPending}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base">HEA Exclusive Box</Label>
                <p className="text-sm text-muted-foreground">
                  {heaBoxAddOnVisible ? "Offered as an add-on before song checkout." : "Hidden from the pre-checkout add-ons."}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={heaBoxAddOnVisible ? "default" : "secondary"} className={heaBoxAddOnVisible ? "bg-green-500" : ""}>
                  {heaBoxAddOnVisible ? "Enabled" : "Disabled"}
                </Badge>
                <Switch
                  checked={heaBoxAddOnVisible ?? true}
                  onCheckedChange={(c) => handleToggle("addon_hea_box_visible", c, "HEA Exclusive Box Add-On")}
                  disabled={heaBoxLoading || updateVisibility.isPending}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Hiring Status Control Component
  const HiringStatusControl = () => {
    const { data: hiringStatus, isLoading: hiringLoading } = useHiringStatus();
    const updateHiring = useUpdateHiringStatus();
    const isHiring = hiringStatus?.enabled ?? false;

    const handleToggle = async (checked: boolean) => {
      try {
        await updateHiring.mutateAsync(checked);
        toast({
          title: checked ? "Hiring Enabled" : "Hiring Disabled",
          description: checked 
            ? "Producer applications are now open." 
            : "Producer applications are now closed.",
        });
      } catch (error) {
        console.error("Error updating hiring status:", error);
        toast({
          title: "Error",
          description: "Failed to update hiring status.",
          variant: "destructive",
        });
      }
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Producer Recruitment
          </CardTitle>
          <CardDescription>
            Control whether new producer applications are accepted
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Accept New Applications</Label>
              <p className="text-sm text-muted-foreground">
                {isHiring 
                  ? "Applications are currently open. New producers can apply."
                  : "Applications are closed. The apply page shows a 'not hiring' message."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={isHiring ? "default" : "secondary"} className={isHiring ? "bg-green-500" : ""}>
                {isHiring ? "Hiring" : "Not Hiring"}
              </Badge>
              <Switch
                checked={isHiring}
                onCheckedChange={handleToggle}
                disabled={hiringLoading || updateHiring.isPending}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
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
            {isProducer && !isAdmin ? 'Producer Dashboard' : 'Admin Dashboard'}
          </h1>
          <p className="text-muted-foreground">
            {isProducer && !isAdmin 
              ? 'Upload completed songs for client purchases' 
              : 'Manage system settings and configurations'
            }
          </p>
          {userRole && (
            <div className="flex gap-2 mt-2">
              {userRole.roles.map(role => (
                <Badge key={role} variant="secondary" className="capitalize">
                  {role}
                </Badge>
              ))}
            </div>
          )}
        </motion.div>

        {/* Admin Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Producer-specific sections (admins use their own Stripe dashboard, no Connect needed) */}
          {userRole?.isProducer && !isAdmin && linkedProducerId && (
            <StripeConnectOnboarding producerId={linkedProducerId} />
          )}

          {/* Producer Projects - shows assigned song requests */}
          <div id="section-producer-projects" className="scroll-mt-24">
            <ProducerProjects />
          </div>

          {/* Google Drive Integration for producers */}
          <GoogleDriveConnect />

          {isAdmin && (
            <>
              {/* Needs Attention — tells the admin exactly where to click */}
              {adminTotal > 0 && (
                <Card className="border-red-500/30 bg-red-500/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5 text-red-500" />
                      Needs Attention
                      <NotificationBadge count={adminTotal} />
                    </CardTitle>
                    <CardDescription>
                      Open items waiting on you. Click one to jump to its section.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {([
                      { count: adminCounts.songUploads, label: "Song orders to deliver", icon: <Music className="h-4 w-4" />, target: "section-producer-projects" },
                      { count: adminCounts.cancellations, label: "Cancellation requests", icon: <XCircle className="h-4 w-4" />, target: "section-cancellations" },
                      { count: adminCounts.producerApplications, label: "Producer applications", icon: <UserPlus className="h-4 w-4" />, target: "section-applications" },
                      { count: adminCounts.chamoyRequests, label: "Chamoy gummy requests", icon: <Candy className="h-4 w-4" />, target: "section-chamoy" },
                      { count: adminCounts.candyOrders, label: "Candy orders to ship", icon: <Truck className="h-4 w-4" />, target: "section-candy" },
                      { count: adminCounts.distroConsultations, label: "Distro consultations", icon: <Compass className="h-4 w-4" />, route: "/support" },
                    ] as { count: number; label: string; icon: JSX.Element; target?: string; route?: string }[])
                      .filter((item) => item.count > 0)
                      .map((item) => (
                        <button
                          key={item.label}
                          onClick={() => {
                            if (item.route) {
                              navigate(item.route);
                            } else if (item.target) {
                              document
                                .getElementById(item.target)
                                ?.scrollIntoView({ behavior: "smooth", block: "start" });
                            }
                          }}
                          className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 text-left transition-colors hover:bg-muted/50"
                        >
                          <span className="text-muted-foreground">{item.icon}</span>
                          <span className="flex-1 text-sm font-medium">{item.label}</span>
                          <NotificationBadge count={item.count} />
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </button>
                      ))}
                  </CardContent>
                </Card>
              )}

              {/* Cancellation Requests - Show at top for visibility */}
              <div id="section-cancellations" className="scroll-mt-24">
                <CancellationRequestsAdmin />
              </div>

              {/* Chamoy Gummy Requests */}
              <div id="section-chamoy" className="scroll-mt-24">
                <ChamoyRequestsAdmin />
              </div>

              {/* Candy Orders Management */}
              <div id="section-candy" className="scroll-mt-24">
                <CandyOrdersAdmin />
              </div>

              {/* Store Visibility Controls */}
              <StoreVisibilityControl />

              {/* Hiring Status Control */}
              <HiringStatusControl />

              {/* Producer Applications Management */}
              <div id="section-applications" className="scroll-mt-24">
                <ProducerApplicationsAdmin onApprovalSuccess={fetchUsers} />
              </div>

              
              {/* Payment Analytics Dashboard */}
              <PaymentAnalyticsDashboard />

              {/* Song Pricing Management */}
              <PricingAdmin />
              
              {/* Storage Management */}
              <StorageManagement />
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    User Role Management
                  </CardTitle>
                  <CardDescription>
                    Assign producer or admin roles to users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {users.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No users found</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>User ID</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead>Current Roles</TableHead>
                          <TableHead>Assign Role</TableHead>
                          <TableHead className="text-right">Actions</TableHead>

                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((usr) => (
                          <TableRow key={usr.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={usr.avatar_url || undefined} />
                                  <AvatarFallback>
                                    <User className="h-4 w-4" />
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">
                                  {usr.display_name || 'No Name'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <code className="text-xs text-muted-foreground">
                                {usr.id.substring(0, 8)}...
                              </code>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {new Date(usr.created_at).toLocaleDateString()}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap">
                                {(userRoles[usr.id] || ['user']).map(role => (
                                  <Badge key={role} variant="secondary" className="capitalize">
                                    {role}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Select
                                  disabled={assigningRole === usr.id}
                                  onValueChange={(value) => {
                                    const [role, action] = value.split(':');
                                    handleAssignRole(usr.id, role, action as 'add' | 'remove');
                                  }}
                                >
                                  <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Select action" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {!userRoles[usr.id]?.includes('producer') && (
                                      <SelectItem value="producer:add">Add Producer</SelectItem>
                                    )}
                                    {userRoles[usr.id]?.includes('producer') && (
                                      <SelectItem value="producer:remove">Remove Producer</SelectItem>
                                    )}
                                    {!userRoles[usr.id]?.includes('admin') && (
                                      <SelectItem value="admin:add">Add Admin</SelectItem>
                                    )}
                                    {userRoles[usr.id]?.includes('admin') && (
                                      <SelectItem value="admin:remove">Remove Admin</SelectItem>
                                    )}
                                    {!userRoles[usr.id]?.includes('support') && (
                                      <SelectItem value="support:add">Add Support</SelectItem>
                                    )}
                                    {userRoles[usr.id]?.includes('support') && (
                                      <SelectItem value="support:remove">Remove Support</SelectItem>
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                            </TableCell>

                            <TableCell className="text-right">
                              {usr.id === user?.id ? (
                                <span className="text-xs text-muted-foreground">You</span>
                              ) : (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                      disabled={deletingUser === usr.id}
                                    >
                                      {deletingUser === usr.id ? (
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete this user?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This permanently deletes{" "}
                                        <span className="font-medium">
                                          {usr.display_name || usr.email || "this user"}
                                        </span>{" "}
                                        and all of their related data (purchases, song requests,
                                        roles, profile). This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        onClick={() => handleDeleteUser(usr.id)}
                                      >
                                        Delete User
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}

                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <RefreshCw className="h-5 w-5" />
                      Stripe Integration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Sync products from Supabase for payment processing.
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
                      <Database className="h-5 w-5" />
                      System Overview
                    </CardTitle>
                    <CardDescription>
                      Key metrics and system statistics
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <Users className="h-4 w-4" />
                          Total Users
                        </div>
                        <p className="text-2xl font-bold">{systemStats.totalUsers}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <FileText className="h-4 w-4" />
                          Total Purchases
                        </div>
                        <p className="text-2xl font-bold">{systemStats.totalPurchases}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <DollarSign className="h-4 w-4" />
                          Total Revenue
                        </div>
                        <p className="text-2xl font-bold">${systemStats.totalRevenue.toFixed(2)}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <TrendingUp className="h-4 w-4" />
                          Pending Orders
                        </div>
                        <p className="text-2xl font-bold">{systemStats.pendingPurchases}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <Music className="h-4 w-4" />
                          Total Products
                        </div>
                        <p className="text-2xl font-bold">{systemStats.totalProducts}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <User className="h-4 w-4" />
                          Total Producers
                        </div>
                        <p className="text-2xl font-bold">{systemStats.totalProducers}</p>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={fetchSystemStats}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh Statistics
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Admin;