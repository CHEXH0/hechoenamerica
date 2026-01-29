import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, Music, Globe, Instagram, Youtube, ExternalLink, Send, Loader2, CheckCircle, LogIn } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const GENRE_OPTIONS = [
  "Hip-Hop/Rap",
  "R&B/Soul",
  "Pop",
  "Electronic/EDM",
  "Latin/Reggaeton",
  "Rock/Alternative",
  "Country",
  "Jazz/Blues",
  "Classical/Orchestral",
  "Afrobeats",
  "Dancehall/Caribbean",
  "Gospel/Christian",
];

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  email: z.string().email("Please enter a valid email address"),
  country: z.string().min(2, "Please enter your location").max(100, "Location must be less than 100 characters"),
  genres: z.array(z.string()).min(1, "Please select at least 1 genre").max(3, "You can only select up to 3 genres"),
  bio: z.string().min(50, "Bio must be at least 50 characters").max(1000, "Bio must be less than 1000 characters"),
  spotify_url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  youtube_url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  apple_music_url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  instagram_url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  website_url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
}).refine((data) => {
  // At least one link must be provided
  return data.spotify_url || data.youtube_url || data.apple_music_url || data.instagram_url || data.website_url;
}, {
  message: "Please provide at least one social or platform link",
  path: ["spotify_url"],
});

type FormData = z.infer<typeof formSchema>;

