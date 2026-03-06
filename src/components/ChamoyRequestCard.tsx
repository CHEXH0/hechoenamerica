import React, { useState } from "react";
import { motion } from "framer-motion";
import { Candy, Send, Clock, CheckCircle, XCircle, DollarSign, Loader2, Package, Truck, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useChamoyRequests, useCreateChamoyRequest, useRespondChamoyRequest, type ChamoyRequest } from "@/hooks/useChamoyRequests";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pending Review", color: "bg-yellow-900/40 text-yellow-300 border-yellow-600/40", icon: <Clock className="h-3 w-3" /> },
  approved: { label: "Price Set – Awaiting Response", color: "bg-blue-900/40 text-blue-300 border-blue-600/40", icon: <DollarSign className="h-3 w-3" /> },
  accepted: { label: "Accepted – Awaiting Payment", color: "bg-green-900/40 text-green-300 border-green-600/40", icon: <CheckCircle className="h-3 w-3" /> },
  paid: { label: "Paid – Preparing Order", color: "bg-emerald-900/40 text-emerald-300 border-emerald-600/40", icon: <Package className="h-3 w-3" /> },
  declined: { label: "Declined", color: "bg-red-900/40 text-red-300 border-red-600/40", icon: <XCircle className="h-3 w-3" /> },
  rejected: { label: "Not Available", color: "bg-gray-800/40 text-gray-300 border-gray-600/40", icon: <XCircle className="h-3 w-3" /> },
};

const shippingStatusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Preparing", color: "text-yellow-300", icon: <Package className="h-3 w-3" /> },
  processing: { label: "Processing", color: "text-blue-300", icon: <Package className="h-3 w-3" /> },
  shipped: { label: "Shipped", color: "text-purple-300", icon: <Truck className="h-3 w-3" /> },
  delivered: { label: "Delivered", color: "text-emerald-300", icon: <CheckCircle className="h-3 w-3" /> },
};

