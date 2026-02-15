import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, XCircle, DollarSign, User, Music, Calendar, Loader2, RefreshCw, UserMinus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

interface CancellationRequest {
  id: string;
  song_idea: string;
  tier: string;
  price: string;
  status: string;
  genre_category: string | null;
  created_at: string;
  updated_at: string;
  user_email: string;
  assigned_producer_id: string | null;
  payment_intent_id: string | null;
  number_of_revisions: number | null;
  producer?: {
    id: string;
    name: string;
    email: string | null;
  } | null;
  revisions?: {
    id: string;
    revision_number: number;
    status: string;
    delivered_at: string | null;
  }[];
}

export const CancellationRequestsAdmin = () => {
  const [requests, setRequests] = useState<CancellationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [changingProducerId, setChangingProducerId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<CancellationRequest | null>(null);
  const [refundPercentage, setRefundPercentage] = useState<string>("100");
  const [adminNotes, setAdminNotes] = useState("");
  const [changeReason, setChangeReason] = useState("");
  const [producerPayoutPercent, setProducerPayoutPercent] = useState<string>("0");
  const [changeFee, setChangeFee] = useState<string>("25");
  const { toast } = useToast();

  useEffect(() => {
    fetchCancellationRequests();
  }, []);

  const fetchCancellationRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("song_requests")
        .select(`
          *,
          producer:assigned_producer_id(id, name, email)
        `)
        .eq("status", "cancellation_requested")
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const requestsWithRevisions = await Promise.all(
        (data || []).map(async (request) => {
          const { data: revisions } = await supabase
            .from("song_revisions")
            .select("id, revision_number, status, delivered_at")
            .eq("song_request_id", request.id)
            .order("revision_number", { ascending: true });

          return { ...request, revisions: revisions || [] };
        })
      );

      setRequests(requestsWithRevisions);
    } catch (error) {
      console.error("Error fetching cancellation requests:", error);
      toast({ title: "Error", description: "Failed to fetch cancellation requests", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const calculateRecommendedRefund = (request: CancellationRequest): number => {
    if (!request.assigned_producer_id) return 100;
    const deliveredRevisions = request.revisions?.filter(r => r.status === 'delivered').length || 0;
    const totalRevisions = request.number_of_revisions || 0;
    if (deliveredRevisions === 0) return 100;
    if (totalRevisions > 0 && deliveredRevisions >= totalRevisions) return 0;
    if (totalRevisions > 0) {
      const progressPercentage = (deliveredRevisions / totalRevisions) * 100;
      return Math.max(0, Math.round(100 - progressPercentage));
    }
    return 50;
  };

  const getProgressBadge = (request: CancellationRequest) => {
    const deliveredRevisions = request.revisions?.filter(r => r.status === 'delivered').length || 0;
    const totalRevisions = request.number_of_revisions || 0;

    if (!request.assigned_producer_id) {
      return <Badge variant="secondary">No Producer Assigned</Badge>;
    }
    if (deliveredRevisions === 0) {
      return <Badge className="bg-green-500">Not Started</Badge>;
    }
    if (totalRevisions > 0 && deliveredRevisions >= totalRevisions) {
      return <Badge variant="destructive">Almost Complete</Badge>;
    }
    return (
      <Badge className="bg-amber-500">
        {deliveredRevisions}/{totalRevisions} Revisions Delivered
      </Badge>
    );
  };

  const handleProcessRequest = async (action: "approve" | "deny") => {
    if (!selectedRequest) return;

    setProcessingId(selectedRequest.id);
    try {
      const { data, error } = await supabase.functions.invoke("process-cancellation-request", {
        body: {
          requestId: selectedRequest.id,
          action,
          refundPercentage: action === "approve" ? parseInt(refundPercentage) : 0,
          adminNotes,
        },
      });

      if (error) throw error;

      toast({
        title: action === "approve" ? "Cancellation Approved" : "Cancellation Denied",
        description: data.message,
      });

      setSelectedRequest(null);
      setRefundPercentage("100");
      setAdminNotes("");
      fetchCancellationRequests();
    } catch (error) {
      console.error("Error processing cancellation:", error);
      toast({ title: "Error", description: `Failed to ${action} cancellation request`, variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  const handleChangeProducer = async (request: CancellationRequest) => {
    setChangingProducerId(request.id);
    try {
      const { data, error } = await supabase.functions.invoke("change-producer", {
        body: {
          requestId: request.id,
          reason: changeReason || "Admin initiated producer change",
          producerPayoutPercentage: parseInt(producerPayoutPercent),
          changeFee: parseInt(changeFee),
        },
      });

      if (error) throw error;

      toast({
        title: "Producer Changed",
        description: data.message,
      });

      setChangeReason("");
      setProducerPayoutPercent("0");
      setChangeFee("25");
      fetchCancellationRequests();
    } catch (error) {
      console.error("Error changing producer:", error);
      toast({ title: "Error", description: "Failed to change producer", variant: "destructive" });
    } finally {
      setChangingProducerId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Cancellation Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Cancellation Requests
              {requests.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {requests.length} Pending
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Review cancellation requests — approve, deny, or change the producer instead
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchCancellationRequests}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <p>No pending cancellation requests</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Producer</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Recommended</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => {
                const recommendedRefund = calculateRecommendedRefund(request);
                return (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{request.user_email}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(request.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{request.tier}</span>
                        <span className="text-xs text-muted-foreground">
                          {request.genre_category || "No genre"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {request.producer ? (
                        <span>{request.producer.name}</span>
                      ) : (
                        <span className="text-muted-foreground">Not assigned</span>
                      )}
                    </TableCell>
                    <TableCell>{getProgressBadge(request)}</TableCell>
                    <TableCell className="font-medium">{request.price}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          recommendedRefund === 100
                            ? "bg-green-500"
                            : recommendedRefund >= 50
                            ? "bg-amber-500"
                            : "bg-red-500"
                        }
                      >
                        {recommendedRefund}% Refund
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {/* Review / Approve / Deny Dialog */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setRefundPercentage(recommendedRefund.toString());
                              }}
                            >
                              Review
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="max-w-lg">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Review Cancellation Request</AlertDialogTitle>
                              <AlertDialogDescription>
                                Decide whether to approve or deny this cancellation request.
                              </AlertDialogDescription>
                            </AlertDialogHeader>

                            <div className="space-y-4 py-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <Label className="text-muted-foreground">Client</Label>
                                  <p className="font-medium">{request.user_email}</p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">Project</Label>
                                  <p className="font-medium">{request.tier}</p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">Producer</Label>
                                  <p className="font-medium">{request.producer?.name || "Not assigned"}</p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">Price</Label>
                                  <p className="font-medium">{request.price}</p>
                                </div>
                              </div>

                              <div className="bg-muted/50 p-3 rounded-lg">
                                <Label className="text-muted-foreground">Progress Status</Label>
                                <div className="mt-1">{getProgressBadge(request)}</div>
                                {request.revisions && request.revisions.length > 0 && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    {request.revisions.filter(r => r.status === 'delivered').length} of{" "}
                                    {request.number_of_revisions || 0} revisions delivered
                                  </p>
                                )}
                              </div>

                              <div>
                                <Label className="text-muted-foreground">Song Idea</Label>
                                <p className="text-sm mt-1 line-clamp-3">{request.song_idea}</p>
                              </div>

                              <div>
                                <Label>Refund Percentage</Label>
                                <Select value={refundPercentage} onValueChange={setRefundPercentage}>
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="100">100% - Full Refund</SelectItem>
                                    <SelectItem value="75">75% - Minor Progress</SelectItem>
                                    <SelectItem value="50">50% - Significant Work Done</SelectItem>
                                    <SelectItem value="25">25% - Mostly Complete</SelectItem>
                                    <SelectItem value="0">0% - No Refund</SelectItem>
                                  </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Recommended: {recommendedRefund}% based on producer progress
                                </p>
                              </div>

                              <div>
                                <Label>Admin Notes (sent to client)</Label>
                                <Textarea
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  placeholder="Optional: Explain the decision..."
                                  className="mt-1"
                                  rows={3}
                                />
                              </div>
                            </div>

                            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                              <AlertDialogCancel onClick={() => setSelectedRequest(null)}>
                                Cancel
                              </AlertDialogCancel>
                              <Button
                                variant="outline"
                                onClick={() => handleProcessRequest("deny")}
                                disabled={processingId === request.id}
                                className="border-amber-500 text-amber-600 hover:bg-amber-50"
                              >
                                {processingId === request.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <XCircle className="h-4 w-4 mr-2" />
                                )}
                                Deny Request
                              </Button>
                              <Button
                                onClick={() => handleProcessRequest("approve")}
                                disabled={processingId === request.id}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {processingId === request.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                )}
                                Approve & Refund {refundPercentage}%
                              </Button>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        {/* Change Producer Dialog */}
                        {request.assigned_producer_id && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50">
                                <UserMinus className="h-4 w-4 mr-1" />
                                Change Producer
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Change Producer</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will remove <strong>{request.producer?.name}</strong> from the project, pay them proportionally for work completed ({request.revisions?.filter(r => r.status === 'delivered').length || 0}/{request.number_of_revisions || 0} revisions), block them from re-accepting, and repost to Discord for a new producer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>

                              <div className="space-y-4 py-4">
                                <div className="bg-muted/50 p-3 rounded-lg text-sm">
                                  <p><strong>Current Producer:</strong> {request.producer?.name}</p>
                                  <p><strong>Progress:</strong> {request.revisions?.filter(r => r.status === 'delivered').length || 0} of {request.number_of_revisions || 0} revisions delivered</p>
                                </div>

                                <div>
                                  <Label>Producer Payout Percentage</Label>
                                  <Select value={producerPayoutPercent} onValueChange={setProducerPayoutPercent}>
                                    <SelectTrigger className="mt-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="0">0% - No Payout</SelectItem>
                                      <SelectItem value="25">25% - Minimal Work</SelectItem>
                                      <SelectItem value="50">50% - Half Complete</SelectItem>
                                      <SelectItem value="75">75% - Mostly Complete</SelectItem>
                                      <SelectItem value="100">100% - Full Payout</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Producer receives this % of their 85% share based on work completed
                                  </p>
                                </div>

                                <div>
                                  <Label>Change Fee ($) — Charged to Client</Label>
                                  <Select value={changeFee} onValueChange={setChangeFee}>
                                    <SelectTrigger className="mt-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="0">$0 - No Fee</SelectItem>
                                      <SelectItem value="15">$15</SelectItem>
                                      <SelectItem value="25">$25 (Default)</SelectItem>
                                      <SelectItem value="50">$50</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Flat fee charged to the client for changing producers
                                  </p>
                                </div>

                                <div>
                                  <Label>Reason for Change (sent to producer)</Label>
                                  <Textarea
                                    value={changeReason}
                                    onChange={(e) => setChangeReason(e.target.value)}
                                    placeholder="Optional: Explain why the producer is being changed..."
                                    className="mt-1"
                                    rows={3}
                                  />
                                </div>
                              </div>

                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <Button
                                  onClick={() => handleChangeProducer(request)}
                                  disabled={changingProducerId === request.id}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  {changingProducerId === request.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  ) : (
                                    <UserMinus className="h-4 w-4 mr-2" />
                                  )}
                                  Change Producer & Repost
                                </Button>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
