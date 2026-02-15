import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Mail, Lock, Trash2, Save } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useUpdateProfile, useDeleteAccount } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading } = useProfile(user?.id);
  const updateProfile = useUpdateProfile();
  const deleteAccount = useDeleteAccount();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [sendingResetEmail, setSendingResetEmail] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletionEmailSent, setDeletionEmailSent] = useState(false);
  const [deletionCode, setDeletionCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [sendingDeletionEmail, setSendingDeletionEmail] = useState(false);

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setBio(profile.bio || "");
    }
  }, [profile]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20 flex items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleUpdateProfile = () => {
    if (!user?.id) return;
    updateProfile.mutate({
      userId: user.id,
      updates: { display_name: displayName, bio }
    });
  };

  const handleSendPasswordResetEmail = async () => {
    if (!user?.email) return;
    
    setSendingResetEmail(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Password reset email sent!",
        description: "Check your email for a link to reset your password.",
        duration: 8000,
      });
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send password reset email.",
        variant: "destructive",
      });
    } finally {
      setSendingResetEmail(false);
    }
  };


  const handleSendDeletionVerification = async () => {
    if (!user?.email) return;
    setSendingDeletionEmail(true);
    try {
      // Generate a 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);

      await supabase.functions.invoke("send-contact-email", {
        body: {
          name: user.email,
          email: user.email,
          subject: "Account Deletion Verification",
          message: `Your account deletion verification code is: ${code}\n\nIf you did not request this, please ignore this email.`,
        },
      });

      setDeletionEmailSent(true);
      toast({
        title: "Verification email sent",
        description: "Please check your email for the 6-digit verification code.",
      });
    } catch (error) {
      console.error("Error sending deletion verification:", error);
      toast({
        title: "Error",
        description: "Failed to send verification email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSendingDeletionEmail(false);
    }
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmation !== "DELETE") {
      toast({
        title: "Confirmation required",
        description: "Please type DELETE to confirm account deletion.",
        variant: "destructive",
      });
      return;
    }
    if (!deletionEmailSent || deletionCode !== generatedCode) {
      toast({
        title: "Verification required",
        description: "Please enter the correct verification code from your email.",
        variant: "destructive",
      });
      return;
    }
    deleteAccount.mutate();
    setDeleteDialogOpen(false);
    setDeleteConfirmation("");
    setDeletionCode("");
    setDeletionEmailSent(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            className="mb-4 hover:bg-muted/50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
            Profile Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* Profile Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-muted/50 cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Email address cannot be changed after account activation.
                  </p>
                </div>
                <div>
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your display name"
                  />
                </div>
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself"
                    rows={3}
                  />
                </div>
                <Button 
                  onClick={handleUpdateProfile}
                  disabled={updateProfile.isPending}
                  className="w-full"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {updateProfile.isPending ? "Saving..." : "Save Profile"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Password Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Change Password
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  For security reasons, password changes require email verification. 
                  Click below to receive a password reset link.
                </p>
                <Button 
                  onClick={handleSendPasswordResetEmail}
                  disabled={sendingResetEmail}
                  className="w-full"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {sendingResetEmail ? "Sending..." : "Send Password Reset Email"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Danger Zone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <Trash2 className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-red-600 dark:text-red-400">Delete Account</h3>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                  </div>
                  <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
                    setDeleteDialogOpen(open);
                    if (!open) setDeleteConfirmation("");
                  }}>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-4">
                          <p>
                            This action cannot be undone. This will permanently delete your account
                            and remove all your data from our servers, including:
                          </p>
                          <ul className="list-disc pl-5 text-sm space-y-1">
                            <li>Your profile information</li>
                            <li>All purchases and order history</li>
                            <li>Song requests and project files</li>
                            <li>Any uploaded files in storage</li>
                          </ul>
                          <div className="pt-4 space-y-4">
                            {!deletionEmailSent ? (
                              <Button
                                onClick={handleSendDeletionVerification}
                                disabled={sendingDeletionEmail}
                                variant="outline"
                                className="w-full"
                              >
                                <Mail className="mr-2 h-4 w-4" />
                                {sendingDeletionEmail ? "Sending..." : "Send Verification Code to Email"}
                              </Button>
                            ) : (
                              <>
                                <div>
                                  <Label htmlFor="deletionCode" className="text-foreground font-medium">
                                    Enter the 6-digit code sent to your email:
                                  </Label>
                                  <Input
                                    id="deletionCode"
                                    value={deletionCode}
                                    onChange={(e) => setDeletionCode(e.target.value)}
                                    placeholder="Enter 6-digit code"
                                    className="mt-2"
                                    maxLength={6}
                                    autoComplete="off"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="deleteConfirm" className="text-foreground font-medium">
                                    Type <span className="font-bold text-red-600">DELETE</span> to confirm:
                                  </Label>
                                  <Input
                                    id="deleteConfirm"
                                    value={deleteConfirmation}
                                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                                    placeholder="Type DELETE here"
                                    className="mt-2"
                                    autoComplete="off"
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <Button
                          onClick={handleDeleteAccount}
                          disabled={!deletionEmailSent || deleteConfirmation !== "DELETE" || deletionCode !== generatedCode || deleteAccount.isPending}
                          variant="destructive"
                        >
                          {deleteAccount.isPending ? "Deleting..." : "Delete Account"}
                        </Button>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;