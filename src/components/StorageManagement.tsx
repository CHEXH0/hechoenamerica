import { useState, useEffect } from "react";
import { HardDrive, Trash2, RefreshCw, Download, FileAudio, Upload, Package, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StorageItem {
  name: string;
  size: number;
  createdAt: string;
  path: string;
}

interface StorageStats {
  totalBytes: number;
  totalFiles: number;
  userUploads: {
    bytes: number;
    files: number;
    items: StorageItem[];
  };
  deliverables: {
    bytes: number;
    files: number;
    items: StorageItem[];
  };
  other: {
    bytes: number;
    files: number;
    items: StorageItem[];
  };
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const StorageManagement = () => {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningCleanup, setRunningCleanup] = useState(false);
  const [deletingFiles, setDeletingFiles] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const { toast } = useToast();

  const fetchStorageStats = async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('get-storage-stats', {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (error) throw error;
      if (data?.stats) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching storage stats:', error);
      toast({
        title: "Error",
        description: "Failed to fetch storage statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorageStats();
  }, []);

  const handleRunCleanup = async () => {
    setRunningCleanup(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('admin-cleanup-storage', {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: { action: 'run_cleanup' },
      });

      if (error) throw error;

      toast({
        title: "Cleanup Complete",
        description: data.message,
      });

      fetchStorageStats();
    } catch (error) {
      console.error('Error running cleanup:', error);
      toast({
        title: "Error",
        description: "Failed to run cleanup",
        variant: "destructive",
      });
    } finally {
      setRunningCleanup(false);
    }
  };

  const handleDeleteCompletedUploads = async () => {
    setDeletingFiles(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('admin-cleanup-storage', {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: { action: 'delete_completed_uploads' },
      });

      if (error) throw error;

      toast({
        title: "Deletion Complete",
        description: data.message,
      });

      fetchStorageStats();
    } catch (error) {
      console.error('Error deleting files:', error);
      toast({
        title: "Error",
        description: "Failed to delete files",
        variant: "destructive",
      });
    } finally {
      setDeletingFiles(false);
    }
  };

  const handleDeleteSelectedFiles = async () => {
    if (selectedFiles.length === 0) return;

    setDeletingFiles(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('admin-cleanup-storage', {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: { action: 'delete_files', filePaths: selectedFiles },
      });

      if (error) throw error;

      toast({
        title: "Files Deleted",
        description: data.message,
      });

      setSelectedFiles([]);
      fetchStorageStats();
    } catch (error) {
      console.error('Error deleting files:', error);
      toast({
        title: "Error",
        description: "Failed to delete selected files",
        variant: "destructive",
      });
    } finally {
      setDeletingFiles(false);
    }
  };

  const toggleFileSelection = (path: string) => {
    setSelectedFiles(prev =>
      prev.includes(path)
        ? prev.filter(p => p !== path)
        : [...prev, path]
    );
  };

  const selectAllInCategory = (items: StorageItem[], category: string) => {
    const paths = items.map(i => i.path);
    const allSelected = paths.every(p => selectedFiles.includes(p));

    if (allSelected) {
      setSelectedFiles(prev => prev.filter(p => !paths.includes(p)));
    } else {
      setSelectedFiles(prev => [...new Set([...prev, ...paths])]);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalStorage = stats?.totalBytes || 0;
  const userUploadsPercent = totalStorage > 0 ? (stats?.userUploads.bytes || 0) / totalStorage * 100 : 0;
  const deliverablesPercent = totalStorage > 0 ? (stats?.deliverables.bytes || 0) / totalStorage * 100 : 0;
  const otherPercent = totalStorage > 0 ? (stats?.other.bytes || 0) / totalStorage * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Storage Management
            </CardTitle>
            <CardDescription>
              Monitor and manage storage usage across all buckets
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchStorageStats} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground">Total Storage</div>
            <div className="text-2xl font-bold">{formatBytes(stats?.totalBytes || 0)}</div>
            <div className="text-xs text-muted-foreground">{stats?.totalFiles || 0} files</div>
          </div>
          <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <Upload className="h-4 w-4" />
              User Uploads
            </div>
            <div className="text-2xl font-bold">{formatBytes(stats?.userUploads.bytes || 0)}</div>
            <div className="text-xs text-muted-foreground">{stats?.userUploads.files || 0} files</div>
          </div>
          <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <FileAudio className="h-4 w-4" />
              Deliverables
            </div>
            <div className="text-2xl font-bold">{formatBytes(stats?.deliverables.bytes || 0)}</div>
            <div className="text-xs text-muted-foreground">{stats?.deliverables.files || 0} files</div>
          </div>
          <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
              <Package className="h-4 w-4" />
              Other Assets
            </div>
            <div className="text-2xl font-bold">{formatBytes(stats?.other.bytes || 0)}</div>
            <div className="text-xs text-muted-foreground">{stats?.other.files || 0} files</div>
          </div>
        </div>

        {/* Storage Breakdown Bar */}
        {totalStorage > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Storage Breakdown</div>
            <div className="h-4 bg-muted rounded-full overflow-hidden flex">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${userUploadsPercent}%` }}
                title={`User Uploads: ${formatBytes(stats?.userUploads.bytes || 0)}`}
              />
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${deliverablesPercent}%` }}
                title={`Deliverables: ${formatBytes(stats?.deliverables.bytes || 0)}`}
              />
              <div
                className="h-full bg-purple-500 transition-all"
                style={{ width: `${otherPercent}%` }}
                title={`Other: ${formatBytes(stats?.other.bytes || 0)}`}
              />
            </div>
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded" />
                <span>User Uploads ({userUploadsPercent.toFixed(1)}%)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span>Deliverables ({deliverablesPercent.toFixed(1)}%)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-purple-500 rounded" />
                <span>Other ({otherPercent.toFixed(1)}%)</span>
              </div>
            </div>
          </div>
        )}

        {/* Cleanup Actions */}
        <div className="flex flex-wrap gap-3 pt-4 border-t">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={runningCleanup}>
                <RefreshCw className={`h-4 w-4 mr-2 ${runningCleanup ? 'animate-spin' : ''}`} />
                Run Cleanup (24h+)
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Run Cleanup Job</AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete user-uploaded reference files from completed song requests that are older than 24 hours.
                  This is the same cleanup that runs automatically every day at 3 AM UTC.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRunCleanup}>
                  Run Cleanup
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deletingFiles}>
                <Trash2 className={`h-4 w-4 mr-2 ${deletingFiles ? 'animate-spin' : ''}`} />
                Delete All Completed Uploads
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Delete All Completed Uploads
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete ALL user-uploaded reference files from completed song requests,
                  regardless of age. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteCompletedUploads}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {selectedFiles.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={deletingFiles}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected ({selectedFiles.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Selected Files</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {selectedFiles.length} selected file(s)?
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteSelectedFiles}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Selected
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* File Browser */}
        <Accordion type="multiple" className="w-full">
          {stats?.userUploads.items && stats.userUploads.items.length > 0 && (
            <AccordionItem value="user-uploads">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-blue-500" />
                  <span>User Uploads ({stats.userUploads.files} files)</span>
                  <Badge variant="secondary" className="ml-2">
                    {formatBytes(stats.userUploads.bytes)}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => selectAllInCategory(stats.userUploads.items, 'userUploads')}
                  >
                    {stats.userUploads.items.every(i => selectedFiles.includes(i.path))
                      ? 'Deselect All'
                      : 'Select All'}
                  </Button>
                  <ScrollArea className="h-48">
                    <div className="space-y-1">
                      {stats.userUploads.items.map((item) => (
                        <div
                          key={item.path}
                          className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded text-sm"
                        >
                          <Checkbox
                            checked={selectedFiles.includes(item.path)}
                            onCheckedChange={() => toggleFileSelection(item.path)}
                          />
                          <span className="flex-1 truncate">{item.name}</span>
                          <span className="text-muted-foreground">{formatBytes(item.size)}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {stats?.deliverables.items && stats.deliverables.items.length > 0 && (
            <AccordionItem value="deliverables">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <FileAudio className="h-4 w-4 text-green-500" />
                  <span>Deliverables ({stats.deliverables.files} files)</span>
                  <Badge variant="secondary" className="ml-2">
                    {formatBytes(stats.deliverables.bytes)}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => selectAllInCategory(stats.deliverables.items, 'deliverables')}
                  >
                    {stats.deliverables.items.every(i => selectedFiles.includes(i.path))
                      ? 'Deselect All'
                      : 'Select All'}
                  </Button>
                  <ScrollArea className="h-48">
                    <div className="space-y-1">
                      {stats.deliverables.items.map((item) => (
                        <div
                          key={item.path}
                          className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded text-sm"
                        >
                          <Checkbox
                            checked={selectedFiles.includes(item.path)}
                            onCheckedChange={() => toggleFileSelection(item.path)}
                          />
                          <span className="flex-1 truncate">{item.name}</span>
                          <span className="text-muted-foreground">{formatBytes(item.size)}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {stats?.other.items && stats.other.items.length > 0 && (
            <AccordionItem value="other">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-purple-500" />
                  <span>Other Assets ({stats.other.files} files)</span>
                  <Badge variant="secondary" className="ml-2">
                    {formatBytes(stats.other.bytes)}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground italic">
                    These assets (product images, audio samples, etc.) are protected and cannot be deleted from here.
                  </p>
                  <ScrollArea className="h-48">
                    <div className="space-y-1">
                      {stats.other.items.map((item) => (
                        <div
                          key={item.path}
                          className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded text-sm"
                        >
                          <span className="flex-1 truncate">{item.name}</span>
                          <span className="text-muted-foreground">{formatBytes(item.size)}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>

        {stats?.totalFiles === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <p>No files in storage</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
