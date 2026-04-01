import { useState, useEffect } from "react";
import { Candy, Package, Truck, CheckCircle, RefreshCw, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CandyOrder {
  id: string;
  product_name: string;
  price: string;
  purchase_date: string;
  user_id: string;
  shipping_status: string;
  tracking_number: string | null;
  shipping_address: string | null;
  status: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pending", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", icon: <Package className="h-3 w-3" /> },
  processing: { label: "Processing", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: <Package className="h-3 w-3" /> },
  shipped: { label: "Shipped", color: "bg-purple-500/10 text-purple-600 border-purple-500/20", icon: <Truck className="h-3 w-3" /> },
  delivered: { label: "Delivered", color: "bg-green-500/10 text-green-600 border-green-500/20", icon: <CheckCircle className="h-3 w-3" /> },
};

const CandyOrdersAdmin = () => {
  const [orders, setOrders] = useState<CandyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("purchases")
        .select("*")
        .eq("product_category", "candies")
        .order("purchase_date", { ascending: false });

      if (error) throw error;
      setOrders((data as any[]) || []);
      
      const inputs: Record<string, string> = {};
      data?.forEach((o: any) => {
        if (o.tracking_number) inputs[o.id] = o.tracking_number;
      });
      setTrackingInputs(inputs);
    } catch (error) {
      console.error("Error fetching candy orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateShippingStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const trackingNumber = trackingInputs[orderId] || null;
      
      const { error } = await supabase.functions.invoke("update-purchase-status", {
        body: {
          purchaseId: orderId,
          status: newStatus,
          trackingNumber,
          shippingStatus: newStatus,
        },
      });

      if (error) throw error;

      toast({
        title: "Order Updated",
        description: `Shipping status changed to ${statusConfig[newStatus]?.label || newStatus}`,
      });

      fetchOrders();
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Error",
        description: "Failed to update order status.",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatus = (order: CandyOrder) => {
    const s = order.shipping_status || "pending";
    return statusConfig[s] || statusConfig.pending;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Candy className="h-5 w-5" />
            Candy Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">Loading orders...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Candy className="h-5 w-5" />
            Candy Orders ({orders.length})
          </CardTitle>
          <CardDescription>Manage shipping and tracking for candy purchases</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No candy orders yet</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Shipping Status</TableHead>
                  <TableHead>Tracking Number</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const status = getStatus(order);
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.product_name}</TableCell>
                      <TableCell>{order.price}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(order.purchase_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={status.color}>
                          {status.icon}
                          <span className="ml-1">{status.label}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Enter tracking #"
                          value={trackingInputs[order.id] || ""}
                          onChange={(e) =>
                            setTrackingInputs((prev) => ({
                              ...prev,
                              [order.id]: e.target.value,
                            }))
                          }
                          className="w-40 h-8 text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          disabled={updatingId === order.id}
                          onValueChange={(value) => updateShippingStatus(order.id, value)}
                          value={order.shipping_status || "pending"}
                        >
                          <SelectTrigger className="w-36 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CandyOrdersAdmin;
