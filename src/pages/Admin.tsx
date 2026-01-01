import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Settings, RefreshCw, Shield, Music, Upload, Users, User, Database, TrendingUp, DollarSign, FileText, HardDrive } from "lucide-react";
import { GoogleDriveConnect } from "@/components/GoogleDriveConnect";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
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
import type { Purchase } from "@/hooks/usePurchases";

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: userRole, isLoading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingPurchases, setPendingPurchases] = useState<Purchase[]>([]);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, string[]>>({});
  const [assigningRole, setAssigningRole] = useState<string | null>(null);
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
      if (userRole?.isAdmin) {
        fetchUsers();
        fetchSystemStats();
      }
    }
  }, [user, navigate, userRole]);

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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                Pending Song Generations
              </CardTitle>
              <CardDescription>
                Upload completed songs for customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingPurchases.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No pending purchases</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Idea</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingPurchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell>
                          {purchase.user_id?.substring(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-orange-500/10 text-orange-600">
                            {purchase.product_category}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {purchase.song_idea || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {new Date(purchase.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Label htmlFor={`upload-${purchase.id}`} className="cursor-pointer">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={uploadingId === purchase.id}
                              asChild
                            >
                              <span>
                                {uploadingId === purchase.id ? (
                                  <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload Song
                                  </>
                                )}
                              </span>
                            </Button>
                          </Label>
                          <Input
                            id={`upload-${purchase.id}`}
                            type="file"
                            accept=".mp3,.wav,.m4a,.flac"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(purchase.id, file);
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Google Drive Integration for producers */}
          <GoogleDriveConnect />

          {isAdmin && (
            <>
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
                                  </SelectContent>
                                </Select>
                              </div>
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