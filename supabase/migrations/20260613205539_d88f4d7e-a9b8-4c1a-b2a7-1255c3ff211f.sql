GRANT SELECT (id, slug, name, image, country, genre, bio, spotify_url, youtube_url, apple_music_url, youtube_channel_url, instagram_url, website_url, showcase_video_1, showcase_video_2, showcase_video_3, emoji, created_at) ON public.producers TO anon;
GRANT SELECT (id, slug, name, image, country, genre, bio, spotify_url, youtube_url, apple_music_url, youtube_channel_url, instagram_url, website_url, showcase_video_1, showcase_video_2, showcase_video_3, emoji, created_at) ON public.producers TO authenticated;
GRANT SELECT ON public.producer_profiles TO anon;
GRANT SELECT ON public.producer_profiles TO authenticated;

DROP POLICY IF EXISTS "Public can view producer profiles" ON public.producers;
CREATE POLICY "Public can view producer profiles"
ON public.producers
FOR SELECT
TO anon, authenticated
USING (true);