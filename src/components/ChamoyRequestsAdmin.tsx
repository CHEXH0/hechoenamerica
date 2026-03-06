import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAllChamoyRequests, useAdminUpdateChamoyRequest } from "@/hooks/useChamoyRequests";
import { CheckCircle, XCircle, DollarSign, Loader2, Candy, Truck, Package, MapPin, User, Phone, Mail } from "lucide-react";

const ChamoyRequestsAdmin = () => {
  const { data: requests, isLoading } = useAllChamoyRequests();
  const updateRequest = useAdminUpdateChamoyRequest();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");
  const [shippingEditId, setShippingEditId] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingStatus, setShippingStatus] = useState("");
  const [notesEditId, setNotesEditId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

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

  const handleShippingUpdate = (id: string) => {
    updateRequest.mutate({
      id,
      shipping_status: shippingStatus,
      tracking_number: trackingNumber || undefined,
    });
    setShippingEditId(null);
    setTrackingNumber("");
    setShippingStatus("");
  };

  const handleNotesUpdate = (id: string) => {
    updateRequest.mutate({ id, admin_notes: adminNotes });
    setNotesEditId(null);
    setAdminNotes("");
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
              <div className="flex-1 space-y-1">
                <p className="text-sm text-gray-400">{req.user_email}</p>
                <p className="text-gray-200 mt-1">{req.description}</p>
                <p className="text-xs text-gray-500 mt-1">{new Date(req.created_at).toLocaleString()}</p>
              </div>
              <Badge variant="outline" className="shrink-0">{req.status}</Badge>
            </div>

            {/* Customer details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-900/50 rounded-lg p-3 text-sm">
              {req.customer_name && (
                <p className="text-gray-300 flex items-center gap-1.5"><User className="h-3 w-3 text-gray-500" /> {req.customer_name}</p>
              )}
              {req.customer_phone && (
                <p className="text-gray-300 flex items-center gap-1.5"><Phone className="h-3 w-3 text-gray-500" /> {req.customer_phone}</p>
              )}
              {req.customer_email && (
                <p className="text-gray-300 flex items-center gap-1.5"><Mail className="h-3 w-3 text-gray-500" /> {req.customer_email}</p>
              )}
              {req.shipping_address && (
                <p className="text-gray-300 flex items-center gap-1.5 sm:col-span-2"><MapPin className="h-3 w-3 text-gray-500 shrink-0" /> {req.shipping_address}</p>
              )}
            </div>

            {/* Pending: set price */}
            {req.status === "pending" && (
              editingId === req.id ? (
                <div className="space-y-3 bg-orange-900/20 border border-orange-500/30 rounded-lg p-3">
                  <Input type="number" step="0.01" min="0" placeholder="Price (USD)" value={price} onChange={(e) => setPrice(e.target.value)} className="bg-black/40 border-orange-500/30" />
                  <Textarea placeholder="Description for the customer (what they're getting, qty, etc.)" value={desc} onChange={(e) => setDesc(e.target.value)} className="bg-black/40 border-orange-500/30" />
                  <div className="flex gap-2">
                    <Button onClick={() => handleApprove(req.id)} disabled={!price.trim() || updateRequest.isPending} className="bg-green-600 hover:bg-green-500 text-white" size="sm">
                      {updateRequest.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                      Set Price & Approve
                    </Button>
                    <Button onClick={() => { setEditingId(null); setPrice(""); setDesc(""); }} variant="ghost" size="sm">Cancel</Button>
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
              <div className="space-y-3">
                <p className="text-sm text-emerald-400 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Paid – ${req.admin_price}</p>

                {/* Shipping status display */}
                <div className="bg-gray-900/50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Truck className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-300">Shipping: <strong className="text-white capitalize">{req.shipping_status}</strong></span>
                    {req.tracking_number && <span className="text-gray-400 font-mono text-xs">#{req.tracking_number}</span>}
                  </div>
                  {req.shipped_at && <p className="text-xs text-gray-500">Shipped: {new Date(req.shipped_at).toLocaleString()}</p>}
                  {req.delivered_at && <p className="text-xs text-gray-500">Delivered: {new Date(req.delivered_at).toLocaleString()}</p>}
                </div>

                {/* Shipping edit */}
                {shippingEditId === req.id ? (
                  <div className="space-y-2 bg-purple-900/20 border border-purple-500/30 rounded-lg p-3">
                    <Select value={shippingStatus} onValueChange={setShippingStatus}>
                      <SelectTrigger className="bg-black/40 border-purple-500/30">
                        <SelectValue placeholder="Shipping status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input placeholder="Tracking number (optional)" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} className="bg-black/40 border-purple-500/30" />
                    <div className="flex gap-2">
                      <Button onClick={() => handleShippingUpdate(req.id)} disabled={!shippingStatus || updateRequest.isPending} size="sm" className="bg-purple-600 hover:bg-purple-500 text-white">
                        {updateRequest.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Truck className="h-3 w-3 mr-1" />}
                        Update Shipping
                      </Button>
                      <Button onClick={() => { setShippingEditId(null); setTrackingNumber(""); setShippingStatus(""); }} variant="ghost" size="sm">Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <Button onClick={() => { setShippingEditId(req.id); setShippingStatus(req.shipping_status); setTrackingNumber(req.tracking_number || ""); }} size="sm" variant="outline" className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20">
                    <Truck className="h-3 w-3 mr-1" /> Update Shipping
                  </Button>
                )}
              </div>
            )}
            {req.status === "declined" && <p className="text-sm text-red-400">Customer declined the offer</p>}
            {req.status === "rejected" && <p className="text-sm text-gray-400">Request was rejected</p>}

            {/* Admin notes */}
            <div className="border-t border-gray-700/50 pt-2 mt-2">
              {notesEditId === req.id ? (
                <div className="space-y-2">
                  <Textarea placeholder="Internal admin notes..." value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} className="bg-black/40 border-gray-600/50 text-sm" rows={2} />
                  <div className="flex gap-2">
                    <Button onClick={() => handleNotesUpdate(req.id)} disabled={updateRequest.isPending} size="sm" variant="outline" className="text-xs">Save Notes</Button>
                    <Button onClick={() => { setNotesEditId(null); setAdminNotes(""); }} variant="ghost" size="sm" className="text-xs">Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {req.admin_notes && <p className="text-xs text-gray-500 flex-1 italic">{req.admin_notes}</p>}
                  <Button onClick={() => { setNotesEditId(req.id); setAdminNotes(req.admin_notes || ""); }} variant="ghost" size="sm" className="text-xs text-gray-500 hover:text-gray-300">
                    {req.admin_notes ? "Edit Notes" : "Add Notes"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ChamoyRequestsAdmin;
