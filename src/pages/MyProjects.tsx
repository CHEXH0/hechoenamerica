import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Music, Download, Clock, CheckCircle, Loader2, FileAudio, Calendar, User, Wifi, AlertTriangle, RefreshCcw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface SongRequest {
  id: string;
  song_idea: string;
  tier: string;
  price: string;
  status: string;
  genre_category: string | null;
  created_at: string;
  updated_at: string;
  assigned_producer_id: string | null;
  number_of_revisions: number | null;
  wants_mixing: boolean | null;
  wants_mastering: boolean | null;
  // Payment tracking
  acceptance_deadline: string | null;
  refunded_at: string | null;
}

interface Purchase {
  id: string;
  product_id: string;
  product_name: string;
  status: string;
  download_url: string | null;
  created_at: string;
}

interface Producer {
  id: string;
  name: string;
  image: string;
}

const statusSteps = ["pending", "accepted", "in_progress", "review", "completed"];
const statusLabels: Record<string, string> = {
  pending: "Pending",
  pending_payment: "Awaiting Payment",
  paid: "Paid",
  accepted: "Accepted",
  in_progress: "In Production",
  review: "Under Review",
  completed: "Completed",
  refunded: "Refunded",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  pending_payment: "bg-orange-500",
  paid: "bg-green-500",
  accepted: "bg-cyan-500",
  in_progress: "bg-blue-500",
  review: "bg-purple-500",
  completed: "bg-emerald-500",
  refunded: "bg-red-500",
};

const getStatusProgress = (status: string): number => {
  const progressMap: Record<string, number> = {
    pending: 10,
    pending_payment: 15,
    paid: 20,
    accepted: 30,
    in_progress: 50,
    review: 75,
    completed: 100,
  };
  return progressMap[status] || 0;
};

const getTimeRemaining = (deadline: string | null): { text: string; isUrgent: boolean } => {
  if (!deadline) return { text: '', isUrgent: false };
  
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffMs = deadlineDate.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return { text: 'Expired', isUrgent: true };
  }
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return { 
    text: `${hours}h ${minutes}m until producer acceptance deadline`, 
    isUrgent: hours < 12 
  };
};

