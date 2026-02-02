import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Check, X, User, Music, Globe, ExternalLink, Loader2, AlertCircle, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ApplicationData {
  type: string;
  genres: string[];
  bio: string;
  image_url: string;
  spotify_url?: string;
  youtube_url?: string;
  apple_music_url?: string;
  instagram_url?: string;
  website_url?: string;
}

interface ProducerApplication {
  id: string;
  name: string;
  email: string;
  country: string;
  message: string;
  user_id: string | null;
  application_status: string;
  created_at: string;
  parsedData?: ApplicationData;
}

export const ProducerApplicationsAdmin = () => {
  const { toast } = useToast();
  const [applications, setApplications] = useState<ProducerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [sendingInvite, setSendingInvite] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<ProducerApplication | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ app: ProducerApplication; action: 'approve' | 'reject' } | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .eq('subject', 'Producer Application')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Parse the message JSON for each application
      const parsed = (data || []).map((app: any) => {
        let parsedData: ApplicationData | undefined;
        try {
          parsedData = JSON.parse(app.message);
        } catch (e) {
          console.error('Failed to parse application data:', e);
        }
        return { ...app, parsedData };
      });

      setApplications(parsed);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Failed to load applications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (applicationId: string, action: 'approve' | 'reject') => {
    setProcessing(applicationId);
    setConfirmAction(null);

    try {
      const { data, error } = await supabase.functions.invoke('approve-producer-application', {
        body: { applicationId, action }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Action failed');
      }

      toast({
        title: action === 'approve' ? "Application Approved! 🎉" : "Application Rejected",
        description: data.message,
      });

      fetchApplications();
    } catch (error: any) {
      console.error('Error processing application:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process application",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleScheduleInterview = async (app: ProducerApplication) => {
    setSendingInvite(app.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-interview-invite', {
        body: {
          applicantName: app.name,
          applicantEmail: app.email,
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to send invite');
      }

      toast({
        title: "Interview Invite Sent! 📅",
        description: `Booking link sent to ${app.email}`,
      });
    } catch (error: any) {
      console.error('Error sending interview invite:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send interview invite",
        variant: "destructive",
      });
    } finally {
      setSendingInvite(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Producer Applications
          </CardTitle>
          <CardDescription>
            Review and approve producer applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No applications yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Genres</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={app.parsedData?.image_url} />
                          <AvatarFallback>
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{app.name}</p>
                          <p className="text-sm text-muted-foreground">{app.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        {app.country}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {app.parsedData?.genres?.slice(0, 2).map((genre) => (
                          <Badge key={genre} variant="outline" className="text-xs">
                            {genre}
                          </Badge>
                        ))}
                        {(app.parsedData?.genres?.length || 0) > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{app.parsedData!.genres.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(app.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>{getStatusBadge(app.application_status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedApp(app)}
                        >
                          View
                        </Button>
                        {app.application_status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={sendingInvite === app.id}
                              onClick={() => handleScheduleInterview(app)}
                              title="Send interview booking link"
                            >
                              {sendingInvite === app.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Calendar className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              disabled={processing === app.id || !app.user_id}
                              onClick={() => setConfirmAction({ app, action: 'approve' })}
                              title={!app.user_id ? 'Applicant must have an account' : ''}
                            >
                              {processing === app.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={processing === app.id}
                              onClick={() => setConfirmAction({ app, action: 'reject' })}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
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

      {/* View Application Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Producer Application</DialogTitle>
            <DialogDescription>
              Application from {selectedApp?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedApp && (
            <div className="space-y-6">
              {!selectedApp.user_id && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This applicant does not have a user account linked. They must create an account before their application can be approved.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={selectedApp.parsedData?.image_url} />
                  <AvatarFallback>
                    <User className="h-10 w-10" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{selectedApp.name}</h3>
                  <p className="text-muted-foreground">{selectedApp.email}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Globe className="h-4 w-4" />
                    {selectedApp.country}
                  </p>
                </div>
                {getStatusBadge(selectedApp.application_status)}
              </div>

              <div>
                <h4 className="font-semibold mb-2">Genres</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedApp.parsedData?.genres?.map((genre) => (
                    <Badge key={genre} variant="secondary">{genre}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Bio</h4>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {selectedApp.parsedData?.bio}
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Links</h4>
                <div className="grid grid-cols-2 gap-2">
                  {selectedApp.parsedData?.spotify_url && (
                    <a
                      href={selectedApp.parsedData.spotify_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" /> Spotify
                    </a>
                  )}
                  {selectedApp.parsedData?.youtube_url && (
                    <a
                      href={selectedApp.parsedData.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" /> YouTube
                    </a>
                  )}
                  {selectedApp.parsedData?.apple_music_url && (
                    <a
                      href={selectedApp.parsedData.apple_music_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" /> Apple Music
                    </a>
                  )}
                  {selectedApp.parsedData?.instagram_url && (
                    <a
                      href={selectedApp.parsedData.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" /> Instagram
                    </a>
                  )}
                  {selectedApp.parsedData?.website_url && (
                    <a
                      href={selectedApp.parsedData.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" /> Website
                    </a>
                  )}
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                Applied: {format(new Date(selectedApp.created_at), 'PPpp')}
              </div>
            </div>
          )}

          <DialogFooter>
            {selectedApp?.application_status === 'pending' && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={sendingInvite === selectedApp.id}
                  onClick={() => handleScheduleInterview(selectedApp)}
                >
                  {sendingInvite === selectedApp.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Calendar className="h-4 w-4 mr-2" />
                  )}
                  Schedule Interview
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setSelectedApp(null);
                    setConfirmAction({ app: selectedApp, action: 'reject' });
                  }}
                >
                  <X className="h-4 w-4 mr-2" /> Reject
                </Button>
                <Button
                  disabled={!selectedApp.user_id}
                  onClick={() => {
                    setSelectedApp(null);
                    setConfirmAction({ app: selectedApp, action: 'approve' });
                  }}
                  title={!selectedApp.user_id ? 'Applicant must have an account' : ''}
                >
                  <Check className="h-4 w-4 mr-2" /> Approve
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.action === 'approve' ? 'Approve Application?' : 'Reject Application?'}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.action === 'approve' ? (
                <>
                  This will grant <strong>{confirmAction.app.name}</strong> producer permissions and create their producer profile with the application data.
                </>
              ) : (
                <>
                  This will reject <strong>{confirmAction?.app.name}</strong>'s application. They will be notified via email.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>
              Cancel
            </Button>
            <Button
              variant={confirmAction?.action === 'approve' ? 'default' : 'destructive'}
              onClick={() => confirmAction && handleAction(confirmAction.app.id, confirmAction.action)}
              disabled={processing === confirmAction?.app.id}
            >
              {processing === confirmAction?.app.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {confirmAction?.action === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
