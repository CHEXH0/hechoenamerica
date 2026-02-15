import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ChecklistItem {
  key: string;
  label: string;
  description: string;
}

interface ProducerChecklistProps {
  projectId: string;
  wantsRecordedStems: boolean;
  wantsAnalog: boolean;
  wantsMixing: boolean;
  wantsMastering: boolean;
  numberOfRevisions: number;
  currentChecklist: Record<string, boolean>;
  onChecklistUpdate?: () => void;
  readOnly?: boolean;
}

export const ProducerChecklist = ({
  projectId,
  wantsRecordedStems,
  wantsAnalog,
  wantsMixing,
  wantsMastering,
  numberOfRevisions,
  currentChecklist,
  onChecklistUpdate,
  readOnly = false,
}: ProducerChecklistProps) => {
  const [checklist, setChecklist] = useState<Record<string, boolean>>(currentChecklist || {});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setChecklist(currentChecklist || {});
  }, [currentChecklist]);

  // Build checklist items based on what the client requested
  const items: ChecklistItem[] = [
    {
      key: "base_production",
      label: "Base Production",
      description: "Core song production (arrangement, sound design, composition)",
    },
  ];

  if (wantsRecordedStems) {
    items.push({
      key: "stems",
      label: "Recorded Stems",
      description: "Individual instrument/vocal tracks exported",
    });
  }

  if (wantsAnalog) {
    items.push({
      key: "analog",
      label: "Analog Processing",
      description: "Processed through analog hardware (compressors, EQs, tape)",
    });
  }

  if (wantsMixing) {
    items.push({
      key: "mixing",
      label: "Professional Mixing",
      description: "Levels, EQ, compression, effects, spatial positioning",
    });
  }

  if (wantsMastering) {
    items.push({
      key: "mastering",
      label: "Mastering",
      description: "Final loudness, clarity, and playback optimization",
    });
  }

  const completedCount = items.filter((item) => checklist[item.key]).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleToggle = async (key: string, checked: boolean) => {
    const updated = { ...checklist, [key]: checked };
    setChecklist(updated);
    setSaving(true);

    try {
      const { error } = await supabase
        .from("song_requests")
        .update({ producer_checklist: updated })
        .eq("id", projectId);

      if (error) throw error;
      onChecklistUpdate?.();
    } catch (error) {
      console.error("Error updating checklist:", error);
      // Revert on error
      setChecklist(checklist);
      toast({
        title: "Error",
        description: "Failed to update checklist",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (items.length <= 1 && !wantsRecordedStems && !wantsAnalog && !wantsMixing && !wantsMastering) {
    // Only base production, no add-ons — still show it
  }

  return (
    <Card className="p-4 space-y-3 border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Production Checklist</span>
        </div>
        <div className="flex items-center gap-2">
          {saving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          <Badge
            variant="secondary"
            className={
              progressPercent === 100
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                : ""
            }
          >
            {completedCount}/{totalCount} Done
          </Badge>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.key}
            className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${
              checklist[item.key] ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-muted/30"
            }`}
          >
            <Checkbox
              id={`check-${projectId}-${item.key}`}
              checked={!!checklist[item.key]}
              onCheckedChange={(checked) => handleToggle(item.key, !!checked)}
              disabled={readOnly || saving}
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <Label
                htmlFor={`check-${projectId}-${item.key}`}
                className={`text-sm font-medium cursor-pointer ${
                  checklist[item.key] ? "line-through text-muted-foreground" : ""
                }`}
              >
                {item.label}
              </Label>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
