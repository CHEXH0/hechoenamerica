DROP VIEW IF EXISTS public.producer_profiles;

CREATE VIEW public.producer_profiles AS
SELECT
  id,
  slug,
  name,
  image,
  country,
  genre,
  bio,
  spotify_url,
  youtube_url,
  apple_music_url,
  youtube_channel_url,
  instagram_url,
  website_url,
  showcase_video_1,
  showcase_video_2,
  showcase_video_3,
  emoji,
  created_at
FROM public.producers;