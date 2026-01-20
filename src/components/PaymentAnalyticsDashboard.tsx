import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  RefreshCw,
  CreditCard,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Wallet
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PaymentAnalytics {
  overview: {
    totalRequests: number;
    totalRevenue: number;
    totalPlatformFees: number;
    totalProducerPayouts: number;
    pendingPayoutAmount: number;
  };
  refunds: {
    pending: Array<{
      id: string;
      tier: string;
      price: string;
      deadline: string;
      createdAt: string;
    }>;
    completed: Array<{
      id: string;
      tier: string;
      price: string;
      refundedAt: string;
      createdAt: string;
    }>;
  };
  payouts: {
    pending: Array<{
      id: string;
      tier: string;
      price: string;
      estimatedPayout: number;
      producer: { id: string; name: string; email: string } | null;
      createdAt: string;
    }>;
    completed: Array<{
      id: string;
      tier: string;
      price: string;
      platformFee: number;
      producerPayout: number;
      paidAt: string;
      producer: { id: string; name: string; email: string } | null;
      createdAt: string;
    }>;
  };
  producers: {
    total: number;
    withConnect: number;
    onboarded: number;
    list: Array<{
      id: string;
      name: string;
      email: string;
      hasConnect: boolean;
      isOnboarded: boolean;
    }>;
  };
}

export const PaymentAnalyticsDashboard = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<PaymentAnalytics | null>(null);
  const [processingPayout, setProcessingPayout] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-payment-analytics");
      
      if (error) throw error;
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load payment analytics",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleProcessPayout = async (requestId: string) => {
    setProcessingPayout(requestId);
    try {
      const { data, error } = await supabase.functions.invoke("process-producer-payout", {
        body: { requestId },
      });

      if (error) throw error;

      toast({
        title: "Payout Processed",
        description: `Successfully processed payout of $${(data.payout.producerPayoutCents / 100).toFixed(2)}`,
      });
      
      fetchAnalytics();
    } catch (error) {
      console.error("Error processing payout:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process payout",
        variant: "destructive",
      });
    } finally {
      setProcessingPayout(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Failed to load analytics</p>
          <Button onClick={fetchAnalytics} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${analytics.overview.totalRevenue.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              From {analytics.overview.totalRequests} projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Platform Fees Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">${analytics.overview.totalPlatformFees.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">15% commission</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4 text-blue-500" />
              Producer Payouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">${analytics.overview.totalProducerPayouts.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.payouts.completed.length} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              Pending Payouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">${analytics.overview.pendingPayoutAmount.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.payouts.pending.length} awaiting
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stripe Connect Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Stripe Connect Status
          </CardTitle>
          <CardDescription>
            Producer onboarding status for automatic payouts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{analytics.producers.total} Total Producers</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-blue-500" />
              <span className="text-sm">{analytics.producers.withConnect} Started Onboarding</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm">{analytics.producers.onboarded} Fully Onboarded</span>
            </div>
          </div>

          {analytics.producers.list && analytics.producers.list.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producer</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Connect Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.producers.list.map((producer) => (
                  <TableRow key={producer.id}>
                    <TableCell className="font-medium">{producer.name}</TableCell>
                    <TableCell className="text-muted-foreground">{producer.email || "—"}</TableCell>
                    <TableCell>
                      {producer.isOnboarded ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Onboarded
                        </Badge>
                      ) : producer.hasConnect ? (
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          Not Started
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Tabs for Payouts and Refunds */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Payment Activity</CardTitle>
            <CardDescription>Manage payouts and refunds</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending-payouts">
            <TabsList className="grid grid-cols-4 w-full max-w-lg">
              <TabsTrigger value="pending-payouts" className="text-xs">
                Pending Payouts ({analytics.payouts.pending.length})
              </TabsTrigger>
              <TabsTrigger value="completed-payouts" className="text-xs">
                Completed ({analytics.payouts.completed.length})
              </TabsTrigger>
              <TabsTrigger value="pending-refunds" className="text-xs">
                Pending Refunds ({analytics.refunds.pending.length})
              </TabsTrigger>
              <TabsTrigger value="refund-history" className="text-xs">
                Refund History ({analytics.refunds.completed.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending-payouts" className="mt-4">
              {analytics.payouts.pending.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No pending payouts</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Producer</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Est. Payout</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.payouts.pending.map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell>
                          <Badge variant="outline">{payout.tier}</Badge>
                        </TableCell>
                        <TableCell>{payout.producer?.name || "Unknown"}</TableCell>
                        <TableCell>${parseFloat(payout.price).toFixed(2)}</TableCell>
                        <TableCell className="text-green-600 font-medium">
                          ${payout.estimatedPayout.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(payout.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => handleProcessPayout(payout.id)}
                            disabled={processingPayout === payout.id}
                          >
                            {processingPayout === payout.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <DollarSign className="h-4 w-4 mr-1" />
                                Process
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="completed-payouts" className="mt-4">
              {analytics.payouts.completed.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No completed payouts yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Producer</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Platform Fee</TableHead>
                      <TableHead>Producer Payout</TableHead>
                      <TableHead>Paid At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.payouts.completed.map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell>
                          <Badge variant="outline">{payout.tier}</Badge>
                        </TableCell>
                        <TableCell>{payout.producer?.name || "Unknown"}</TableCell>
                        <TableCell>${parseFloat(payout.price).toFixed(2)}</TableCell>
                        <TableCell className="text-orange-600">
                          ${payout.platformFee.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-green-600 font-medium">
                          ${payout.producerPayout.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(payout.paidAt), "MMM d, yyyy HH:mm")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="pending-refunds" className="mt-4">
              {analytics.refunds.pending.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-muted-foreground">No pending refunds</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="text-sm">
                      These projects expired without producer acceptance and will be automatically refunded
                    </span>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Deadline</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.refunds.pending.map((refund) => (
                        <TableRow key={refund.id}>
                          <TableCell>
                            <Badge variant="outline">{refund.tier}</Badge>
                          </TableCell>
                          <TableCell>${parseFloat(refund.price).toFixed(2)}</TableCell>
                          <TableCell className="text-red-600">
                            {format(new Date(refund.deadline), "MMM d, yyyy HH:mm")}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(refund.createdAt), "MMM d, yyyy")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="refund-history" className="mt-4">
              {analytics.refunds.completed.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No refunds processed</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Refunded At</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.refunds.completed.map((refund) => (
                      <TableRow key={refund.id}>
                        <TableCell>
                          <Badge variant="destructive">{refund.tier}</Badge>
                        </TableCell>
                        <TableCell className="text-red-600">
                          -${parseFloat(refund.price).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(refund.refundedAt), "MMM d, yyyy HH:mm")}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(refund.createdAt), "MMM d, yyyy")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
