import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAllChamoyRequests, useAdminUpdateChamoyRequest } from "@/hooks/useChamoyRequests";
import { CheckCircle, XCircle, DollarSign, Loader2, Candy } from "lucide-react";

const ChamoyRequestsAdmin = () => {
  const { data: requests, isLoading } = useAllChamoyRequests();
  const updateRequest = useAdminUpdateChamoyRequest();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");

  const handleApprove = (id: string) => {
    if (!price.trim()) return;
    updateRequest.mutate({ id, admin_price: price, admin_description: desc, status: "approved" });
    setEditingId(null);
    setPrice("");
    setDesc("");
  };

  const handleReject = (id: string) => {
    updateRequest.mutate({ id, admin_price: "", admin_description: "Request not available at this time.", status: "rejected" });
  };

  if (isLoading) return <p className="text-gray-400">Loading chamoy requests...</p>;
  if (!requests?.length) return null;

  return (
    <Card className="bg-black/30 border-orange-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-400">
          <Candy className="h-5 w-5" />
          Chamoy Gummy Requests ({requests.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {requests.map((req) => (
          <div key={req.id} className="bg-black/40 rounded-lg p-4 border border-gray-700/50 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm text-gray-400">{req.user_email}</p>
                <p className="text-gray-200 mt-1">{req.description}</p>
                <p className="text-xs text-gray-500 mt-1">{new Date(req.created_at).toLocaleString()}</p>
              </div>
              <Badge variant="outline" className="shrink-0">{req.status}</Badge>
            </div>

            {req.status === "pending" && (
              editingId === req.id ? (
                <div className="space-y-3 bg-orange-900/20 border border-orange-500/30 rounded-lg p-3">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Price (USD)"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="bg-black/40 border-orange-500/30"
                  />
                  <Textarea
                    placeholder="Description for the customer (what they're getting, qty, etc.)"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    className="bg-black/40 border-orange-500/30"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(req.id)}
                      disabled={!price.trim() || updateRequest.isPending}
                      className="bg-green-600 hover:bg-green-500 text-white"
                      size="sm"
                    >
                      {updateRequest.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                      Set Price & Approve
                    </Button>
                    <Button onClick={() => { setEditingId(null); setPrice(""); setDesc(""); }} variant="ghost" size="sm">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={() => setEditingId(req.id)} size="sm" className="bg-orange-600 hover:bg-orange-500 text-white">
                    <DollarSign className="h-3 w-3 mr-1" /> Set Price
                  </Button>
                  <Button onClick={() => handleReject(req.id)} size="sm" variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/20">
                    <XCircle className="h-3 w-3 mr-1" /> Reject
                  </Button>
                </div>
              )
            )}

            {req.status === "approved" && (
              <p className="text-sm text-blue-400">Waiting for customer response – Price: ${req.admin_price}</p>
            )}
            {req.status === "accepted" && (
              <p className="text-sm text-green-400">Customer accepted – Awaiting payment (${req.admin_price})</p>
            )}
            {req.status === "paid" && (
              <p className="text-sm text-emerald-400 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Paid – ${req.admin_price}</p>
            )}
            {req.status === "declined" && (
              <p className="text-sm text-red-400">Customer declined the offer</p>
            )}
            {req.status === "rejected" && (
              <p className="text-sm text-gray-400">Request was rejected</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ChamoyRequestsAdmin;
