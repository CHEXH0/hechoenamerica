import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/contexts/TranslationContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Music, Upload, RefreshCw, Eye, Mail, DollarSign, Clock, AlertTriangle, HardDrive, ExternalLink, Trash2 } from "lucide-react";
import { AudioFilePlayer } from "./AudioFilePlayer";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  bit_depth: string | null;
  sample_rate: string | null;
  payment_intent_id: string | null;
  acceptance_deadline: string | null;
  platform_fee_cents: number | null;
  producer_payout_cents: number | null;
  refunded_at: string | null;
  producer_paid_at: string | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600",
  pending_payment: "bg-orange-500/10 text-orange-600",
  paid: "bg-green-500/10 text-green-600",
  accepted: "bg-teal-500/10 text-teal-600",
  in_progress: "bg-blue-500/10 text-blue-600",
  review: "bg-purple-500/10 text-purple-600",
  completed: "bg-emerald-500/10 text-emerald-600",
};

export const ProducerProjects = () => {
  const { user } = useAuth();
  const { data: userRole } = useUserRole();
  const { toast } = useToast();
  const { t } = useTranslation();
  const tp = t.producerProjects;
  const tm = t.myProjects;
  const [projects, setProjects] = useState<SongRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<SongRequest | null>(null);
  const [resendingFilesId, setResendingFilesId] = useState<string | null>(null);
  const [processingPayoutId, setProcessingPayoutId] = useState<string | null>(null);
  const [hasDriveConnection, setHasDriveConnection] = useState<boolean | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isAdmin = userRole?.isAdmin || false;

  const statusOptions = [
    { value: "pending", label: tp.statusOptions.pending },
    { value: "accepted", label: tp.statusOptions.accepted },
    { value: "in_progress", label: tp.statusOptions.in_progress },
    { value: "review", label: tp.statusOptions.review },
    { value: "completed", label: tp.statusOptions.completed },
  ];

  const getTimeRemaining = (deadline: string | null): { text: string; isUrgent: boolean; isExpired: boolean } => {
    if (!deadline) return { text: '', isUrgent: false, isExpired: false };

    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffMs = deadlineDate.getTime() - now.getTime();

    if (diffMs <= 0) {
      return { text: tm.deadlineExpired, isUrgent: true, isExpired: true };
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return { text: `${hours}h ${minutes}m`, isUrgent: hours < 12, isExpired: false };
  };

  const handleProcessPayout = async (projectId: string) => {
    setProcessingPayoutId(projectId);
    try {
      const { data, error } = await supabase.functions.invoke('process-producer-payout', {
        body: { requestId: projectId }
      });

      if (error) throw error;

      toast({
        title: tp.toasts.payoutProcessedTitle,
        description: `${tp.toasts.payoutProcessedDesc} $${(data.payout.producerPayoutCents / 100).toFixed(2)}`,
      });

      fetchProjects();
    } catch (error: any) {
      console.error("Error processing payout:", error);
      toast({
        title: tp.toasts.errorTitle,
        description: error.message || tp.toasts.payoutFailedDesc,
        variant: "destructive",
      });
    } finally {
      setProcessingPayoutId(null);
    }
  };

  useEffect(() => {
    fetchProjects();
    checkDriveConnection();
  }, [user]);

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

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("song_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        title: tp.toasts.errorTitle,
        description: tp.toasts.fetchFailedDesc,
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
      }

      if (newStatus === 'accepted' && project?.file_urls && project.file_urls.length > 0) {
        try {
          const { data: userData } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', user?.id)
            .single();

          await supabase.functions.invoke('send-producer-files-email', {
            body: {
              requestId: projectId,
              producerEmail: user?.email,
              producerName: userData?.display_name || user?.email?.split('@')[0] || 'Producer'
            }
          });

          toast({
            title: tp.toasts.filesSentToProducerTitle,
            description: tp.toasts.filesSentToProducerDesc,
          });
        } catch (emailError) {
          console.error("Files email failed:", emailError);
        }
      }

      try {
        await supabase.functions.invoke('notify-customer-status', {
          body: {
            requestId: projectId,
            oldStatus,
            newStatus
          }
        });
      } catch (customerEmailError) {
        console.error("Customer notification failed:", customerEmailError);
      }

      toast({
        title: tp.toasts.statusUpdatedTitle,
        description: `${tp.toasts.statusUpdatedDesc} ${newStatus}`,
      });

      fetchProjects();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: tp.toasts.errorTitle,
        description: tp.toasts.statusUpdateFailedDesc,
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleFileUpload = async (projectId: string, file: File) => {
    if (!hasDriveConnection) {
      toast({
        title: tp.toasts.driveNotConnectedTitle,
        description: tp.toasts.driveNotConnectedDesc,
        variant: "destructive",
      });
      return;
    }

    setUploadingId(projectId);
    try {
      const project = projects.find(p => p.id === projectId);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('requestId', projectId);
      formData.append('customerEmail', project?.user_email || '');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('upload-deliverable-to-drive', {
        body: formData,
      });

      if (error) throw error;

      toast({
        title: tp.toasts.uploadSuccessTitle,
        description: (
          <div className="flex flex-col gap-2">
            <span>{tp.toasts.uploadSuccessDesc}</span>
            {data.driveLink && (
              <a
                href={data.driveLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline flex items-center gap-1"
              >
                {tp.toasts.openDriveFolder} <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        ),
      });

      fetchProjects();
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast({
        title: tp.toasts.errorTitle,
        description: error.message || tp.toasts.uploadFailedDesc,
        variant: "destructive",
      });
    } finally {
      setUploadingId(null);
    }
  };

  const handleResendFiles = async (project: SongRequest) => {
    if (!project.file_urls || project.file_urls.length === 0) {
      toast({
        title: tp.toasts.noFilesTitle,
        description: tp.toasts.noFilesDesc,
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
        title: tp.toasts.filesSentTitle,
        description: tp.toasts.filesSentDesc,
      });
    } catch (error) {
      console.error("Error resending files:", error);
      toast({
        title: tp.toasts.errorTitle,
        description: tp.toasts.filesEmailFailedDesc,
        variant: "destructive",
      });
    } finally {
      setResendingFilesId(null);
    }
  };

  const handleDeleteProject = async (projectId: string, fileUrls: string[] | null) => {
    setDeletingId(projectId);
    try {
      if (fileUrls && fileUrls.length > 0) {
        for (const url of fileUrls) {
          try {
            const urlObj = new URL(url);
            const pathMatch = urlObj.pathname.match(/\/object\/sign\/product-assets\/(.+)/);
            if (pathMatch) {
              const filePath = decodeURIComponent(pathMatch[1]);
              await supabase.storage
                .from('product-assets')
                .remove([filePath]);
            }
          } catch (fileError) {
            console.error("Error deleting file:", fileError);
          }
        }
      }

      const { error } = await supabase
        .from("song_requests")
        .delete()
        .eq("id", projectId);

      if (error) throw error;

      toast({
        title: tp.toasts.projectDeletedTitle,
        description: tp.toasts.projectDeletedDesc,
      });

      fetchProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: tp.toasts.errorTitle,
        description: tp.toasts.deleteFailedDesc,
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const getGenreLabel = (genre: string | null) => {
    const genreMap: Record<string, string> = {
      "hip-hop": tm.genres.hipHop,
      "rnb": tm.genres.rnb,
      "reggae": tm.genres.reggae,
      "latin": tm.genres.latin,
      "electronic": tm.genres.electronic,
      "pop": tm.genres.pop,
      "rock": tm.genres.rock,
      "world": tm.genres.world,
      "other": tm.genres.other,
    };
    return genre ? genreMap[genre] || genre : tm.genres.notSpecified;
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
              {tp.cardTitle}
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              {tp.cardDescription}
              {hasDriveConnection !== null && (
                <Badge
                  variant={hasDriveConnection ? "default" : "destructive"}
                  className="text-xs"
                >
                  <HardDrive className="h-3 w-3 mr-1" />
                  {hasDriveConnection ? tp.driveConnected : tp.driveNotConnected}
                </Badge>
              )}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchProjects}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {tp.refresh}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            {tp.noProjects}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tp.columnClient}</TableHead>
                <TableHead>{tp.columnGenre}</TableHead>
                <TableHead>{tp.columnTier}</TableHead>
                <TableHead>{tp.columnStatus}</TableHead>
                <TableHead>{tp.columnDate}</TableHead>
                <TableHead>{tp.columnActions}</TableHead>
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
                    <div className="flex items-center gap-2 flex-wrap">
                      {project.status === 'completed' && !project.producer_paid_at && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleProcessPayout(project.id)}
                          disabled={processingPayoutId === project.id}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          {processingPayoutId === project.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <DollarSign className="h-4 w-4 mr-1" />
                          )}
                          {tp.getPaid}
                        </Button>
                      )}

                      {project.status === 'completed' && project.producer_paid_at && (
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {tp.paid}
                        </Badge>
                      )}

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
                            <DialogTitle>{tp.projectDetails}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label className="text-muted-foreground">{tp.clientEmail}</Label>
                              <p className="font-medium">{project.user_email}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">{tp.songIdea}</Label>
                              <p className="bg-muted p-3 rounded-lg">{project.song_idea}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-muted-foreground">{tp.tier}</Label>
                                <p className="font-medium">{project.tier} ({project.price})</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">{tp.genre}</Label>
                                <p className="font-medium">{getGenreLabel(project.genre_category)}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-muted-foreground">{tp.bitDepth}</Label>
                                <p className="font-medium">{project.bit_depth || '24'}-bit</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">{tp.sampleRate}</Label>
                                <p className="font-medium">{project.sample_rate || '44.1'} kHz</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-muted-foreground">{tp.revisions}</Label>
                                <p className="font-medium">{project.number_of_revisions || 0}</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">{tp.options}</Label>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {project.wants_mixing && <Badge variant="secondary">{tp.statusOptions ? tm.addonMixing.replace('🎚️ ', '') : 'Mixing'}</Badge>}
                                  {project.wants_mastering && <Badge variant="secondary">{tm.addonMastering.replace('🔊 ', '')}</Badge>}
                                  {project.wants_analog && <Badge variant="secondary">{tm.addonAnalog.replace('📻 ', '')}</Badge>}
                                  {project.wants_recorded_stems && <Badge variant="secondary">{tm.addonStems.replace('🎹 ', '')}</Badge>}
                                </div>
                              </div>
                            </div>
                            {project.file_urls && project.file_urls.length > 0 && (
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <Label className="text-muted-foreground">{tp.clientFiles}</Label>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleResendFiles(project)}
                                    disabled={resendingFilesId === project.id}
                                  >
                                    {resendingFilesId === project.id ? (
                                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                      <Mail className="h-4 w-4 mr-2" />
                                    )}
                                    {tp.resendFilesToEmail}
                                  </Button>
                                </div>
                                <div className="space-y-3 max-h-80 overflow-y-auto">
                                  {project.file_urls.map((url, index) => {
                                    const urlParts = url.split('/');
                                    const fileName = decodeURIComponent(urlParts[urlParts.length - 1].split('?')[0]) || `File ${index + 1}`;
                                    return (
                                      <AudioFilePlayer
                                        key={index}
                                        url={url}
                                        fileName={fileName}
                                      />
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            <div className="border-t pt-4 mt-4">
                              <Label className="text-muted-foreground">{tp.paymentInformation}</Label>
                              <div className="grid grid-cols-2 gap-4 mt-2">
                                <div className="bg-muted/50 p-3 rounded-lg">
                                  <p className="text-xs text-muted-foreground">{tp.totalPayment}</p>
                                  <p className="font-medium">{project.price}</p>
                                </div>
                                {project.producer_payout_cents && (
                                  <div className="bg-emerald-500/10 p-3 rounded-lg">
                                    <p className="text-xs text-muted-foreground">{tp.yourPayout}</p>
                                    <p className="font-medium text-emerald-600">
                                      ${(project.producer_payout_cents / 100).toFixed(2)}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {project.status === 'pending' && project.acceptance_deadline && (
                                <div className="mt-3">
                                  {(() => {
                                    const { text, isUrgent, isExpired } = getTimeRemaining(project.acceptance_deadline);
                                    return (
                                      <div className={`flex items-center gap-2 p-2 rounded ${
                                        isExpired ? 'bg-destructive/10 text-destructive' :
                                        isUrgent ? 'bg-yellow-500/10 text-yellow-600' : 'bg-muted'
                                      }`}>
                                        {isUrgent ? <AlertTriangle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                                        <span className="text-sm font-medium">
                                          {isExpired ? tp.acceptanceExpired : `${tp.acceptWithin} ${text}`}
                                        </span>
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}

                              {project.status === 'completed' && (
                                <div className="mt-3">
                                  {project.producer_paid_at ? (
                                    <div className="flex items-center gap-2 p-2 bg-emerald-500/10 rounded">
                                      <DollarSign className="h-4 w-4 text-emerald-600" />
                                      <span className="text-sm text-emerald-600 font-medium">
                                        {tp.paidOn} {new Date(project.producer_paid_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                  ) : (
                                    <Button
                                      onClick={() => handleProcessPayout(project.id)}
                                      disabled={processingPayoutId === project.id}
                                      className="w-full"
                                    >
                                      {processingPayoutId === project.id ? (
                                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                      ) : (
                                        <DollarSign className="h-4 w-4 mr-2" />
                                      )}
                                      {tp.processProducerPayout}
                                    </Button>
                                  )}
                                </div>
                              )}

                              {project.refunded_at && (
                                <div className="mt-3 flex items-center gap-2 p-2 bg-destructive/10 rounded">
                                  <AlertTriangle className="h-4 w-4 text-destructive" />
                                  <span className="text-sm text-destructive font-medium">
                                    {tp.refundedOn} {new Date(project.refunded_at).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Label htmlFor={`upload-${project.id}`} className={!hasDriveConnection ? "cursor-not-allowed" : "cursor-pointer"}>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={uploadingId === project.id || !hasDriveConnection}
                                asChild
                              >
                                <span className="flex items-center gap-1">
                                  {uploadingId === project.id ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <HardDrive className="h-3 w-3" />
                                      <Upload className="h-4 w-4" />
                                    </>
                                  )}
                                </span>
                              </Button>
                            </Label>
                          </TooltipTrigger>
                          <TooltipContent>
                            {hasDriveConnection
                              ? tp.uploadTooltipConnected
                              : tp.uploadTooltipNotConnected
                            }
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <Input
                        id={`upload-${project.id}`}
                        type="file"
                        accept=".mp3,.wav,.m4a,.flac,.zip"
                        className="hidden"
                        disabled={!hasDriveConnection}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(project.id, file);
                        }}
                      />

                      {isAdmin && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={deletingId === project.id}
                            >
                              {deletingId === project.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{tp.deleteDialogTitle}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {tp.deleteDialogDesc}
                                <br /><br />
                                <strong>{tp.columnClient}:</strong> {project.user_email}<br />
                                <strong>{tp.tier}:</strong> {project.tier} ({project.price})
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{tp.deleteCancel}</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteProject(project.id, project.file_urls)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {tp.deleteConfirm}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
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
