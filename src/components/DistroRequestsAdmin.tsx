import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Compass, Calendar, CheckCircle, Loader2, ExternalLink, Music } from "lucide-react";

type DistroRow = {
  id: string;
  song_request_id: string;
  user_id: string;
  user_email: string;
  status: string;
  google_meet_link: string;
  client_selected_time: string | null;
  support_notes: string | null;
  scheduled_at: string | null;
  completed_at: string | null;
  created_at: string;
  song_requests: {
    tier: string;
    song_idea: string;
    status: string;
    genre_category: string | null;
  } | null;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-700 border-yellow-500/40",
  scheduled: "bg-blue-500/20 text-blue-700 border-blue-500/40",
  completed: "bg-green-500/20 text-green-700 border-green-500/40",
  declined: "bg-red-500/20 text-red-700 border-red-500/40",
};

export const DistroRequestsAdmin = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");

  const { data: rows, isLoading } = useQuery({
    queryKey: ["distroRequests"],
    queryFn: async () => {
      const { data: distros, error } = await supabase
        .from("distro_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const ids = Array.from(new Set((distros || []).map((d) => d.song_request_id).filter(Boolean)));
      let songMap = new Map<string, DistroRow["song_requests"]>();
      if (ids.length) {
        const { data: songs } = await supabase
          .from("song_requests")
          .select("id, tier, song_idea, status, genre_category")
          .in("id", ids);
        (songs || []).forEach((s: any) => songMap.set(s.id, s));
      }
      return (distros || []).map((d: any) => ({
        ...d,
        song_requests: songMap.get(d.song_request_id) || null,
      })) as DistroRow[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<DistroRow> }) => {
      const { error } = await supabase.from("distro_requests").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["distroRequests"] });
      toast({ title: "Updated" });
    },
    onError: (e: Error) =>
      toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading distro requests…
      </div>
    );
  }

  if (!rows?.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No distro consultation requests yet.
        </CardContent>
      </Card>
    );
  }

  // Sort: actionable (song delivered/completed, status pending) first
  const isSongDelivered = (s?: string | null) => s === "delivered" || s === "completed";
  const actionable = rows.filter(
    (r) => r.status === "pending" && isSongDelivered(r.song_requests?.status)
  );
  const waitingOnSong = rows.filter(
    (r) => r.status === "pending" && !isSongDelivered(r.song_requests?.status)
  );
  const scheduled = rows.filter((r) => r.status === "scheduled");
  const done = rows.filter((r) => r.status === "completed" || r.status === "declined");

  const Section = ({ title, items, hint }: { title: string; items: DistroRow[]; hint?: string }) =>
    items.length === 0 ? null : (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Compass className="h-4 w-4" />
            {title} ({items.length})
          </CardTitle>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((req) => (
            <div key={req.id} className="border rounded-lg p-4 space-y-3 bg-card">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={STATUS_COLORS[req.status] || ""}>{req.status}</Badge>
                    {req.song_requests?.tier && (
                      <Badge variant="outline">{req.song_requests.tier}</Badge>
                    )}
                    {req.song_requests?.status && (
                      <Badge variant="secondary">Song: {req.song_requests.status}</Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium">{req.user_email}</p>
                  {req.song_requests?.song_idea && (
                    <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <Music className="h-3 w-3 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{req.song_requests.song_idea}</span>
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Requested {new Date(req.created_at).toLocaleString()}
                  </p>
                  {req.client_selected_time && (
                    <p className="text-xs text-blue-600 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Client booked for {new Date(req.client_selected_time).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              {req.status === "pending" && isSongDelivered(req.song_requests?.status) && (
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    onClick={() =>
                      updateMutation.mutate({
                        id: req.id,
                        patch: { status: "scheduled", scheduled_at: new Date().toISOString() },
                      })
                    }
                  >
                    <Calendar className="h-3 w-3" />
                    Accept & send booking link
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateMutation.mutate({ id: req.id, patch: { status: "declined" } })}
                  >
                    Decline
                  </Button>
                </div>
              )}

              {req.status === "scheduled" && (
                <div className="space-y-2">
                  <a
                    href={req.google_meet_link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary underline"
                  >
                    <ExternalLink className="h-3 w-3" /> Open Google Calendar booking link
                  </a>
                  <div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateMutation.mutate({
                          id: req.id,
                          patch: { status: "completed", completed_at: new Date().toISOString() },
                        })
                      }
                    >
                      <CheckCircle className="h-3 w-3" />
                      Mark complete
                    </Button>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="border-t pt-2">
                {editingNotes === req.id ? (
                  <div className="space-y-2">
                    <Textarea
                      rows={2}
                      placeholder="Internal support notes…"
                      value={notesDraft}
                      onChange={(e) => setNotesDraft(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          updateMutation.mutate({ id: req.id, patch: { support_notes: notesDraft } });
                          setEditingNotes(null);
                        }}
                      >
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingNotes(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {req.support_notes && (
                      <p className="text-xs text-muted-foreground italic flex-1">{req.support_notes}</p>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs"
                      onClick={() => {
                        setEditingNotes(req.id);
                        setNotesDraft(req.support_notes || "");
                      }}
                    >
                      {req.support_notes ? "Edit notes" : "Add notes"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );

  return (
    <div className="space-y-4">
      <Section
        title="Ready to schedule"
        items={actionable}
        hint="Song has been delivered — reach out to schedule the distro consultation."
      />
      <Section
        title="Scheduled"
        items={scheduled}
        hint="Client has been invited to pick a meeting time."
      />
      <Section
        title="Waiting on song delivery"
        items={waitingOnSong}
        hint="Will become actionable once the producer delivers the song."
      />
      <Section title="Archive" items={done} />
    </div>
  );
};
