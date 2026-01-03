import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Music, Upload, RefreshCw, Eye, FileAudio, ExternalLink } from "lucide-react";

interface SongRequest {
  id: string;
  user_id: string;
  user_email: string;
  song_idea: string;
  tier: string;
  price: string;
  status: string;
  genre_category: string | null;
  file_urls: string[] | null;
  created_at: string;
  number_of_revisions: number | null;
  wants_mixing: boolean | null;
  wants_mastering: boolean | null;
  wants_analog: boolean | null;
  wants_recorded_stems: boolean | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600",
  pending_payment: "bg-orange-500/10 text-orange-600",
  paid: "bg-green-500/10 text-green-600",
  in_progress: "bg-blue-500/10 text-blue-600",
  review: "bg-purple-500/10 text-purple-600",
  completed: "bg-emerald-500/10 text-emerald-600",
};

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "Under Review" },
  { value: "completed", label: "Completed" },
];

export const ProducerProjects = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<SongRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<SongRequest | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      // Fetch all song requests (producers can see all via RLS)
      const { data, error } = await supabase
        .from("song_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        title: "Error",
        description: "Failed to fetch projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (projectId: string, newStatus: string) => {
    setUpdatingId(projectId);
    const project = projects.find(p => p.id === projectId);
    const oldStatus = project?.status || 'unknown';
    
    try {
      const { error } = await supabase
        .from("song_requests")
        .update({ status: newStatus })
        .eq("id", projectId);

      if (error) throw error;

      // Send Discord notification for status change
      try {
        await supabase.functions.invoke('send-discord-notification', {
          body: {
            requestId: projectId,
            notificationType: 'status_change',
            oldStatus,
            newStatus
          }
        });
      } catch (discordError) {
        console.error("Discord notification failed:", discordError);
        // Don't fail the whole operation if Discord fails
      }

      toast({
        title: "Status Updated",
        description: `Project status changed to ${newStatus}`,
      });

      fetchProjects();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleFileUpload = async (projectId: string, file: File) => {
    setUploadingId(projectId);
    try {
      const timestamp = Date.now();
      const fileName = `deliverables/${projectId}/${timestamp}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("product-assets")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get signed URL
      const { data: signedData, error: signError } = await supabase.storage
        .from("product-assets")
        .createSignedUrl(fileName, 315360000); // 10 years

      if (signError || !signedData) throw signError;

      // Update project to completed with download URL
      // First create a purchase record for tracking
      const project = projects.find(p => p.id === projectId);
      if (project) {
        const { error: purchaseError } = await supabase
          .from("purchases")
          .upsert({
            user_id: project.user_id,
            product_id: projectId,
            product_name: `Song Generation - ${project.tier}`,
            product_type: "song_generation",
            product_category: project.tier,
            price: project.price,
            status: "ready",
            download_url: signedData.signedUrl,
            song_idea: project.song_idea,
          }, {
            onConflict: 'product_id'
          });

        if (purchaseError) {
          console.error("Purchase upsert error:", purchaseError);
        }
      }

      // Update song request status
      const { error: updateError } = await supabase
        .from("song_requests")
        .update({ status: "completed" })
        .eq("id", projectId);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "File uploaded and project marked as completed!",
      });

      fetchProjects();
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploadingId(null);
    }
  };

  const getGenreLabel = (genre: string | null) => {
    const genreMap: Record<string, string> = {
      "hip-hop": "Hip Hop / Trap",
      "rnb": "R&B / Soul",
      "reggae": "Reggae",
      "latin": "Latin",
      "electronic": "Electronic",
      "pop": "Pop",
      "rock": "Rock",
      "world": "World / Indigenous",
      "other": "Other",
    };
    return genre ? genreMap[genre] || genre : "Not specified";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              My Assigned Projects
            </CardTitle>
            <CardDescription>
              Manage your song production projects
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchProjects}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No projects assigned yet
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Genre</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{project.user_email}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {project.song_idea?.substring(0, 50)}...
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getGenreLabel(project.genre_category)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-primary/10 text-primary">
                      {project.tier}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={project.status}
                      onValueChange={(value) => handleStatusChange(project.id, value)}
                      disabled={updatingId === project.id}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {new Date(project.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {/* View Details */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedProject(project)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Project Details</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label className="text-muted-foreground">Client Email</Label>
                              <p className="font-medium">{project.user_email}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Song Idea</Label>
                              <p className="bg-muted p-3 rounded-lg">{project.song_idea}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-muted-foreground">Tier</Label>
                                <p className="font-medium">{project.tier} ({project.price})</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Genre</Label>
                                <p className="font-medium">{getGenreLabel(project.genre_category)}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-muted-foreground">Revisions</Label>
                                <p className="font-medium">{project.number_of_revisions || 0}</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Options</Label>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {project.wants_mixing && <Badge variant="secondary">Mixing</Badge>}
                                  {project.wants_mastering && <Badge variant="secondary">Mastering</Badge>}
                                  {project.wants_analog && <Badge variant="secondary">Analog</Badge>}
                                  {project.wants_recorded_stems && <Badge variant="secondary">Stems</Badge>}
                                </div>
                              </div>
                            </div>
                            {project.file_urls && project.file_urls.length > 0 && (
                              <div>
                                <Label className="text-muted-foreground">Client Files</Label>
                                <div className="space-y-2 mt-2">
                                  {project.file_urls.map((url, index) => (
                                    <a
                                      key={index}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-primary hover:underline"
                                    >
                                      <FileAudio className="h-4 w-4" />
                                      File {index + 1}
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* Upload Deliverable */}
                      <Label htmlFor={`upload-${project.id}`} className="cursor-pointer">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={uploadingId === project.id}
                          asChild
                        >
                          <span>
                            {uploadingId === project.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                          </span>
                        </Button>
                      </Label>
                      <Input
                        id={`upload-${project.id}`}
                        type="file"
                        accept=".mp3,.wav,.m4a,.flac,.zip"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(project.id, file);
                        }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
