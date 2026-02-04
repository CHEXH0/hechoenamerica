import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Package, Calendar, DollarSign, Music, Mic, Candy, Download, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { usePurchases, useDeletePurchase, useDeleteAllPurchases } from "@/hooks/usePurchases";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

const Purchases = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: purchases, isLoading, error } = usePurchases();
  const deletePurchase = useDeletePurchase();
  const deleteAllPurchases = useDeleteAllPurchases();

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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'samples':
        return <Music className="h-4 w-4" />;
      case 'vsts':
        return <Mic className="h-4 w-4" />;
      case 'candies':
        return <Candy className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'samples':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'vsts':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'candies':
        return 'bg-pink-500/10 text-pink-600 border-pink-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'ready':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'completed':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const totalSpent = purchases?.reduce((total, purchase) => {
    const price = parseFloat(purchase.price.replace('$', ''));
    return total + (isNaN(price) ? 0 : price);
  }, 0) || 0;

  const handleDownload = async (productId: string, productName: string, downloadUrl?: string) => {
    // If there's a direct download URL (for completed songs), use it
    if (downloadUrl) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${productName}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: `Downloading ${productName}`,
      });
      return;
    }

    // Original download logic for regular products
    try {
      // First, try to list available files for this product
      const { data: files, error: listError } = await supabase.storage
        .from('product-assets')
        .list(productId, {
          limit: 100,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (listError) {
        console.error('Error listing files:', listError);
        throw new Error('Unable to find download files');
      }

      if (!files || files.length === 0) {
        throw new Error('No download files available for this product');
      }

      // Find the main download file (prioritize .zip, then audio files)
      const downloadFile = files.find(file => 
        file.name.endsWith('.zip') || 
        file.name.endsWith('.wav') || 
        file.name.endsWith('.mp3') || 
        file.name.endsWith('.flac') || 
        file.name.endsWith('.aiff')
      );

      if (!downloadFile) {
        throw new Error('No compatible download files found');
      }

      // Get signed URL for the specific file
      const { data, error } = await supabase.storage
        .from('product-assets')
        .createSignedUrl(`${productId}/${downloadFile.name}`, 3600); // 1 hour expiry

      if (error) {
        throw error;
      }

      if (data?.signedUrl) {
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = data.signedUrl;
        link.download = downloadFile.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: "Download Started",
          description: `${downloadFile.name} is now downloading.`,
        });
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Unable to download this item. Please try again or contact support.",
        variant: "destructive",
      });
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
            My Purchases
          </h1>
          <p className="text-muted-foreground">
            Track your treats and purchases from the marketplace
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{purchases?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Latest Purchase</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {purchases?.[0] ? new Date(purchases[0].purchase_date).toLocaleDateString() : 'None'}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Purchases Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Purchase History</CardTitle>
              {purchases && purchases.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear all purchase history?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all your purchase records. Your downloaded files will not be affected, but you won't be able to re-download them from this page.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteAllPurchases.mutate()}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Error loading purchases</p>
                </div>
              ) : !purchases || purchases.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No purchases yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start exploring the treats marketplace to make your first purchase!
                  </p>
                  <Button onClick={() => navigate('/treats')}>
                    Browse Treats
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Download</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                    <TableBody>
                      {purchases.map((purchase) => (
                        <TableRow key={purchase.id}>
                          <TableCell>
                            <div className="font-medium">{purchase.product_name}</div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={getCategoryColor(purchase.product_category)}
                            >
                              {getCategoryIcon(purchase.product_category)}
                              <span className="ml-1 capitalize">{purchase.product_category}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={getStatusColor(purchase.status || 'completed')}
                            >
                              <span className="capitalize">{purchase.status || 'completed'}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{purchase.price}</span>
                          </TableCell>
                          <TableCell>
                            {new Date(purchase.purchase_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {purchase.status === 'pending' ? (
                              <span className="text-sm text-muted-foreground">Processing...</span>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownload(purchase.product_id, purchase.product_name, purchase.download_url)}
                                className="hover:bg-primary/10 hover:border-primary/20 hover:text-primary"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                            )}
                          </TableCell>
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete this purchase?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will remove "{purchase.product_name}" from your purchase history. You won't be able to re-download it from this page.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deletePurchase.mutate(purchase.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Purchases;