import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, Loader2, Link as LinkIcon, AlertCircle, FileCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RevisionDeliveryForm } from "@/components/RevisionDeliveryForm";
import { useTranslation } from "@/contexts/TranslationContext";

interface DeliveryFormProps {
  projectId: string;
  customerEmail: string;
  numberOfRevisions?: number;
  onDeliveryComplete: () => void;
}

interface Revision {
  id: string;
  status: string;
}

export const DeliveryForm = ({
  projectId,
  customerEmail,
  numberOfRevisions = 0,
  onDeliveryComplete
}: DeliveryFormProps) => {
  const [downloadLink, setDownloadLink] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loadingRevisions, setLoadingRevisions] = useState(true);
  const { toast } = useToast();
  const { t } = useTranslation();
  const tc = t.deliveryForm;

  useEffect(() => {
    if (numberOfRevisions > 0) {
      fetchRevisions();
    } else {
      setLoadingRevisions(false);
    }
  }, [projectId, numberOfRevisions]);

  const fetchRevisions = async () => {
    try {
      const { data, error } = await supabase
        .from("song_revisions")
        .select("id, status")
        .eq("song_request_id", projectId);

      if (error) throw error;
      setRevisions(data || []);
    } catch (error) {
      console.error("Error fetching revisions:", error);
    } finally {
      setLoadingRevisions(false);
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

  const allRevisionsDelivered = numberOfRevisions === 0 ||
    (revisions.length > 0 && revisions.every(r => r.status === "delivered"));

  const handleSendDelivery = async () => {
    if (!downloadLink.trim()) {
      toast({ title: tc.missingLinkTitle, description: tc.missingLinkDesc, variant: "destructive" });
      return;
    }

    if (!isValidUrl(downloadLink.trim())) {
      toast({ title: tc.invalidLinkTitle, description: tc.invalidLinkDesc, variant: "destructive" });
      return;
    }

    if (!allRevisionsDelivered) {
      toast({ title: tc.revisionsIncompleteTitle, description: tc.revisionsIncompleteDesc, variant: "destructive" });
      return;
    }

    setIsSending(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-delivery-email', {
        body: {
          requestId: projectId,
          downloadLink: downloadLink.trim(),
          customMessage: customMessage.trim(),
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: tc.deliverySentTitle,
        description: `${tc.deliverySentDesc} ${customerEmail}`,
      });

      onDeliveryComplete();
    } catch (error: any) {
      console.error("Error sending delivery:", error);
      toast({
        title: tc.sendFailedTitle,
        description: error.message || tc.sendFailedDesc,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  if (loadingRevisions) {
    return (
      <div className="flex items-center gap-2 p-4 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {tc.loading}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {numberOfRevisions > 0 && (
        <RevisionDeliveryForm
          projectId={projectId}
          numberOfRevisions={numberOfRevisions}
          customerEmail={customerEmail}
          onRevisionDelivered={fetchRevisions}
        />
      )}

      <div className={`space-y-4 p-4 rounded-lg border ${
        allRevisionsDelivered
          ? "bg-muted/30 border-border"
          : "bg-muted/10 border-muted opacity-60"
      }`}>
        <div className="flex items-center justify-between">
          <h4 className="font-medium flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            {tc.finalProjectDelivery}
          </h4>
          {!allRevisionsDelivered && numberOfRevisions > 0 && (
            <span className="text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {tc.completeRevisionsFirst}
            </span>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`link-${projectId}`} className="text-sm font-medium">
            {tc.downloadLink} <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id={`link-${projectId}`}
              type="url"
              placeholder={tc.downloadPlaceholder}
              value={downloadLink}
              onChange={(e) => setDownloadLink(e.target.value)}
              className="pl-10"
              disabled={isSending || !allRevisionsDelivered}
            />
          </div>
          <p className="text-xs text-muted-foreground">{tc.downloadHint}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`message-${projectId}`} className="text-sm font-medium">
            {tc.personalMessage} <span className="text-muted-foreground">{tc.optional}</span>
          </Label>
          <Textarea
            id={`message-${projectId}`}
            placeholder={tc.messagePlaceholder}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            rows={3}
            disabled={isSending || !allRevisionsDelivered}
            maxLength={1000}
          />
          <p className="text-xs text-muted-foreground text-right">
            {customMessage.length}/1000
          </p>
        </div>

        <Button
          className="w-full"
          onClick={handleSendDelivery}
          disabled={isSending || !downloadLink.trim() || !allRevisionsDelivered}
        >
          {isSending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {tc.sending} {customerEmail}...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              {tc.sendFinalDelivery}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
