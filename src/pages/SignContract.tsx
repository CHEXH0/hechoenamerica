import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, FileText, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ContractProject {
  id: string;
  full_name: string;
  email: string;
  address: string | null;
  price: string;
  terms: string | null;
  details: string | null;
  number_of_revisions: number;
  contract_signed: boolean;
  contract_signed_at: string | null;
  contract_signature_name: string | null;
}

const SignContract = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { toast } = useToast();

  const [project, setProject] = useState<ContractProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [signed, setSigned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) fetchContract();
    else setError("Invalid contract link");
  }, [token]);

  const fetchContract = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("sign-hea-contract", {
        body: { token, action: "fetch" },
      });

      if (error || !data?.success) {
        setError("Contract not found or link has expired.");
        return;
      }

      setProject(data.project);
      if (data.project.contract_signed) setSigned(true);
    } catch (err) {
      setError("Failed to load contract.");
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (!signatureName.trim() || signatureName.trim().length < 2) {
      toast({ title: "Error", description: "Please type your full legal name", variant: "destructive" });
      return;
    }

    setSigning(true);
    try {
      const { data, error } = await supabase.functions.invoke("sign-hea-contract", {
        body: { token, action: "sign", signatureName: signatureName.trim() },
      });

      if (error || !data?.success) throw new Error(data?.error || "Failed to sign");

      setSigned(true);
      toast({ title: "Contract Signed!", description: "Your contract has been signed successfully." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Contract Not Found</h2>
            <p className="text-muted-foreground">{error || "This contract link is invalid."}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            HECHO EN AMERICA
          </h1>
          <p className="text-muted-foreground mt-1">Music Production Contract</p>
        </div>

        {/* Contract Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Project Agreement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Client Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Client</p>
                <p className="font-medium">{project.full_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{project.email}</p>
              </div>
              {project.address && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{project.address}</p>
                </div>
              )}
            </div>

            {/* Receipt */}
            <div className="border rounded-lg p-4 space-y-3">
              <h3 className="font-semibold">Receipt</h3>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Music Production Services</span>
                <span className="font-medium">${project.price}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Included Revisions</span>
                <span className="font-medium">{project.number_of_revisions}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-2">
                <span className="font-bold">Total</span>
                <span className="font-bold text-lg">${project.price}</span>
              </div>
            </div>

            {/* Scope */}
            {project.details && (
              <div>
                <h3 className="font-semibold mb-2">Scope of Work</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.details}</p>
              </div>
            )}

            {/* Terms */}
            {project.terms && (
              <div>
                <h3 className="font-semibold mb-2">Terms & Conditions</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.terms}</p>
              </div>
            )}

            {/* Signature Section */}
            <div className="border-t pt-6">
              {signed ? (
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-500 px-4 py-2 rounded-lg">
                    <Check className="h-5 w-5" />
                    <span className="font-semibold">Contract Signed</span>
                  </div>
                  {project.contract_signature_name && (
                    <p className="text-muted-foreground text-sm">
                      Signed by: <span className="font-medium italic text-foreground">{project.contract_signature_name}</span>
                    </p>
                  )}
                  {project.contract_signed_at && (
                    <p className="text-muted-foreground text-xs">
                      on {new Date(project.contract_signed_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold">Electronic Signature</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      By typing your full legal name below and clicking "Sign Contract", you agree to the terms outlined above.
                    </p>
                    <Input
                      value={signatureName}
                      onChange={(e) => setSignatureName(e.target.value)}
                      placeholder="Type your full legal name"
                      className="text-lg italic"
                    />
                  </div>
                  <Button
                    onClick={handleSign}
                    disabled={signing || !signatureName.trim()}
                    className="w-full"
                    size="lg"
                  >
                    {signing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Signing...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Sign Contract
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Hecho En America Studio. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default SignContract;
