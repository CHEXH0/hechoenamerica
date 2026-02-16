import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Link as LinkIcon, 
  Send, 
  CheckCircle,
  AlertCircle,
  FileCheck,
  Video
} from "lucide-react";
import { RevisionChat } from "@/components/RevisionChat";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Revision {
  id: string;
  song_request_id: string;
  revision_number: number;
  status: string;
  requested_at: string | null;
  delivered_at: string | null;
  drive_link: string | null;
  client_notes: string | null;
  wants_meeting: boolean | null;
  meeting_link: string | null;
}

interface RevisionDeliveryFormProps {
  projectId: string;
  numberOfRevisions: number;
  customerEmail: string;
  onRevisionDelivered?: () => void;
}

export const RevisionDeliveryForm = ({
  projectId,
  numberOfRevisions,
  customerEmail,
  onRevisionDelivered
}: RevisionDeliveryFormProps) => {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(true);
  const [deliveringRevision, setDeliveringRevision] = useState<string | null>(null);
  const [revisionLinks, setRevisionLinks] = useState<Record<string, string>>({});
  const [meetingLinks, setMeetingLinks] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchRevisions();
  }, [projectId]);

  const fetchRevisions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("song_revisions")
        .select("*")
        .eq("song_request_id", projectId)
        .order("revision_number", { ascending: true });

      if (error) throw error;
      setRevisions(data || []);
    } catch (error) {
      console.error("Error fetching revisions:", error);
    } finally {
      setLoading(false);
    }
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleDeliverRevision = async (revisionId: string, revisionNumber: number) => {
    const link = revisionLinks[revisionId];
    
    if (!link?.trim()) {
      toast({
        title: "Missing Link",
        description: "Please enter a download link for this revision.",
        variant: "destructive",
      });
      return;
    }

    if (!isValidUrl(link.trim())) {
      toast({
        title: "Invalid Link",
        description: "Please enter a valid URL.",
        variant: "destructive",
      });
      return;
    }

    setDeliveringRevision(revisionId);
    try {
      // Get the song request ID from the revision
      const revision = revisions.find(r => r.id === revisionId);
      if (!revision) throw new Error("Revision not found");

      const meetLink = meetingLinks[revisionId]?.trim() || null;

      const { error } = await supabase
        .from("song_revisions")
        .update({
          status: "delivered",
          delivered_at: new Date().toISOString(),
          drive_link: link.trim(),
          meeting_link: meetLink,
        })
        .eq("id", revisionId);

      if (error) throw error;

      // Send notification email to customer about revision delivery
      try {
        await supabase.functions.invoke('send-revision-notification', {
          body: {
            requestId: projectId,
            revisionNumber,
            notificationType: 'revision_delivered',
            driveLink: link.trim()
          }
        });
      } catch (notifyError) {
        console.error("Failed to send notification:", notifyError);
      }

      toast({
        title: "Revision Delivered! 🎉",
        description: `Revision ${revisionNumber} has been sent to ${customerEmail}`,
      });

      fetchRevisions();
      onRevisionDelivered?.();
    } catch (error) {
      console.error("Error delivering revision:", error);
      toast({
        title: "Error",
        description: "Failed to deliver revision. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeliveringRevision(null);
    }
  };

  const allRevisionsDelivered = revisions.length > 0 && 
    revisions.every(r => r.status === "delivered");

  // Show both pending and requested revisions - producers can deliver proactively
  const deliverableRevisions = revisions.filter(r => r.status === "pending" || r.status === "requested");
  const deliveredCount = revisions.filter(r => r.status === "delivered").length;

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-4 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading revisions...
      </div>
    );
  }

  if (revisions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
      <div className="flex items-center justify-between">
        <h4 className="font-medium flex items-center gap-2">
          <FileCheck className="h-4 w-4" />
          Revision Deliveries
        </h4>
        <Badge variant="secondary">
          {deliveredCount}/{numberOfRevisions} Delivered
        </Badge>
      </div>

      {allRevisionsDelivered ? (
        <div className="flex flex-col items-center gap-2 py-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">All Revisions Complete!</span>
          </div>
          <p className="text-sm text-muted-foreground">
            You can now send the final project
          </p>
        </div>
      ) : deliverableRevisions.length === 0 ? (
        <div className="flex items-center gap-2 text-muted-foreground py-4">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">No revisions available to deliver</span>
        </div>
      ) : (
        <div className="space-y-4">
          {deliverableRevisions.map((revision) => (
            <Card key={revision.id} className={`p-4 ${revision.status === "requested" ? "border-yellow-500/30 bg-yellow-500/5" : "border-border"}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-medium">Revision {revision.revision_number}</span>
                  <Badge className={`ml-2 text-xs ${revision.status === "requested" ? "bg-yellow-500 text-white" : "bg-muted text-muted-foreground"}`}>
                    {revision.status === "requested" ? "Requested" : "Available"}
                  </Badge>
                </div>
                {revision.requested_at && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(revision.requested_at).toLocaleDateString()}
                  </span>
                )}
              </div>

              {revision.client_notes && (
                <div className="mb-3 p-2 bg-muted/50 rounded text-sm">
                  <span className="text-muted-foreground">Client notes: </span>
                  {revision.client_notes}
                </div>
              )}

              {revision.wants_meeting && (
                <div className="mb-3 p-2 bg-primary/5 border border-primary/20 rounded flex items-center gap-2 text-sm">
                  <Video className="h-4 w-4 text-primary" />
                  <span className="font-medium">Client requested a Google Meet</span>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm">Download Link</Label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="url"
                    placeholder="https://drive.google.com/..."
                    value={revisionLinks[revision.id] || ""}
                    onChange={(e) => setRevisionLinks(prev => ({
                      ...prev,
                      [revision.id]: e.target.value
                    }))}
                    className="pl-10"
                    disabled={deliveringRevision === revision.id}
                  />
                </div>
              </div>

              {revision.wants_meeting && (
                <div className="space-y-2 mt-2">
                  <Label className="text-sm flex items-center gap-1">
                    <Video className="h-3 w-3" />
                    Google Meet Link (optional)
                  </Label>
                  <Input
                    type="url"
                    placeholder="https://meet.google.com/..."
                    value={meetingLinks[revision.id] || ""}
                    onChange={(e) => setMeetingLinks(prev => ({
                      ...prev,
                      [revision.id]: e.target.value
                    }))}
                    disabled={deliveringRevision === revision.id}
                  />
                </div>
              )}

              <Button
                className="w-full mt-3"
                size="sm"
                onClick={() => handleDeliverRevision(revision.id, revision.revision_number)}
                disabled={deliveringRevision === revision.id || !revisionLinks[revision.id]?.trim()}
              >
                {deliveringRevision === revision.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Deliver Revision {revision.revision_number}
                  </>
                )}
              </Button>

              {/* Chat with client */}
              <RevisionChat revisionId={revision.id} isProducerView={true} />
            </Card>
          ))}
        </div>
      )}

      {/* Show delivered revisions */}
      {deliveredCount > 0 && (
        <div className="pt-3 border-t border-border">
          <h5 className="text-sm font-medium mb-2 text-muted-foreground">Delivered Revisions</h5>
          <div className="flex flex-wrap gap-2">
            {revisions
              .filter(r => r.status === "delivered")
              .map((revision) => (
                <Badge 
                  key={revision.id}
                  variant="outline"
                  className="border-emerald-500 text-emerald-600"
                >
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Rev {revision.revision_number}
                </Badge>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
