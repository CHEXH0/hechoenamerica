-- Add email field to producers table for notifications
ALTER TABLE public.producers 
ADD COLUMN IF NOT EXISTS email text;

-- Add a comment explaining the field
COMMENT ON COLUMN public.producers.email IS 'Producer email for project notifications';