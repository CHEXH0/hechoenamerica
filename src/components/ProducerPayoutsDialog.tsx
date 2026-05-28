import { useEffect, useState } from "react";
import { Wallet, RefreshCw, DollarSign, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useProducerProfile } from "@/hooks/useProducerProfile";
import { StripeConnectOnboarding } from "@/components/StripeConnectOnboarding";

interface PayoutProject {
  id: string;
  tier: string;
  price: string;
  status: string;
  user_email: string;
  updated_at: string;
  producer_paid_at: string | null;
  producer_payout_cents: number | null;
  payment_intent_id: string | null;
  payout_method: string | null;
  stripe_transfer_id: string | null;
}

export const ProducerPayoutsDialog = () => {
  const { toast } = useToast();
  const { data: producer } = useProducerProfile();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<PayoutProject[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  const [connectStatus, setConnectStatus] = useState<{
    onboarded: boolean;
    payoutsEnabled: boolean;
  } | null>(null);

  const fetchProjects = async () => {
    if (!producer?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("song_requests")
        .select("id, tier, price, status, user_email, updated_at, producer_paid_at, producer_payout_cents, payment_intent_id, payout_method, stripe_transfer_id")
        .eq("assigned_producer_id", producer.id)
        .eq("status", "completed")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      setProjects((data || []) as PayoutProject[]);
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Could not load your payouts.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchConnectStatus = async () => {
    if (!producer?.id) return;
    try {
      const { data } = await supabase.functions.invoke("stripe-connect-status", {
        body: { producerId: producer.id },
      });
      if (data) setConnectStatus({ onboarded: !!data.onboarded, payoutsEnabled: !!data.payoutsEnabled });
    } catch (e) {
      console.error("Connect status error", e);
    }
  };

  useEffect(() => {
    if (open && producer?.id) {
      fetchProjects();
      fetchConnectStatus();
    }
  }, [open, producer?.id]);

  const handlePayout = async (requestId: string) => {
    setProcessing(requestId);
    try {
      const { data, error } = await supabase.functions.invoke("process-producer-payout", {
        body: { requestId },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({
        title: "Payout sent",
        description: `Transferred $${((data.payout.producerPayoutCents) / 100).toFixed(2)} to your Stripe account.`,
      });
      fetchProjects();
    } catch (e) {
      console.error(e);
      toast({
        title: "Payout failed",
        description: e instanceof Error ? e.message : "Could not process payout.",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  if (!producer) return null;

  const pending = projects.filter(p => !p.producer_paid_at && p.payment_intent_id);
  const paid = projects.filter(p => p.producer_paid_at);
  const canPayout = connectStatus?.onboarded && connectStatus?.payoutsEnabled;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Wallet className="h-4 w-4" />
          Bank / Payouts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Bank & Payouts
          </DialogTitle>
          <DialogDescription>
            Connect your bank via Stripe and cash out completed projects.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <StripeConnectOnboarding producerId={producer.id} />

          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Eligible payouts ({pending.length})
                </h3>
                <Button variant="ghost" size="sm" onClick={fetchProjects} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </div>

              {!canPayout && (
                <p className="text-sm text-muted-foreground">
                  Complete your Stripe Connect setup above before you can request payouts.
                </p>
              )}

              {pending.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No completed projects awaiting payout.</p>
              ) : (
                <ScrollArea className="max-h-64">
                  <div className="space-y-2">
                    {pending.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{p.tier} • {p.price}</p>
                          <p className="text-xs text-muted-foreground truncate">{p.user_email}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handlePayout(p.id)}
                          disabled={!canPayout || processing === p.id}
                        >
                          {processing === p.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            "Pay Out"
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {paid.length > 0 && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Recent payouts
                  </h4>
                  <div className="space-y-2">
                    {paid.slice(0, 5).map(p => (
                      <div key={p.id} className="flex items-center justify-between text-sm">
                        <div className="min-w-0">
                          <p className="truncate">{p.tier}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {p.stripe_transfer_id ? `Transfer: ${p.stripe_transfer_id}` : (p.payout_method || "paid")}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          ${((p.producer_payout_cents || 0) / 100).toFixed(2)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
