-- Add discord_user_id column to producers table
ALTER TABLE public.producers 
ADD COLUMN discord_user_id text UNIQUE;

-- Add an index for faster lookups
CREATE INDEX idx_producers_discord_user_id ON public.producers(discord_user_id);