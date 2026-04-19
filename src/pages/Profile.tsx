import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Mail, Lock, Trash2, Save, Camera } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useUpdateProfile, useDeleteAccount } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import AvatarCropper from "@/components/AvatarCropper";
import { useTranslation } from "@/contexts/TranslationContext";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading } = useProfile(user?.id);
  const updateProfile = useUpdateProfile();
  const deleteAccount = useDeleteAccount();
  const { t } = useTranslation();
  const tp = t.profile;

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [sendingResetEmail, setSendingResetEmail] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletionEmailSent, setDeletionEmailSent] = useState(false);
  const [deletionCode, setDeletionCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [sendingDeletionEmail, setSendingDeletionEmail] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.match(/^image\/(jpeg|png)$/)) {
      toast({ title: tp.invalidFileTitle, description: tp.invalidFileDesc, variant: "destructive" });
      return;
    }
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB Supabase free tier limit
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: tp.fileTooLargeTitle, description: tp.fileTooLargeDesc, variant: "destructive" });
      return;
    }
    setSelectedFile(file);
    setCropperOpen(true);
    e.target.value = "";
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!user?.id) return;
    setCropperOpen(false);
    setUploadingAvatar(true);
    try {
      const fileName = `avatars/${user.id}-${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, croppedBlob, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName);

      updateProfile.mutate({
        userId: user.id,
        updates: { avatar_url: urlData.publicUrl }
      });
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast({ title: tp.uploadFailedTitle, description: tp.uploadFailedDesc, variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
      setSelectedFile(null);
    }
  };

  const handleUpdateProfile = () => {
    if (!user?.id) return;
    updateProfile.mutate(
      { userId: user.id, updates: { display_name: displayName, bio } },
      {
        onSuccess: () => {
          toast({ title: tp.profileUpdatedTitle, description: tp.profileUpdatedDesc });
        },
      }
    );
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
        title: tp.passwordResetSentTitle,
        description: tp.passwordResetSentDesc,
        duration: 8000,
      });
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: tp.errorTitle,
        description: error instanceof Error ? error.message : tp.passwordResetFailedDesc,
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
        title: tp.verificationSentTitle,
        description: tp.verificationSentDesc,
      });
    } catch (error) {
      console.error("Error sending deletion verification:", error);
      toast({
        title: tp.errorTitle,
        description: tp.verificationFailedDesc,
        variant: "destructive",
      });
    } finally {
      setSendingDeletionEmail(false);
    }
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmation !== "DELETE") {
      toast({
        title: tp.confirmRequiredTitle,
        description: tp.confirmRequiredDesc,
        variant: "destructive",
      });
      return;
    }
    if (!deletionEmailSent || deletionCode !== generatedCode) {
      toast({
        title: tp.verificationRequiredTitle,
        description: tp.verificationRequiredDesc,
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
            {tp.backToHome}
          </Button>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
            {tp.pageTitle}
          </h1>
          <p className="text-muted-foreground">
            {tp.pageSubtitle}
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
                  {tp.profileInfoTitle}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Avatar Upload */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative group">
                    <Avatar className="h-24 w-24">
                      {profile?.avatar_url && (
                        <AvatarImage src={profile.avatar_url} alt="Profile" />
                      )}
                      <AvatarFallback className="bg-muted text-muted-foreground text-2xl">
                        <User className="h-10 w-10" />
                      </AvatarFallback>
                    </Avatar>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                    >
                      <Camera className="h-6 w-6 text-white" />
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? tp.uploading : tp.changePhoto}
                  </Button>
                </div>
                <div>
                  <Label htmlFor="email">{tp.emailLabel}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-muted/50 cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {tp.emailCannotChange}
                  </p>
                </div>
                <div>
                  <Label htmlFor="displayName">{tp.displayNameLabel}</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={tp.displayNamePlaceholder}
                  />
                </div>
                <div>
                  <Label htmlFor="bio">{tp.bioLabel}</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder={tp.bioPlaceholder}
                    rows={3}
                  />
                </div>
                <Button 
                  onClick={handleUpdateProfile}
                  disabled={updateProfile.isPending}
                  className="w-full"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {updateProfile.isPending ? tp.saving : tp.saveProfile}
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
                  {tp.changePasswordTitle}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <p className="text-sm text-muted-foreground">
                   {tp.passwordResetIntro}
                 </p>
                <Button 
                  onClick={handleSendPasswordResetEmail}
                  disabled={sendingResetEmail}
                  className="w-full"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {sendingResetEmail ? tp.sending : tp.sendPasswordResetEmail}
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
                  {tp.dangerZone}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-red-600 dark:text-red-400">{tp.deleteAccount}</h3>
                     <p className="text-sm text-muted-foreground">
                       {tp.deleteAccountDesc}
                     </p>
                  </div>
                  <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
                    setDeleteDialogOpen(open);
                    if (!open) setDeleteConfirmation("");
                  }}>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        {tp.deleteAccount}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{tp.deleteDialogTitle}</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-4">
                           <p>
                             {tp.deleteDialogIntro}
                           </p>
                          <ul className="list-disc pl-5 text-sm space-y-1">
                            <li>{tp.deleteListProfile}</li>
                            <li>{tp.deleteListPurchases}</li>
                            <li>{tp.deleteListSongRequests}</li>
                            <li>{tp.deleteListFiles}</li>
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
                                {sendingDeletionEmail ? tp.sending : tp.sendVerificationCode}
                              </Button>
                            ) : (
                              <>
                                <div>
                                  <Label htmlFor="deletionCode" className="text-foreground font-medium">
                                    {tp.enterCodeLabel}
                                  </Label>
                                  <Input
                                    id="deletionCode"
                                    value={deletionCode}
                                    onChange={(e) => setDeletionCode(e.target.value)}
                                    placeholder={tp.codePlaceholder}
                                    className="mt-2"
                                    maxLength={6}
                                    autoComplete="off"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="deleteConfirm" className="text-foreground font-medium">
                                    {tp.typeDeleteLabel}
                                  </Label>
                                  <Input
                                    id="deleteConfirm"
                                    value={deleteConfirmation}
                                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                                    placeholder={tp.typeDeletePlaceholder}
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
                        <AlertDialogCancel>{tp.cancel}</AlertDialogCancel>
                        <Button
                          onClick={handleDeleteAccount}
                          disabled={!deletionEmailSent || deleteConfirmation !== "DELETE" || deletionCode !== generatedCode || deleteAccount.isPending}
                          variant="destructive"
                        >
                          {deleteAccount.isPending ? tp.deleting : tp.deleteAccount}
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
      <AvatarCropper
        open={cropperOpen}
        onClose={() => { setCropperOpen(false); setSelectedFile(null); }}
        imageFile={selectedFile}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};

export default Profile;