-- Add optional social media and website fields to producers table
ALTER TABLE producers
ADD COLUMN youtube_channel_url text,
ADD COLUMN instagram_url text,
ADD COLUMN website_url text;