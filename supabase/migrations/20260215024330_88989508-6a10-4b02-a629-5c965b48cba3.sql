
-- Add showcase video columns to producers table (up to 3 videos)
ALTER TABLE public.producers
ADD COLUMN showcase_video_1 text,
ADD COLUMN showcase_video_2 text,
ADD COLUMN showcase_video_3 text;
