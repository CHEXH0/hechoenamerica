import { useState, useEffect } from "react";
import { CreditCard, CheckCircle2, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface StripeConnectOnboardingProps {
  producerId: string;
}

export const StripeConnectOnboarding = ({ producerId }: StripeConnectOnboardingProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [status, setStatus] = useState<{
    connected: boolean;
    onboarded: boolean;
    payoutsEnabled: boolean;
    accountId?: string;
  } | null>(null);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-connect-status", {
        body: { producerId },
      });

      if (error) throw error;
      setStatus(data);
    } catch (error) {
      console.error("Error fetching status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (producerId) {
      fetchStatus();
    }
  }, [producerId]);

  // Check for connect success/refresh from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connect_success") === "true") {
      toast({
        title: "Stripe Connect Setup Complete",
        description: "Your account is now set up to receive automatic payouts!",
      });
      // Clear the URL params
      window.history.replaceState({}, "", window.location.pathname);
      fetchStatus();
    } else if (params.get("connect_refresh") === "true") {
      toast({
        title: "Continue Setup",
        description: "Please complete your Stripe Connect onboarding.",
        variant: "default",
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleStartOnboarding = async () => {
    setIsOnboarding(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-connect-onboard", {
        body: { producerId },
      });

      if (error) throw error;

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error starting onboarding:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start onboarding",
        variant: "destructive",
      });
      setIsOnboarding(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Stripe Connect - Automatic Payouts
        </CardTitle>
        <CardDescription>
          Connect your bank account to receive automatic payouts when projects are completed
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status?.onboarded ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <h4 className="font-medium text-green-800 dark:text-green-200">
                  Payouts Enabled
                </h4>
                <p className="text-sm text-green-600 dark:text-green-300">
                  Your Stripe Connect account is fully set up. You'll receive automatic payouts when projects complete.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                Account ID: {status.accountId?.substring(0, 12)}...
              </Badge>
              {status.payoutsEnabled && (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Payouts Active
                </Badge>
              )}
            </div>

            <Button variant="outline" size="sm" onClick={fetchStatus}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
          </div>
        ) : status?.connected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <AlertCircle className="h-8 w-8 text-amber-600" />
              <div>
                <h4 className="font-medium text-amber-800 dark:text-amber-200">
                  Onboarding Incomplete
                </h4>
                <p className="text-sm text-amber-600 dark:text-amber-300">
                  Your Stripe Connect account was created but onboarding isn't complete. Please continue the setup.
                </p>
              </div>
            </div>
            
            <Button onClick={handleStartOnboarding} disabled={isOnboarding}>
              {isOnboarding ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              Continue Setup
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Why connect your account?</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Receive automatic payouts when projects complete
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Funds deposited directly to your bank account
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  85% of project value (after 15% platform fee)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Secure setup powered by Stripe
                </li>
              </ul>
            </div>
            
            <Button onClick={handleStartOnboarding} disabled={isOnboarding} className="w-full">
              {isOnboarding ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              Set Up Automatic Payouts
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
