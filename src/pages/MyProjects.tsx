import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Music, Download, Clock, CheckCircle, Loader2, FileAudio, Calendar, User, Wifi, AlertTriangle, RefreshCcw, Headphones, Users, Upload, HardDrive, ExternalLink, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { Input } from "@/components/ui/input";

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
  user_email: string;
  acceptance_deadline: string | null;
  refunded_at: string | null;
  file_urls: string[] | null;
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

const getTimeRemaining = (deadline: string | null): { text: string; hours: number; minutes: number; seconds: number; isUrgent: boolean; isExpired: boolean; percentage: number } => {
  if (!deadline) return { text: '', hours: 0, minutes: 0, seconds: 0, isUrgent: false, isExpired: false, percentage: 0 };
  
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffMs = deadlineDate.getTime() - now.getTime();
  
  const totalMs = 48 * 60 * 60 * 1000;
  const percentage = Math.max(0, Math.min(100, (diffMs / totalMs) * 100));
  
  if (diffMs <= 0) {
    return { text: 'Expired', hours: 0, minutes: 0, seconds: 0, isUrgent: true, isExpired: true, percentage: 0 };
  }
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  
  return { 
    text: `${hours}h ${minutes}m ${seconds}s`, 
    hours,
    minutes,
    seconds,
    isUrgent: hours < 12,
    isExpired: false,
    percentage
  };
};

