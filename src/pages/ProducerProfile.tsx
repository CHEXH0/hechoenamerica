import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  User, 
  Save, 
  Upload,
  Music,
  Youtube,
  Globe,
  Instagram,
  MessageCircle,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { 
  useProducerProfile, 
  useUpdateProducerProfile,
  useUploadProducerImage
} from "@/hooks/useProducerProfile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const GENRE_OPTIONS = [
  { value: "hip-hop", label: "Hip-Hop / Trap / Rap" },
  { value: "rnb", label: "R&B / Soul" },
  { value: "latin", label: "Latin / Reggaeton" },
] as const;

const ProducerProfile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: roleData, isLoading: roleLoading } = useUserRole();
  const { data: producerProfile, isLoading: profileLoading } = useProducerProfile();
  const updateProfile = useUpdateProducerProfile();
  const uploadImage = useUploadProducerImage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [genre, setGenre] = useState("");
  const [bio, setBio] = useState("");
  const [image, setImage] = useState("");
  const [discordUserId, setDiscordUserId] = useState("");
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [appleMusicUrl, setAppleMusicUrl] = useState("");
  const [youtubeChannelUrl, setYoutubeChannelUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  // Populate form when profile loads
  useEffect(() => {
    if (producerProfile) {
      setName(producerProfile.name || "");
      setCountry(producerProfile.country || "");
      setGenre(producerProfile.genre || "");
      setBio(producerProfile.bio || "");
      setImage(producerProfile.image || "");
      setDiscordUserId(producerProfile.discord_user_id || "");
      setSpotifyUrl(producerProfile.spotify_url || "");
      setYoutubeUrl(producerProfile.youtube_url || "");
      setAppleMusicUrl(producerProfile.apple_music_url || "");
      setYoutubeChannelUrl(producerProfile.youtube_channel_url || "");
      setInstagramUrl(producerProfile.instagram_url || "");
      setWebsiteUrl(producerProfile.website_url || "");
    }
  }, [producerProfile]);

  const isLoading = authLoading || roleLoading || profileLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20 flex items-center justify-center">
        <div className="space-y-4 w-full max-w-2xl px-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (!roleData?.isProducer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You need producer permissions to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!producerProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Producer Profile Found</CardTitle>
            <CardDescription>
              Your account email ({user.email}) doesn't match any producer record. 
              Please contact an admin to set up your producer profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = await uploadImage.mutateAsync(file);
    setImage(imageUrl);
  };

  const handleSave = () => {
    updateProfile.mutate({
      name,
      country,
      genre,
      bio,
      image,
      discord_user_id: discordUserId || null,
      spotify_url: spotifyUrl || null,
      youtube_url: youtubeUrl || null,
      apple_music_url: appleMusicUrl || null,
      youtube_channel_url: youtubeChannelUrl || null,
      instagram_url: instagramUrl || null,
      website_url: websiteUrl || null,
    });
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
            Producer Profile
          </h1>
          <p className="text-muted-foreground">
            Manage your public producer profile and social links
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* Profile Image & Basic Info */}
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
              <CardContent className="space-y-6">
                {/* Image Upload */}
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24 border-2 border-border">
                    <AvatarImage src={image} alt={producerProfile.name} />
                    <AvatarFallback className="text-2xl">
                      {producerProfile.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadImage.isPending}
                    >
                      {uploadImage.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      Upload Photo
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG or GIF. Max 5MB.
                    </p>
                  </div>
                </div>

                {/* Editable fields */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your producer name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Your country"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="genre">Genre</Label>
                  <Select value={genre} onValueChange={setGenre}>
                    <SelectTrigger id="genre">
                      <SelectValue placeholder="Select your primary genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENRE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Editable Bio */}
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell listeners about yourself, your style, and your experience..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Discord Integration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Discord Integration
                </CardTitle>
                <CardDescription>
                  Link your Discord account to receive project notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="discordUserId">Discord User ID</Label>
                  <Input
                    id="discordUserId"
                    value={discordUserId}
                    onChange={(e) => setDiscordUserId(e.target.value)}
                    placeholder="e.g., 1234567890123456789"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enable Developer Mode in Discord, right-click your profile, and copy your ID.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Social Links
                </CardTitle>
                <CardDescription>
                  Add your social media profiles and streaming links
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="spotifyUrl" className="flex items-center gap-2">
                    <Music className="h-4 w-4 text-green-500" />
                    Spotify URL
                  </Label>
                  <Input
                    id="spotifyUrl"
                    value={spotifyUrl}
                    onChange={(e) => setSpotifyUrl(e.target.value)}
                    placeholder="https://open.spotify.com/artist/..."
                  />
                </div>

                <div>
                  <Label htmlFor="appleMusicUrl" className="flex items-center gap-2">
                    <Music className="h-4 w-4 text-pink-500" />
                    Apple Music URL
                  </Label>
                  <Input
                    id="appleMusicUrl"
                    value={appleMusicUrl}
                    onChange={(e) => setAppleMusicUrl(e.target.value)}
                    placeholder="https://music.apple.com/artist/..."
                  />
                </div>

                <Separator />

                <div>
                  <Label htmlFor="youtubeUrl" className="flex items-center gap-2">
                    <Youtube className="h-4 w-4 text-red-500" />
                    YouTube Video URL
                  </Label>
                  <Input
                    id="youtubeUrl"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>

                <div>
                  <Label htmlFor="youtubeChannelUrl" className="flex items-center gap-2">
                    <Youtube className="h-4 w-4 text-red-500" />
                    YouTube Channel URL
                  </Label>
                  <Input
                    id="youtubeChannelUrl"
                    value={youtubeChannelUrl}
                    onChange={(e) => setYoutubeChannelUrl(e.target.value)}
                    placeholder="https://youtube.com/@channel"
                  />
                </div>

                <Separator />

                <div>
                  <Label htmlFor="instagramUrl" className="flex items-center gap-2">
                    <Instagram className="h-4 w-4 text-purple-500" />
                    Instagram URL
                  </Label>
                  <Input
                    id="instagramUrl"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="https://instagram.com/username"
                  />
                </div>

                <div>
                  <Label htmlFor="websiteUrl" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Website URL
                  </Label>
                  <Input
                    id="websiteUrl"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Save Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              onClick={handleSave}
              disabled={updateProfile.isPending}
              className="w-full"
              size="lg"
            >
              {updateProfile.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {updateProfile.isPending ? "Saving..." : "Save All Changes"}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProducerProfile;
