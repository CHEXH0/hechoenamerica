import { motion } from "framer-motion";
import { Gift, Package, Truck, CheckCircle, MapPin, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useChamoyRequests } from "@/hooks/useChamoyRequests";

const shippingStatusConfig: Record<string, { label: string; color: string; icon: JSX.Element }> = {
  pending: { label: "Preparing your order", color: "text-yellow-600", icon: <Package className="h-3.5 w-3.5" /> },
  processing: { label: "Processing", color: "text-blue-600", icon: <Package className="h-3.5 w-3.5" /> },
  shipped: { label: "Shipped", color: "text-purple-600", icon: <Truck className="h-3.5 w-3.5" /> },
  delivered: { label: "Delivered", color: "text-emerald-600", icon: <CheckCircle className="h-3.5 w-3.5" /> },
};

export const MyTreatsOrders = () => {
  const { data: requests } = useChamoyRequests();

  // Show only paid orders (HEA Box + Gomas Chamoy after payment)
  const paidOrders = (requests || []).filter((r) => r.status === "paid" || r.shipping_status !== "pending" || r.paid_at);

  if (!paidOrders.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="mb-8"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            My Treats Orders & Shipments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {paidOrders.map((order) => {
            const ship = shippingStatusConfig[order.shipping_status] || shippingStatusConfig.pending;
            const isHeaBox = order.description?.toLowerCase().includes("hea exclusive box");
            return (
              <div
                key={order.id}
                className="border rounded-lg p-4 bg-card hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {isHeaBox ? (
                        <Gift className="h-4 w-4 text-rose-500" />
                      ) : (
                        <Package className="h-4 w-4 text-orange-500" />
                      )}
                      <h4 className="font-semibold">
                        {isHeaBox ? "HEA Exclusive Box" : "Gomas Chamoy Order"}
                      </h4>
                      {order.admin_price && (
                        <Badge variant="outline" className="ml-auto">${order.admin_price}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{order.description}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                  <span className={`flex items-center gap-1.5 font-medium ${ship.color}`}>
                    {ship.icon} {ship.label}
                  </span>
                  {order.tracking_number && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" /> Tracking:{" "}
                      <span className="font-mono text-foreground">{order.tracking_number}</span>
                    </span>
                  )}
                  {order.shipped_at && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Shipped {new Date(order.shipped_at).toLocaleDateString()}
                    </span>
                  )}
                  {order.delivered_at && (
                    <span className="text-xs text-emerald-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Delivered {new Date(order.delivered_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MyTreatsOrders;