const ProducerApplicationForm = () => {
  const { user, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      country: "",
      genres: [],
      bio: "",
      spotify_url: "",
      youtube_url: "",
      apple_music_url: "",
      instagram_url: "",
      website_url: "",
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageError(null);
    
    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setImageError("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setImageError("Image must be less than 5MB");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: FormData) => {
    if (!imageFile) {
      setImageError("Please upload a brand image");
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload image to storage
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `applications/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, imageFile);

      if (uploadError) {
        throw new Error("Failed to upload image");
      }

      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      // Submit the application to contact_submissions with user_id for record keeping
      const applicationData = {
        name: data.name,
        email: data.email,
        subject: "Producer Application",
        country: data.country,
        user_id: user?.id, // Link application to authenticated user
        message: JSON.stringify({
          type: "producer_application",
          genres: data.genres,
          bio: data.bio,
          image_url: publicUrlData.publicUrl,
          spotify_url: data.spotify_url || null,
          youtube_url: data.youtube_url || null,
          apple_music_url: data.apple_music_url || null,
          instagram_url: data.instagram_url || null,
          website_url: data.website_url || null,
        }),
      };

      const { error: submitError } = await supabase
        .from('contact_submissions')
        .insert([applicationData]);

      if (submitError) {
        throw submitError;
      }

      // Send email notification via edge function
      const { error: emailError } = await supabase.functions.invoke('send-contact-email', {
        body: {
          isProducerApplication: true,
          name: data.name,
          email: data.email,
          country: data.country,
          genres: data.genres,
          bio: data.bio,
          imageUrl: publicUrlData.publicUrl,
          spotifyUrl: data.spotify_url || undefined,
          youtubeUrl: data.youtube_url || undefined,
          appleMusicUrl: data.apple_music_url || undefined,
          instagramUrl: data.instagram_url || undefined,
          websiteUrl: data.website_url || undefined,
        },
      });

      if (emailError) {
        console.error("Email notification failed:", emailError);
        // Don't fail the submission if email fails, the data is already saved
      }

      setIsSubmitted(true);
      toast({
        title: "Application Submitted! 🎉",
        description: "Check your email for confirmation. We'll be in touch soon!",
      });
    } catch (error) {
      console.error("Error submitting application:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedGenres = form.watch("genres");

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mt-20"
      >
        <Card className="bg-gradient-to-br from-purple-900/50 via-pink-900/30 to-red-900/50 border-purple-500/40 backdrop-blur-md max-w-4xl mx-auto">
          <CardContent className="py-16 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
              className="mb-6"
            >
              <CheckCircle className="h-20 w-20 text-green-400 mx-auto" />
            </motion.div>
            <h3 className="text-3xl font-bold text-white mb-4">Application Received!</h3>
            <p className="text-gray-300 text-lg max-w-md mx-auto mb-6">
              Thank you for your interest in joining our producer network! Check your email for a confirmation with next steps.
            </p>
            <div className="bg-indigo-900/30 border border-indigo-500/40 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-indigo-300 text-sm flex items-center justify-center gap-2">
                <span className="text-xl">💬</span>
                <span>
                  <strong>Note:</strong> If approved, you'll use Discord to receive and accept projects from artists.
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Show login prompt if user is not authenticated
  if (!authLoading && !user) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-20"
      >
        <Card className="bg-gradient-to-br from-purple-900/50 via-pink-900/30 to-red-900/50 border-purple-500/40 backdrop-blur-md max-w-4xl mx-auto">
          <CardContent className="py-16 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
              className="mb-6"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto border border-purple-500/30">
                <LogIn className="h-12 w-12 text-purple-400" />
              </div>
            </motion.div>
            
            <h2 className="text-3xl font-bold text-white mb-4">
              Sign In Required
            </h2>
            <p className="text-gray-300 text-lg max-w-md mx-auto mb-8">
              You need to be signed in to submit a producer application. This helps us link your application to your account.
            </p>
            
            <Link to="/auth?redirect=/producer-application">
              <Button
                size="lg"
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white"
              >
                <LogIn className="h-5 w-5 mr-2" />
                Sign In to Apply
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.8 }}
      className="mt-20"
    >
      <Card className="bg-gradient-to-br from-purple-900/50 via-pink-900/30 to-red-900/50 border-purple-500/40 backdrop-blur-md max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent mb-4">
            Become a Producer
          </CardTitle>
          <CardDescription className="text-gray-800 text-lg leading-relaxed max-w-2xl mx-auto">
            Join our network of talented producers. Fill out the application below and we'll review your submission.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-6 md:px-12 pb-10">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Basic Info Section */}
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Producer/Artist Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Your stage name or brand"
                          className="bg-black/50 border-purple-500/80 text-white placeholder:text-gray-400"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Email *</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="your@email.com"
                          className="bg-black/50 border-purple-500/80 text-white placeholder:text-gray-400"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Location *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="City, Country (e.g., Los Angeles, USA)"
                        className="bg-black/50 border-purple-500/80 text-white placeholder:text-gray-400"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-gray-700">
                      Where you're primarily based
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Genres Section */}
              <FormField
                control={form.control}
                name="genres"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-white">Main Genres * (Select up to 3)</FormLabel>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-2">
                      {GENRE_OPTIONS.map((genre) => (
                        <FormField
                          key={genre}
                          control={form.control}
                          name="genres"
                          render={({ field }) => {
                            const isSelected = field.value?.includes(genre);
                            const isDisabled = selectedGenres.length >= 3 && !isSelected;
                            
                            return (
                              <FormItem
                                key={genre}
                                className="flex items-center space-x-2 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={isSelected}
                                    disabled={isDisabled}
                                    onCheckedChange={(checked) => {
                                      const newValue = checked
                                        ? [...field.value, genre]
                                        : field.value?.filter((value) => value !== genre);
                                      field.onChange(newValue);
                                    }}
                                    className="border-purple-500/100 data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500"
                                  />
                                </FormControl>
                                <Label
                                  className={`text-sm cursor-pointer ${
                                    isDisabled ? "text-gray-700" : "text-gray-600"
                                  }`}
                                >
                                  {genre}
                                </Label>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Bio Section */}
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Bio *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about yourself, your experience, style, and what makes you unique as a producer..."
                        className="bg-black/50 border-purple-500/80 text-white placeholder:text-gray-400 min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-gray-700">
                      {field.value?.length || 0}/1000 characters (minimum 50)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Image Upload Section */}
              <div className="space-y-2">
                <Label className="text-white">Brand Image *</Label>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div
                      className={`bg-black/50 relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        imageError
                          ? "border-red-500/50 bg-red-900/10"
                          : "border-purple-500/80 bg-black/20 hover:border-pink-400/100"
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-300 mb-1">Click or drag to upload</p>
                      <p className="text-gray-400 text-sm">PNG, JPG up to 5MB</p>
                    </div>
                    {imageError && (
                      <p className="text-red-400 text-sm mt-2">{imageError}</p>
                    )}
                  </div>
                  
                  {imagePreview && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-32 h-32 rounded-lg overflow-hidden border-2 border-pink-500/50"
                    >
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                  )}
                </div>
                <p className="text-gray-700 text-sm">
                  Upload a logo, photo, or image that represents your brand
                </p>
              </div>

              {/* Social Links Section */}
              <div className="space-y-4">
                <div>
                  <Label className="text-white text-lg">Platform Links *</Label>
                  <p className="text-gray-700 text-sm mt-1">
                    Provide at least one link to your music or social profile
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="spotify_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-600 flex items-center gap-2">
                          <Music className="h-4 w-4 text-green-400" />
                          Spotify
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://open.spotify.com/artist/..."
                            className="bg-black/50 border-purple-500/80 text-white placeholder:text-gray-400"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="youtube_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-600 flex items-center gap-2">
                          <Youtube className="h-4 w-4 text-red-400" />
                          YouTube
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://youtube.com/c/..."
                            className="bg-black/50 border-purple-500/80 text-white placeholder:text-gray-400"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="apple_music_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-600 flex items-center gap-2">
                          <Music className="h-4 w-4 text-pink-400" />
                          Apple Music
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://music.apple.com/..."
                            className="bg-black/50 border-purple-500/80 text-white placeholder:text-gray-400"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="instagram_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-600 flex items-center gap-2">
                          <Instagram className="h-4 w-4 text-purple-400" />
                          Instagram
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://instagram.com/..."
                            className="bg-black/50 border-purple-500/80 text-white placeholder:text-gray-400"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="website_url"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-gray-600 flex items-center gap-2">
                          <Globe className="h-4 w-4 text-blue-400" />
                          Website
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://yourwebsite.com"
                            className="bg-black/50 border-purple-500/80 text-white placeholder:text-gray-400"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white border-0 py-6 text-lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5 mr-2" />
                        Submit Application
                      </>
                    )}
                  </Button>
                </motion.div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProducerApplicationForm;
