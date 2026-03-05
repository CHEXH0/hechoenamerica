import React, { useState } from "react";
import { motion } from "framer-motion";
import { Candy, Send, Clock, CheckCircle, XCircle, DollarSign, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useChamoyRequests, useCreateChamoyRequest, useRespondChamoyRequest, type ChamoyRequest } from "@/hooks/useChamoyRequests";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pending Review", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: <Clock className="h-3 w-3" /> },
  approved: { label: "Price Set – Awaiting Response", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: <DollarSign className="h-3 w-3" /> },
  accepted: { label: "Accepted – Awaiting Payment", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: <CheckCircle className="h-3 w-3" /> },
  paid: { label: "Paid", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: <CheckCircle className="h-3 w-3" /> },
  declined: { label: "Declined", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: <XCircle className="h-3 w-3" /> },
  rejected: { label: "Not Available", color: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: <XCircle className="h-3 w-3" /> },
};

const ChamoyRequestCard = () => {
  const { user } = useAuth();
  const { data: requests } = useChamoyRequests();
  const createRequest = useCreateChamoyRequest();
  const respondRequest = useRespondChamoyRequest();
  const [description, setDescription] = useState("");
  const [payingId, setPayingId] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!description.trim()) return;
    createRequest.mutate(description.trim());
    setDescription("");
  };

  const handlePay = async (request: ChamoyRequest) => {
    if (!request.admin_price) return;
    setPayingId(request.id);
    try {
      const { data, error } = await supabase.functions.invoke("create-chamoy-payment", {
        body: { request_id: request.id },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch {
      toast({ title: "Error", description: "Failed to create payment.", variant: "destructive" });
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Main request card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="bg-gradient-to-br from-red-900/40 via-pink-900/30 to-orange-900/40 border-red-500/30 backdrop-blur-md overflow-hidden">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <img
                src="/laptop-uploads/Gomas_Chamoy.png"
                alt="Gomas Chamoy"
                className="h-40 w-40 object-contain drop-shadow-2xl"
              />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
              Gomas Chamoy
            </CardTitle>
            <CardDescription className="text-gray-300 text-base mt-2">
              Custom chamoy gummy candy made to order! Describe your dream candy below and we'll craft it for you. Approval takes 2-4 business days.
            </CardDescription>
          </CardHeader>

          {user ? (
            <>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Describe your ideal chamoy gummy... (flavor, shape, size, quantity, special requests)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-black/40 border-red-500/30 text-white placeholder:text-gray-500 min-h-[100px] focus:border-orange-400/60"
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500 text-right">{description.length}/1000</p>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleSubmit}
                  disabled={!description.trim() || createRequest.isPending}
                  className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white border-0"
                >
                  {createRequest.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Submit Request
                </Button>
              </CardFooter>
            </>
          ) : (
            <CardFooter className="justify-center pb-6">
              <p className="text-gray-400">Please sign in to submit a custom candy request.</p>
            </CardFooter>
          )}
        </Card>
      </motion.div>

      {/* User's existing requests */}
      {requests && requests.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-200">Your Requests</h3>
          {requests.map((req, i) => {
            const config = statusConfig[req.status] || statusConfig.pending;
            return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="bg-black/40 border-gray-700/50 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge className={`${config.color} border gap-1`}>
                        {config.icon}
                        {config.label}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(req.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-gray-300 text-sm">{req.description}</p>

                    {req.status === "approved" && req.admin_price && (
                      <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-blue-300 font-medium">Quoted Price:</span>
                          <span className="text-2xl font-bold text-blue-400">${req.admin_price}</span>
                        </div>
                        {req.admin_description && (
                          <p className="text-sm text-gray-300">{req.admin_description}</p>
                        )}
                        <div className="flex gap-3">
                          <Button
                            onClick={() => respondRequest.mutate({ id: req.id, accepted: true })}
                            disabled={respondRequest.isPending}
                            className="flex-1 bg-green-600 hover:bg-green-500 text-white"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Accept
                          </Button>
                          <Button
                            onClick={() => respondRequest.mutate({ id: req.id, accepted: false })}
                            disabled={respondRequest.isPending}
                            variant="outline"
                            className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/20"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    )}

                    {req.status === "accepted" && (
                      <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4">
                        <p className="text-green-300 mb-3">You accepted the offer of <strong>${req.admin_price}</strong>. Proceed to payment:</p>
                        <Button
                          onClick={() => handlePay(req)}
                          disabled={payingId === req.id}
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white"
                        >
                          {payingId === req.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <DollarSign className="h-4 w-4 mr-2" />
                          )}
                          Pay ${req.admin_price}
                        </Button>
                      </div>
                    )}

                    {req.status === "paid" && (
                      <div className="bg-emerald-900/30 border border-emerald-500/30 rounded-lg p-3">
                        <p className="text-emerald-300 text-sm flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" /> Payment received! Your order is being prepared.
                        </p>
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
