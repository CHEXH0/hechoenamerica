import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { 
  CheckCircle, 
  Clock, 
  Loader2, 
  Send, 
  ExternalLink,
  FileCheck,
  AlertCircle,
  MessageSquare,
  Video,
  Link as LinkIcon
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
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
  client_feedback: string | null;
  wants_meeting: boolean | null;
  meeting_link: string | null;
}

interface RevisionTrackerProps {
  projectId: string;
  numberOfRevisions: number;
  projectStatus: string;
  isProducerView?: boolean;
  onRevisionUpdate?: () => void;
}

const revisionStatusColors: Record<string, string> = {
  pending: "bg-gray-500",
  requested: "bg-yellow-500",
  in_progress: "bg-blue-500",
  delivered: "bg-emerald-500",
};

const revisionStatusLabels: Record<string, string> = {
  pending: "Awaiting Request",
  requested: "Requested",
  in_progress: "In Progress",
  delivered: "Delivered",
};

export const RevisionTracker = ({
  projectId,
  numberOfRevisions,
  projectStatus,
  isProducerView = false,
  onRevisionUpdate
}: RevisionTrackerProps) => {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingRevision, setRequestingRevision] = useState<number | null>(null);
  const [revisionNotes, setRevisionNotes] = useState<Record<number, string>>({});
  const [wantsMeeting, setWantsMeeting] = useState<Record<number, boolean>>({});
  const [feedbackText, setFeedbackText] = useState<Record<string, string>>({});
  const [submittingFeedback, setSubmittingFeedback] = useState<string | null>(null);
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

  const handleRequestRevision = async (revisionNumber: number) => {
    setRequestingRevision(revisionNumber);
    try {
      const revision = revisions.find(r => r.revision_number === revisionNumber);
      if (!revision) return;

      const clientNotes = revisionNotes[revisionNumber] || null;

      const { error } = await supabase
        .from("song_revisions")
        .update({
          status: "requested",
          requested_at: new Date().toISOString(),
          client_notes: clientNotes,
          wants_meeting: wantsMeeting[revisionNumber] || false,
        })
        .eq("id", revision.id);

      if (error) throw error;

      // Send notification email to producer
      try {
        await supabase.functions.invoke('send-revision-notification', {
          body: {
            requestId: projectId,
            revisionNumber,
            notificationType: 'revision_requested',
            clientNotes
          }
        });
      } catch (notifyError) {
        console.error("Failed to send notification:", notifyError);
      }

      toast({
        title: "Revision Requested",
        description: `Revision ${revisionNumber} has been requested. Your producer will be notified.`,
      });

      fetchRevisions();
      onRevisionUpdate?.();
    } catch (error) {
      console.error("Error requesting revision:", error);
      toast({
        title: "Error",
        description: "Failed to request revision. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRequestingRevision(null);
    }
  };

  const handleSubmitFeedback = async (revisionId: string, revisionNumber: number) => {
    const feedback = feedbackText[revisionId];
    if (!feedback?.trim()) {
      toast({
        title: "Missing Feedback",
        description: "Please enter your feedback before submitting.",
        variant: "destructive",
      });
      return;
    }

    setSubmittingFeedback(revisionId);
    try {
      const { error } = await supabase
        .from("song_revisions")
        .update({ client_feedback: feedback.trim() })
        .eq("id", revisionId);

      if (error) throw error;

      // Send notification email to producer
      try {
        await supabase.functions.invoke('send-revision-notification', {
          body: {
            requestId: projectId,
            revisionNumber,
            notificationType: 'feedback_submitted',
            feedback: feedback.trim()
          }
        });
      } catch (notifyError) {
        console.error("Failed to send notification:", notifyError);
      }

      toast({
        title: "Feedback Submitted",
        description: "Your feedback has been sent to the producer.",
      });

      setFeedbackText(prev => ({ ...prev, [revisionId]: "" }));
      fetchRevisions();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingFeedback(null);
    }
  };

  const allRevisionsDelivered = revisions.length > 0 && 
    revisions.every(r => r.status === "delivered");

  const nextAvailableRevision = revisions.find(r => r.status === "pending");
  const pendingRequest = revisions.find(r => r.status === "requested" || r.status === "in_progress");

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-4 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading revisions...
      </div>
    );
  }

  if (revisions.length === 0 && numberOfRevisions > 0) {
    return (
      <div className="p-4 bg-muted/30 rounded-lg border border-border">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span className="text-sm">
            {numberOfRevisions} revisions will be available once your producer starts working
          </span>
        </div>
      </div>
    );
  }

  if (revisions.length === 0) {
    return null;
  }

  // Client view
  if (!isProducerView) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Revisions ({revisions.filter(r => r.status === "delivered").length}/{numberOfRevisions})
          </h4>
          {allRevisionsDelivered && (
            <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-600">
              All Revisions Complete
            </Badge>
          )}
        </div>

        <div className="grid gap-3">
          {revisions.map((revision) => (
            <Card key={revision.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Revision {revision.revision_number}</span>
                  <Badge className={`${revisionStatusColors[revision.status]} text-white text-xs`}>
                    {revisionStatusLabels[revision.status]}
                  </Badge>
                </div>
                {revision.drive_link && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(revision.drive_link!, "_blank")}
                  >
                    <ExternalLink className="mr-2 h-3 w-3" />
                    Download
                  </Button>
                )}
              </div>

              {revision.status === "pending" && (
                <div className="space-y-3">
                  {!pendingRequest && nextAvailableRevision?.id === revision.id ? (
                    <>
                      <div className="space-y-2">
                        <Label className="text-sm">Notes for Producer (optional)</Label>
                        <Textarea
                          placeholder="Describe what changes you'd like..."
                          value={revisionNotes[revision.revision_number] || ""}
                          onChange={(e) => setRevisionNotes(prev => ({
                            ...prev,
                            [revision.revision_number]: e.target.value
                          }))}
                          rows={2}
                          maxLength={500}
                        />
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                        <Video className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <Label className="text-sm">Request Google Meet</Label>
                          <p className="text-xs text-muted-foreground">Ask your producer for a video call</p>
                        </div>
                        <Switch
                          checked={wantsMeeting[revision.revision_number] || false}
                          onCheckedChange={(checked) => setWantsMeeting(prev => ({
                            ...prev,
                            [revision.revision_number]: checked
                          }))}
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleRequestRevision(revision.revision_number)}
                        disabled={requestingRevision === revision.revision_number}
                      >
                        {requestingRevision === revision.revision_number ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="mr-2 h-4 w-4" />
                        )}
                        Request Revision
                      </Button>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {pendingRequest 
                        ? "Complete or receive your current revision request first"
                        : "Not yet available"}
                    </p>
                  )}
                </div>
              )}

              {revision.status === "requested" && (
                <div className="space-y-2">
                  <p className="text-sm text-yellow-600 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Waiting for producer...
                  </p>
                  {revision.client_notes && (
                    <p className="text-xs text-muted-foreground">
                      Notes: "{revision.client_notes}"
                    </p>
                  )}
                  {revision.wants_meeting && (
                    <div className="flex items-center gap-2 text-xs p-2 bg-muted/30 rounded">
                      <Video className="h-3 w-3 text-primary" />
                      <span>Google Meet requested</span>
                      {revision.meeting_link ? (
                        <a href={revision.meeting_link} target="_blank" rel="noopener noreferrer" className="text-primary underline ml-auto">
                          Join Meeting
                        </a>
                      ) : (
                        <span className="text-muted-foreground ml-auto">Pending link from producer</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {revision.status === "in_progress" && (
                <p className="text-sm text-blue-600 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Producer is working on this revision
                </p>
              )}

              {revision.status === "delivered" && (
                <div className="space-y-3">
                  <p className="text-sm text-emerald-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Delivered {revision.delivered_at && new Date(revision.delivered_at).toLocaleDateString()}
                  </p>

                  {revision.meeting_link && (
                    <div className="flex items-center gap-2 text-xs p-2 bg-muted/30 rounded">
                      <Video className="h-3 w-3 text-primary" />
                      <a href={revision.meeting_link} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                        Google Meet Link
                      </a>
                    </div>
                  )}

                  {/* Feedback Section */}
                  {revision.client_feedback ? (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 text-blue-600 text-sm font-medium mb-1">
                        <MessageSquare className="h-3 w-3" />
                        Your Feedback
                      </div>
                      <p className="text-sm text-muted-foreground">{revision.client_feedback}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label className="text-sm flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        Share Feedback (optional)
                      </Label>
                      <Textarea
                        placeholder="Let your producer know what you think..."
                        value={feedbackText[revision.id] || ""}
                        onChange={(e) => setFeedbackText(prev => ({
                          ...prev,
                          [revision.id]: e.target.value
                        }))}
                        rows={2}
                        maxLength={500}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSubmitFeedback(revision.id, revision.revision_number)}
                        disabled={submittingFeedback === revision.id || !feedbackText[revision.id]?.trim()}
                      >
                        {submittingFeedback === revision.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="mr-2 h-4 w-4" />
                        )}
                        Submit Feedback
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Chat - visible on non-pending revisions */}
              {revision.status !== "pending" && (
                <RevisionChat revisionId={revision.id} isProducerView={false} />
              )}
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Producer view - show status only, delivery is handled separately
  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm flex items-center gap-2">
        <FileCheck className="h-4 w-4" />
        Revision Status ({revisions.filter(r => r.status === "delivered").length}/{numberOfRevisions})
      </h4>
      <div className="flex flex-wrap gap-2">
        {revisions.map((revision) => (
          <Badge 
            key={revision.id}
            variant="outline"
            className={`${revision.status === "delivered" ? "border-emerald-500 text-emerald-600" : 
              revision.status === "requested" ? "border-yellow-500 text-yellow-600 animate-pulse" :
              revision.status === "in_progress" ? "border-blue-500 text-blue-600" :
              "border-muted-foreground"}`}
          >
            Rev {revision.revision_number}: {revisionStatusLabels[revision.status]}
          </Badge>
        ))}
      </div>
      {/* Show client feedback for producer */}
      {revisions.some(r => r.client_feedback) && (
        <div className="space-y-2 pt-2 border-t border-border">
          <h5 className="text-xs font-medium text-muted-foreground">Client Feedback</h5>
          {revisions.filter(r => r.client_feedback).map(revision => (
            <div key={revision.id} className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded text-sm">
              <span className="font-medium text-blue-600">Rev {revision.revision_number}:</span>{" "}
              <span className="text-muted-foreground">{revision.client_feedback}</span>
            </div>
          ))}
        </div>
      )}
      {!allRevisionsDelivered && (
        <p className="text-xs text-muted-foreground">
          Complete all revisions before sending the final project
        </p>
      )}
    </div>
  );
};