const ChamoyRequestCard = () => {
  const { user } = useAuth();
  const { data: requests } = useChamoyRequests();
  const createRequest = useCreateChamoyRequest();
  const respondRequest = useRespondChamoyRequest();
  const [description, setDescription] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState(user?.email || "");
  const [shippingAddress, setShippingAddress] = useState("");
  const [payingId, setPayingId] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!description.trim() || !customerName.trim() || !customerEmail.trim() || !shippingAddress.trim()) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    createRequest.mutate({
      description: description.trim(),
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      customer_email: customerEmail.trim(),
      shipping_address: shippingAddress.trim(),
    });
    setDescription("");
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail(user?.email || "");
    setShippingAddress("");
  };

  const handlePay = async (request: ChamoyRequest) => {
    if (!request.admin_price) return;
    setPayingId(request.id);
    try {
      const { data, error } = await supabase.functions.invoke("create-chamoy-payment", {
        body: { request_id: request.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      console.error("Chamoy payment error:", err);
      toast({ title: "Error", description: err?.message || "Failed to create payment.", variant: "destructive" });
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="bg-[#1a0a0e] border-red-800/50 backdrop-blur-md overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-red-900/30 via-pink-900/20 to-orange-900/30 pointer-events-none" />
          <CardHeader className="text-center pb-2 relative z-10">
            <div className="flex justify-center mb-4">
              <img src="/laptop-uploads/Gomas_Chamoy.png" alt="Gomas Chamoy" className="h-40 w-40 object-contain drop-shadow-2xl" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
              Gomas Chamoy
            </CardTitle>
            <CardDescription className="text-gray-300 text-base mt-2">
              Custom chamoy gummy candy made to order! Fill in your details below and we'll craft it for you. Approval takes 2-4 business days.
            </CardDescription>
          </CardHeader>

          {user ? (
            <>
              <CardContent className="space-y-4 relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="chamoy-name" className="text-gray-300 text-sm">Full Name *</Label>
                    <Input
                      id="chamoy-name"
                      placeholder="Your full name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="bg-black/60 border-red-800/40 text-white placeholder:text-gray-500 focus:border-orange-500/60"
                      maxLength={100}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="chamoy-phone" className="text-gray-300 text-sm">Phone Number</Label>
                    <Input
                      id="chamoy-phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="bg-black/60 border-red-800/40 text-white placeholder:text-gray-500 focus:border-orange-500/60"
                      maxLength={20}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="chamoy-email" className="text-gray-300 text-sm">Email (for confirmations) *</Label>
                  <Input
                    id="chamoy-email"
                    type="email"
                    placeholder="your@email.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="bg-black/60 border-red-800/40 text-white placeholder:text-gray-500 focus:border-orange-500/60"
                    maxLength={255}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="chamoy-address" className="text-gray-300 text-sm">Shipping Address *</Label>
                  <Textarea
                    id="chamoy-address"
                    placeholder="Street address, city, state, ZIP code, country"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="bg-black/60 border-red-800/40 text-white placeholder:text-gray-500 min-h-[60px] focus:border-orange-500/60"
                    maxLength={500}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="chamoy-desc" className="text-gray-300 text-sm">Order Description *</Label>
                  <Textarea
                    id="chamoy-desc"
                    placeholder="Describe your ideal chamoy gummy... (flavor, shape, size, quantity, special requests)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-black/60 border-red-800/40 text-white placeholder:text-gray-500 min-h-[100px] focus:border-orange-500/60"
                    maxLength={1000}
                  />
                  <p className="text-xs text-gray-400 text-right">{description.length}/1000</p>
                </div>
              </CardContent>
              <CardFooter className="relative z-10">
                <Button
                  onClick={handleSubmit}
                  disabled={!description.trim() || !customerName.trim() || !customerEmail.trim() || !shippingAddress.trim() || createRequest.isPending}
                  className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white border-0"
                >
                  {createRequest.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  Submit Request
                </Button>
              </CardFooter>
            </>
          ) : (
            <CardFooter className="justify-center pb-6 relative z-10">
              <p className="text-gray-400">Please sign in to submit a custom candy request.</p>
            </CardFooter>
          )}
        </Card>
      </motion.div>

      {requests && requests.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-200">Your Requests</h3>
          {requests.map((req, i) => {
            const config = statusConfig[req.status] || statusConfig.pending;
            const shippingConfig = shippingStatusConfig[req.shipping_status] || shippingStatusConfig.pending;
            return (
              <motion.div key={req.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className="bg-[#0d0d0d] border-gray-700/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge className={`${config.color} border gap-1`}>{config.icon}{config.label}</Badge>
                      <span className="text-xs text-gray-500">{new Date(req.created_at).toLocaleDateString()}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-gray-300 text-sm">{req.description}</p>

                    {req.status === "approved" && req.admin_price && (
                      <div className="bg-blue-950/60 border border-blue-700/40 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-blue-300 font-medium">Quoted Price:</span>
                          <span className="text-2xl font-bold text-blue-300">${req.admin_price}</span>
                        </div>
                        {req.admin_description && <p className="text-sm text-gray-300">{req.admin_description}</p>}
                        <div className="flex gap-3">
                          <Button onClick={() => respondRequest.mutate({ id: req.id, accepted: true })} disabled={respondRequest.isPending} className="flex-1 bg-green-700 hover:bg-green-600 text-white">
                            <CheckCircle className="h-4 w-4 mr-2" /> Accept
                          </Button>
                          <Button onClick={() => respondRequest.mutate({ id: req.id, accepted: false })} disabled={respondRequest.isPending} variant="outline" className="flex-1 border-red-600/50 text-red-300 hover:bg-red-900/30 hover:text-red-200">
                            <XCircle className="h-4 w-4 mr-2" /> Decline
                          </Button>
                        </div>
                      </div>
                    )}

                    {req.status === "accepted" && (
                      <div className="bg-green-950/60 border border-green-700/40 rounded-lg p-4">
                        <p className="text-green-300 mb-3">You accepted the offer of <strong>${req.admin_price}</strong>. Proceed to payment:</p>
                        <Button onClick={() => handlePay(req)} disabled={payingId === req.id} className="w-full bg-gradient-to-r from-green-700 to-emerald-700 hover:from-green-600 hover:to-emerald-600 text-white">
                          {payingId === req.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <DollarSign className="h-4 w-4 mr-2" />}
                          Pay ${req.admin_price}
                        </Button>
                      </div>
                    )}

                    {req.status === "paid" && (
                      <div className="bg-emerald-950/60 border border-emerald-700/40 rounded-lg p-4 space-y-3">
                        <p className="text-emerald-300 text-sm flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" /> Payment received!
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                          <span className={`flex items-center gap-1 font-medium ${shippingConfig.color}`}>
                            {shippingConfig.icon} {shippingConfig.label}
                          </span>
                        </div>
                        {req.tracking_number && (
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> Tracking: <span className="text-gray-200 font-mono">{req.tracking_number}</span>
                          </p>
                        )}
                        {req.shipped_at && (
                          <p className="text-xs text-gray-500">Shipped: {new Date(req.shipped_at).toLocaleDateString()}</p>
                        )}
                        {req.delivered_at && (
                          <p className="text-xs text-gray-500">Delivered: {new Date(req.delivered_at).toLocaleDateString()}</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChamoyRequestCard;
