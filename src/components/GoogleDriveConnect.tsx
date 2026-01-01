import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { RefreshCw, CheckCircle, XCircle, HardDrive } from "lucide-react";

export const GoogleDriveConnect = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (user) {
      checkConnection();
    }
  }, [user]);

  useEffect(() => {
    // Listen for OAuth callback messages
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'google-auth-success') {
        setIsConnected(true);
        setIsConnecting(false);
        toast({
          title: "Success",
          description: "Google Drive connected successfully!",
        });
      } else if (event.data?.type === 'google-auth-error') {
        setIsConnecting(false);
        toast({
          title: "Error",
          description: event.data.error || "Failed to connect Google Drive",
          variant: "destructive",
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [toast]);

  const checkConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('producer_google_tokens')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      setIsConnected(!!data);
    } catch (error) {
      console.error('Error checking Google connection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!user) return;
    
    setIsConnecting(true);
    try {
      const redirectUri = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-auth-callback`;
      const state = btoa(JSON.stringify({ userId: user.id }));

      const { data: session } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('google-auth-start', {
        body: { redirectUri, state },
        headers: {
          Authorization: `Bearer ${session.session?.access_token}`,
        },
      });

      if (error) throw error;

      // Open OAuth popup
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      window.open(
        data.authUrl,
        'google-auth',
        `width=${width},height=${height},left=${left},top=${top}`
      );
    } catch (error: any) {
      console.error('Error starting Google auth:', error);
      setIsConnecting(false);
      toast({
        title: "Error",
        description: error.message || "Failed to start Google authentication",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('producer_google_tokens')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setIsConnected(false);
      toast({
        title: "Disconnected",
        description: "Google Drive disconnected successfully",
      });
    } catch (error: any) {
      console.error('Error disconnecting Google:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to disconnect Google Drive",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          Google Drive Integration
        </CardTitle>
        <CardDescription>
          Connect your Google Drive to automatically upload delivered songs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isConnected ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Connected</p>
                  <p className="text-sm text-muted-foreground">
                    Songs will be uploaded to your Google Drive
                  </p>
                </div>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Not Connected</p>
                  <p className="text-sm text-muted-foreground">
                    Connect to enable automatic uploads
                  </p>
                </div>
              </>
            )}
          </div>
          
          {isConnected ? (
            <Button variant="outline" onClick={handleDisconnect}>
              Disconnect
            </Button>
          ) : (
            <Button onClick={handleConnect} disabled={isConnecting}>
              {isConnecting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect Google Drive'
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