// Countdown Timer Component
const CountdownTimer = ({ deadline }: { deadline: string }) => {
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(deadline));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(getTimeRemaining(deadline));
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline]);

  if (!deadline) return null;

  const { hours, minutes, seconds, isUrgent, isExpired, percentage } = timeRemaining;

  if (isExpired) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-500 mb-2">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-semibold">Deadline Expired</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Processing refund if no producer accepted...
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg p-4 border ${
      isUrgent 
        ? 'bg-amber-500/10 border-amber-500/30' 
        : 'bg-primary/5 border-primary/20'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className={`h-4 w-4 ${isUrgent ? 'text-amber-500' : 'text-primary'}`} />
          <span className={`text-sm font-medium ${isUrgent ? 'text-amber-600' : 'text-foreground'}`}>
            Producer Acceptance Window
          </span>
        </div>
        {isUrgent && (
          <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full animate-pulse">
            Urgent
          </span>
        )}
      </div>
      
      <div className="flex justify-center gap-2 mb-3">
        <div className="bg-background rounded-lg px-3 py-2 min-w-[60px] text-center shadow-sm">
          <div className={`text-2xl font-bold tabular-nums ${isUrgent ? 'text-amber-500' : 'text-primary'}`}>
            {String(hours).padStart(2, '0')}
          </div>
          <div className="text-[10px] uppercase text-muted-foreground tracking-wider">Hours</div>
        </div>
        <div className="flex items-center text-muted-foreground font-bold">:</div>
        <div className="bg-background rounded-lg px-3 py-2 min-w-[60px] text-center shadow-sm">
          <div className={`text-2xl font-bold tabular-nums ${isUrgent ? 'text-amber-500' : 'text-primary'}`}>
            {String(minutes).padStart(2, '0')}
          </div>
          <div className="text-[10px] uppercase text-muted-foreground tracking-wider">Mins</div>
        </div>
        <div className="flex items-center text-muted-foreground font-bold">:</div>
        <div className="bg-background rounded-lg px-3 py-2 min-w-[60px] text-center shadow-sm">
          <div className={`text-2xl font-bold tabular-nums ${isUrgent ? 'text-amber-500' : 'text-primary'}`}>
            {String(seconds).padStart(2, '0')}
          </div>
          <div className="text-[10px] uppercase text-muted-foreground tracking-wider">Secs</div>
        </div>
      </div>

      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ${isUrgent ? 'bg-amber-500' : 'bg-primary'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <p className="text-xs text-muted-foreground mt-2 text-center">
        A producer will accept your project within this window
      </p>
    </div>
  );
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

const MyProjects = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: userRole } = useUserRole();
  const [myRequests, setMyRequests] = useState<SongRequest[]>([]);
  const [producerProjects, setProducerProjects] = useState<SongRequest[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [producers, setProducers] = useState<Record<string, Producer>>({});
  const [loading, setLoading] = useState(true);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [activeTab, setActiveTab] = useState("my-requests");
  const [hasDriveConnection, setHasDriveConnection] = useState<boolean | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [resendingFilesId, setResendingFilesId] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const uploadXhrRef = useRef<XMLHttpRequest | null>(null);
  const { toast } = useToast();

  const isProducer = userRole?.isProducer || false;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProjects();
      if (isProducer) {
        checkDriveConnection();
      }
    }
  }, [user, isProducer]);

  const checkDriveConnection = async () => {
    if (!user) {
      setHasDriveConnection(false);
      return;
    }
    
    const { data, error } = await supabase
      .from('producer_google_tokens')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    setHasDriveConnection(!error && !!data);
  };

  // Max file size: 200MB (using resumable upload with streaming chunks)
  const MAX_FILE_SIZE_MB = 200;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileUpload = async (projectId: string, file: File) => {
    if (!hasDriveConnection) {
      toast({
        title: "Google Drive Not Connected",
        description: "Please connect your Google Drive in your Profile settings first.",
        variant: "destructive",
      });
      return;
    }

    // File size validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast({
        title: "File Too Large",
        description: `Maximum file size is ${MAX_FILE_SIZE_MB}MB. Your file is ${formatFileSize(file.size)}. Please compress or split the file.`,
        variant: "destructive",
      });
      return;
    }

    setUploadingId(projectId);
    setUploadProgress(0);
    
    try {
      const project = producerProjects.find(p => p.id === projectId);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('requestId', projectId);
      formData.append('customerEmail', project?.user_email || '');

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      // Use XMLHttpRequest for progress tracking and cancel support
      const result = await new Promise<{ driveLink?: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        uploadXhrRef.current = xhr;
        
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentComplete);
          }
        });

        xhr.addEventListener('load', () => {
          uploadXhrRef.current = null;
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch {
              reject(new Error('Invalid response from server'));
            }
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              reject(new Error(errorResponse.error || 'Upload failed'));
            } catch {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        });

        xhr.addEventListener('error', () => {
          uploadXhrRef.current = null;
          reject(new Error('Network error during upload'));
        });

        xhr.addEventListener('abort', () => {
          uploadXhrRef.current = null;
          reject(new Error('Upload cancelled'));
        });

        const supabaseUrl = 'https://eapbuoqkhckqaswfjexv.supabase.co';
        xhr.open('POST', `${supabaseUrl}/functions/v1/upload-deliverable-to-drive`);
        xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
        xhr.send(formData);
      });

      toast({
        title: "Success! 🎉",
        description: (
          <div className="flex flex-col gap-2">
            <span>File uploaded to Google Drive and project completed!</span>
            {result.driveLink && (
              <a 
                href={result.driveLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary underline flex items-center gap-1"
              >
                Open Drive Folder <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        ),
      });

      fetchProjects();
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload file to Google Drive",
        variant: "destructive",
      });
    } finally {
      setUploadingId(null);
      setUploadProgress(0);
    }
  };

  const handleResendFiles = async (project: SongRequest) => {
    if (!project.file_urls || project.file_urls.length === 0) {
      toast({
        title: "No Files",
        description: "This project has no customer files attached.",
        variant: "destructive",
      });
      return;
    }

    setResendingFilesId(project.id);
    try {
      const { data: userData } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user?.id)
        .single();

      await supabase.functions.invoke('send-producer-files-email', {
        body: {
          requestId: project.id,
          producerEmail: user?.email,
          producerName: userData?.display_name || user?.email?.split('@')[0] || 'Producer'
        }
      });

      toast({
        title: "Files Sent!",
        description: "Customer files have been emailed to you.",
      });
    } catch (error) {
      console.error("Error resending files:", error);
      toast({
        title: "Error",
        description: "Failed to send files email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setResendingFilesId(null);
    }
  };

  const handleStartWorking = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from("song_requests")
        .update({ status: "in_progress" })
        .eq("id", projectId);

      if (error) throw error;

      // Send customer notification
      try {
        await supabase.functions.invoke('notify-customer-status', {
          body: {
            requestId: projectId,
            oldStatus: 'accepted',
            newStatus: 'in_progress'
          }
        });
      } catch (notifyError) {
        console.error("Customer notification failed:", notifyError);
      }

      toast({
        title: "Project Started",
        description: "Status updated to In Progress. Time to make some music! 🎵",
      });

      fetchProjects();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update project status",
        variant: "destructive",
      });
    }
  };

  // Real-time subscription
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
          
          setMyRequests((prev) =>
            prev.map((p) =>
              p.id === updatedProject.id ? { ...p, ...updatedProject } : p
            )
          );

          toast({
            title: "Project Updated",
            description: `Your project status changed to: ${statusLabels[updatedProject.status] || updatedProject.status}`,
          });

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

      // Fetch my song requests (as a customer)
      const { data: requestsData, error: requestsError } = await supabase
        .from("song_requests")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (requestsError) throw requestsError;
      setMyRequests(requestsData || []);

      // If user is a producer, fetch their assigned projects
      if (isProducer) {
        // First get the producer record for this user
        const { data: producerData } = await supabase
          .from("producers")
          .select("id")
          .eq("email", user?.email)
          .single();

        if (producerData) {
          const { data: producerProjectsData, error: producerError } = await supabase
            .from("song_requests")
            .select("*")
            .eq("assigned_producer_id", producerData.id)
            .order("created_at", { ascending: false });

          if (producerError) throw producerError;
          setProducerProjects(producerProjectsData || []);
        }
      }

      // Fetch purchases for download URLs
      const { data: purchasesData, error: purchasesError } = await supabase
        .from("purchases")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (purchasesError) throw purchasesError;
      setPurchases(purchasesData || []);

      // Fetch producers for assigned projects
      const allProjects = [...(requestsData || [])];
      const producerIds = allProjects
        .filter((r) => r.assigned_producer_id)
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

  // Project Card Component
  const ProjectCard = ({ project, isProducerView = false }: { project: SongRequest; isProducerView?: boolean }) => {
    const downloadUrl = getDownloadUrl(project.id);
    const producer = project.assigned_producer_id
      ? producers[project.assigned_producer_id]
      : null;

    return (
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
            <p className="text-sm text-muted-foreground mb-1">
              {isProducerView ? "Client's Idea:" : "Your Idea:"}
            </p>
            <p className="text-foreground">{project.song_idea}</p>
          </div>

          {/* Client Info (for producer view) */}
          {isProducerView && (
            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <User className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Client</p>
                <p className="font-medium">{project.user_email}</p>
              </div>
            </div>
          )}

          {/* Producer Info (for customer view) */}
          {!isProducerView && project.assigned_producer_id && producer && 
           ['accepted', 'in_progress', 'review', 'completed'].includes(project.status) && (
            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
              <img
                src={producer.image}
                alt={producer.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="text-sm text-muted-foreground">Your Producer</p>
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

          {/* Producer View Actions */}
          {isProducerView && (
            <div className="flex flex-col gap-3">
              {/* Google Drive Status */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Google Drive:</span>
                <Badge 
                  variant={hasDriveConnection ? "default" : "destructive"}
                  className="text-xs"
                >
                  <HardDrive className="h-3 w-3 mr-1" />
                  {hasDriveConnection ? "Connected" : "Not Connected"}
                </Badge>
              </div>

              {/* Get Customer Files Button */}
              {project.file_urls && project.file_urls.length > 0 && (
                <Button 
                  variant="outline"
                  className="w-full" 
                  onClick={() => handleResendFiles(project)}
                  disabled={resendingFilesId === project.id}
                >
                  {resendingFilesId === project.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  Email Me Customer Files
                </Button>
              )}

              {project.status === "accepted" && (
                <Button 
                  className="w-full" 
                  onClick={() => handleStartWorking(project.id)}
                >
                  <Headphones className="mr-2 h-4 w-4" />
                  Start Working on Project
                </Button>
              )}
              
              {project.status === "in_progress" && (
                <>
                  <input
                    type="file"
                    ref={(el) => { fileInputRefs.current[project.id] = el; }}
                    className="hidden"
                    accept="audio/*,.zip,.rar"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(project.id, file);
                    }}
                  />
                  {uploadingId === project.id ? (
                    <div className="w-full space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Uploading to Drive...
                        </span>
                        <span className="font-medium text-primary">{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-destructive hover:text-destructive"
                        onClick={() => {
                          if (uploadXhrRef.current) {
                            uploadXhrRef.current.abort();
                            toast({
                              title: "Upload Cancelled",
                              description: "The file upload was cancelled.",
                            });
                          }
                        }}
                      >
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Cancel Upload
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      className="w-full" 
                      onClick={() => {
                        if (!hasDriveConnection) {
                          toast({
                            title: "Connect Google Drive First",
                            description: "Go to your Profile page to connect Google Drive before uploading.",
                            variant: "destructive",
                          });
                          return;
                        }
                        fileInputRefs.current[project.id]?.click();
                      }}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Deliverables to Drive
                    </Button>
                  )}
                  {!hasDriveConnection && (
                    <p className="text-xs text-amber-600 text-center">
                      ⚠️ Connect Google Drive in your Profile to upload
                    </p>
                  )}
                </>
              )}
              
              {project.status === "completed" && (
                <div className="flex items-center justify-center gap-2 text-emerald-500 py-2">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Project Completed!</span>
                </div>
              )}
            </div>
          )}

          {/* Customer View Actions */}
          {!isProducerView && (
            <>
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
                    ) : project.status === "paid" ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Payment confirmed! Awaiting producer assignment...
                      </>
                    ) : project.status === "pending" ? (
                      <>
                        <Clock className="h-4 w-4" />
                        Project submitted. Awaiting producer assignment...
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4" />
                        Processing your request...
                      </>
                    )}
                  </div>
                  
                  {(project.status === "pending" || project.status === "paid") && project.acceptance_deadline && (
                    <CountdownTimer deadline={project.acceptance_deadline} />
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    );
  };

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
                {isProducer ? "Manage your requests and producer assignments" : "Track the progress of your song requests"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isRealtimeConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-xs text-muted-foreground">
                {isRealtimeConnected ? 'Live updates' : 'Connecting...'}
              </span>
              <Wifi className={`h-4 w-4 ${isRealtimeConnected ? 'text-green-500' : 'text-muted-foreground'}`} />
            </div>
          </div>
        </motion.div>

        {/* Tabs for Producer vs Customer Projects */}
        {isProducer ? (
          <Tabs defaultValue="my-requests" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="my-requests" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                My Requests ({myRequests.length})
              </TabsTrigger>
              <TabsTrigger value="producer-projects" className="flex items-center gap-2">
                <Headphones className="h-4 w-4" />
                Producer Projects ({producerProjects.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="my-requests">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {myRequests.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Requests Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        You haven't submitted any song requests as a customer.
                      </p>
                      <Button onClick={() => navigate("/generate-song")}>
                        Create Your First Song
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  myRequests.map((project, index) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <ProjectCard project={project} isProducerView={false} />
                    </motion.div>
                  ))
                )}
              </motion.div>
            </TabsContent>

            <TabsContent value="producer-projects">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {producerProjects.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Headphones className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Producer Projects Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        You haven't accepted any projects as a producer yet.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Check Discord for new project notifications to accept!
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  producerProjects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <ProjectCard project={project} isProducerView={true} />
                    </motion.div>
                  ))
                )}
              </motion.div>
            </TabsContent>
          </Tabs>
        ) : (
          // Regular user view (no tabs)
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {myRequests.length === 0 ? (
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
              myRequests.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ProjectCard project={project} isProducerView={false} />
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MyProjects;
