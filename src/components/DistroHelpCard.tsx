import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Compass, Calendar, ExternalLink, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface Props {
  songRequestId: string;
}

export const DistroHelpCard = ({ songRequestId }: Props) => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [picking, setPicking] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["distroRequest", songRequestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("distro_requests")
        .select("*")
        .eq("song_request_id", songRequestId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const { data: song } = await supabase
        .from("song_requests")
        .select("status")
        .eq("id", songRequestId)
        .maybeSingle();
      return { ...data, song_status: song?.status as string | undefined };
    },
  });

  const confirmTime = useMutation({
    mutationFn: async (iso: string) => {
      if (!data) return;
      const { error } = await supabase
        .from("distro_requests")
        .update({ client_selected_time: iso })
        .eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["distroRequest", songRequestId] });
      toast({ title: "Time saved", description: "We've noted your preferred time." });
      setPicking(false);
    },
    onError: (e: Error) =>
      toast({ title: "Couldn't save", description: e.message, variant: "destructive" }),
  });

  if (isLoading || !data) return null;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Compass className="h-4 w-4 text-primary" />
          Discover Your Distro
          <Badge variant="outline" className="ml-auto capitalize">
            {data.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {data.status === "pending" && !(data.song_status === "delivered" || data.song_status === "completed") && (
          <p className="text-muted-foreground">
            HEA Support will reach out as soon as your song has been delivered to schedule your
            distribution consultation.
          </p>
        )}

        {((data.status === "pending" && (data.song_status === "delivered" || data.song_status === "completed")) || data.status === "scheduled") && (
          <>
            <p className="text-muted-foreground">
              Your song is ready! Pick a time that works for you using our Google Calendar — HEA Support will meet you there.
            </p>
            <Button asChild className="w-full sm:w-auto">
              <a href={data.google_meet_link} target="_blank" rel="noreferrer">
                <Calendar className="h-4 w-4" />
                Pick a time
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>

            {data.client_selected_time ? (
              <p className="text-xs text-primary flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                You picked{" "}
                {new Date(data.client_selected_time).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            ) : picking ? (
              <div className="space-y-2">
                <input
                  type="datetime-local"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  onChange={(e) => {
                    if (e.target.value)
                      confirmTime.mutate(new Date(e.target.value).toISOString());
                  }}
                />
                {confirmTime.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
            ) : (
              <Button variant="link" size="sm" className="px-0" onClick={() => setPicking(true)}>
                Let HEA know what time you picked
              </Button>
            )}
          </>
        )}

        {data.status === "completed" && (
          <p className="text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Consultation completed — thanks for using HEA Support!
          </p>
        )}

        {data.status === "declined" && (
          <p className="text-muted-foreground">
            This consultation request was closed. Contact HEA Support if you'd still like help.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