const MyProjects = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<SongRequest[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [producers, setProducers] = useState<Record<string, Producer>>({});
  const [loading, setLoading] = useState(true);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  // Real-time subscription for song_requests updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('my-projects-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'song_requests',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          const updatedProject = payload.new as SongRequest;
          
          setProjects((prev) =>
            prev.map((p) =>
              p.id === updatedProject.id ? { ...p, ...updatedProject } : p
            )
          );

          // Show toast for status changes
          toast({
            title: "Project Updated",
            description: `Your project status changed to: ${statusLabels[updatedProject.status] || updatedProject.status}`,
          });

          // If a producer was assigned, fetch their info
          if (updatedProject.assigned_producer_id && !producers[updatedProject.assigned_producer_id]) {
            supabase
              .from("producers")
              .select("id, name, image")
              .eq("id", updatedProject.assigned_producer_id)
              .single()
              .then(({ data }) => {
                if (data) {
                  setProducers((prev) => ({ ...prev, [data.id]: data }));
                }
              });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'purchases',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Purchase update received:', payload);
          const updatedPurchase = payload.new as Purchase;
          
          setPurchases((prev) =>
            prev.map((p) =>
              p.id === updatedPurchase.id ? { ...p, ...updatedPurchase } : p
            )
          );

          if (updatedPurchase.download_url) {
            toast({
              title: "🎉 Your Song is Ready!",
              description: "Your completed song is now available for download.",
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        setIsRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  const fetchProjects = async () => {
    try {
      setLoading(true);

      // Fetch song requests
      const { data: requestsData, error: requestsError } = await supabase
        .from("song_requests")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (requestsError) throw requestsError;
      setProjects(requestsData || []);

      // Fetch purchases for download URLs
      const { data: purchasesData, error: purchasesError } = await supabase
        .from("purchases")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (purchasesError) throw purchasesError;
      setPurchases(purchasesData || []);

      // Fetch producers for assigned projects
      const producerIds = requestsData
        ?.filter((r) => r.assigned_producer_id)
        .map((r) => r.assigned_producer_id) || [];

      if (producerIds.length > 0) {
        const { data: producersData } = await supabase
          .from("producers")
          .select("id, name, image")
          .in("id", producerIds);

        const producersMap: Record<string, Producer> = {};
        producersData?.forEach((p) => {
          producersMap[p.id] = p;
        });
        setProducers(producersMap);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDownloadUrl = (projectId: string): string | null => {
    const purchase = purchases.find((p) => p.product_id === projectId);
    return purchase?.download_url || null;
  };

  const getGenreLabel = (genre: string | null): string => {
    const genreMap: Record<string, string> = {
      "hip-hop": "Hip Hop / Trap",
      rnb: "R&B / Soul",
      reggae: "Reggae",
      latin: "Latin",
      electronic: "Electronic",
      pop: "Pop",
      rock: "Rock",
      world: "World / Indigenous",
      other: "Other",
    };
    return genre ? genreMap[genre] || genre : "Not specified";
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20 p-4">
        <div className="container mx-auto max-w-4xl">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            onClick={() => navigate("/")}
            variant="ghost"
            className="mb-4 hover:bg-muted/50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
                My Projects
              </h1>
              <p className="text-muted-foreground">
                Track the progress of your song requests
              </p>
            </div>
            {/* Real-time connection indicator */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isRealtimeConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-xs text-muted-foreground">
                {isRealtimeConnected ? 'Live updates' : 'Connecting...'}
              </span>
              <Wifi className={`h-4 w-4 ${isRealtimeConnected ? 'text-green-500' : 'text-muted-foreground'}`} />
            </div>
          </div>
        </motion.div>

        {/* Projects List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {projects.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Projects Yet</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't submitted any song requests yet.
                </p>
                <Button onClick={() => navigate("/generate-song")}>
                  Create Your First Song
                </Button>
              </CardContent>
            </Card>
          ) : (
            projects.map((project, index) => {
              const downloadUrl = getDownloadUrl(project.id);
              const producer = project.assigned_producer_id
                ? producers[project.assigned_producer_id]
                : null;

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Music className="h-5 w-5 text-primary" />
                            {project.tier} Song
                          </CardTitle>
                          <CardDescription className="flex items-center gap-4 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(project.created_at).toLocaleDateString()}
                            </span>
                            <Badge variant="outline">
                              {getGenreLabel(project.genre_category)}
                            </Badge>
                          </CardDescription>
                        </div>
                        <Badge
                          className={`${statusColors[project.status]} text-white`}
                        >
                          {statusLabels[project.status] || project.status}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Progress</span>
                          <span>{getStatusProgress(project.status)}%</span>
                        </div>
                        <Progress value={getStatusProgress(project.status)} className="h-2" />
                      </div>

                      {/* Song Idea */}
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Your Idea:</p>
                        <p className="text-foreground">{project.song_idea}</p>
                      </div>

                      {/* Producer Info */}
                      {producer && (
                        <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
                          <img
                            src={producer.image}
                            alt={producer.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Assigned Producer
                            </p>
                            <p className="font-medium">{producer.name}</p>
                          </div>
                        </div>
                      )}

                      {/* Options */}
                      <div className="flex flex-wrap gap-2">
                        {project.wants_mixing && (
                          <Badge variant="secondary">Mixing</Badge>
                        )}
                        {project.wants_mastering && (
                          <Badge variant="secondary">Mastering</Badge>
                        )}
                        {project.number_of_revisions && project.number_of_revisions > 0 && (
                          <Badge variant="secondary">
                            {project.number_of_revisions} Revisions
                          </Badge>
                        )}
                      </div>

                      {/* Download Button */}
                      {project.status === "completed" && downloadUrl ? (
                        <a
                          href={downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <Button className="w-full" size="lg">
                            <Download className="mr-2 h-5 w-5" />
                            Download Your Song
                          </Button>
                        </a>
                      ) : project.status === "completed" ? (
                        <Button className="w-full" size="lg" disabled>
                          <Clock className="mr-2 h-5 w-5" />
                          Preparing Download...
                        </Button>
                      ) : project.status === "refunded" ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-2">
                          <div className="flex items-center gap-2 text-destructive">
                            <RefreshCcw className="h-4 w-4" />
                            <span className="font-medium">Payment Refunded</span>
                          </div>
                          <p className="text-sm text-muted-foreground text-center">
                            No producer was available within 48 hours. Your payment has been fully refunded.
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate("/generate-song")}
                            className="mt-2"
                          >
                            Try Again
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-center gap-2 text-muted-foreground py-2">
                            {project.status === "in_progress" ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Your producer is working on your song...
                              </>
                            ) : project.status === "review" ? (
                              <>
                                <CheckCircle className="h-4 w-4" />
                                Almost ready! Under final review...
                              </>
                            ) : project.status === "accepted" ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-cyan-500" />
                                A producer has accepted your project!
                              </>
                            ) : (
                              <>
                                <Clock className="h-4 w-4" />
                                Waiting to be assigned to a producer...
                              </>
                            )}
                          </div>
                          
                          {/* Acceptance Deadline Warning */}
                          {(project.status === "pending" || project.status === "paid") && project.acceptance_deadline && (
                            (() => {
                              const { text, isUrgent } = getTimeRemaining(project.acceptance_deadline);
                              if (!text) return null;
                              return (
                                <div className={`flex items-center justify-center gap-2 p-2 rounded text-sm ${
                                  isUrgent ? 'bg-yellow-500/10 text-yellow-600' : 'bg-muted text-muted-foreground'
                                }`}>
                                  {isUrgent && <AlertTriangle className="h-4 w-4" />}
                                  <Clock className="h-3 w-3" />
                                  <span>{text}</span>
                                </div>
                              );
                            })()
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default MyProjects;
