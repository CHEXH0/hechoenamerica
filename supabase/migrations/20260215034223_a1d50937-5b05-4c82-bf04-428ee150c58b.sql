
-- Create a public view with only safe fields (no email, stripe, discord)
CREATE VIEW public.producer_profiles
WITH (security_invoker = on) AS
SELECT id, slug, name, image, country, genre, bio,
       spotify_url, youtube_url, apple_music_url,
       youtube_channel_url, instagram_url, website_url,
       showcase_video_1, showcase_video_2, showcase_video_3,
       created_at
FROM public.producers;

-- Drop the overly permissive public SELECT policy
DROP POLICY "Anyone can view artists" ON public.producers;

-- Replace with authenticated-only SELECT (producers/admins already have their own policies)
CREATE POLICY "Authenticated users can view producers"
ON public.producers FOR SELECT
USING (auth.uid() IS NOT NULL);
