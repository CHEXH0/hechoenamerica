import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, Loader2, Link as LinkIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DeliveryFormProps {
  projectId: string;
  customerEmail: string;
  onDeliveryComplete: () => void;
}

export const DeliveryForm = ({ projectId, customerEmail, onDeliveryComplete }: DeliveryFormProps) => {
  const [downloadLink, setDownloadLink] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSendDelivery = async () => {
    if (!downloadLink.trim()) {
      toast({
        title: "Missing Link",
        description: "Please paste your Google Drive or cloud storage link.",
        variant: "destructive",
      });
      return;
    }

    if (!isValidUrl(downloadLink.trim())) {
      toast({
        title: "Invalid Link",
        description: "Please enter a valid URL (e.g., https://drive.google.com/...)",
        variant: "destructive",
      });
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
        title: "Delivery Sent! 🎉",
        description: `Email sent to ${customerEmail}`,
      });

      onDeliveryComplete();
    } catch (error: any) {
      console.error("Error sending delivery:", error);
      toast({
        title: "Send Failed",
        description: error.message || "Failed to send delivery email",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
      <div className="space-y-2">
        <Label htmlFor={`link-${projectId}`} className="text-sm font-medium">
          Download Link <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id={`link-${projectId}`}
            type="url"
            placeholder="https://drive.google.com/... or Dropbox link"
            value={downloadLink}
            onChange={(e) => setDownloadLink(e.target.value)}
            className="pl-10"
            disabled={isSending}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Paste your Google Drive, Dropbox, or WeTransfer link
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`message-${projectId}`} className="text-sm font-medium">
          Personal Message <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id={`message-${projectId}`}
          placeholder="Hey! Here's your finished track. I hope you love it! Let me know if you have any questions..."
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          rows={3}
          disabled={isSending}
          maxLength={1000}
        />
        <p className="text-xs text-muted-foreground text-right">
          {customMessage.length}/1000
        </p>
      </div>

      <Button 
        className="w-full" 
        onClick={handleSendDelivery}
        disabled={isSending || !downloadLink.trim()}
      >
        {isSending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending to {customerEmail}...
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Send Delivery Email
          </>
        )}
      </Button>
    </div>
  );
};
