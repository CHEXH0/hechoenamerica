-- Add client_feedback column to song_revisions for the feedback system
ALTER TABLE public.song_revisions
ADD COLUMN IF NOT EXISTS client_feedback TEXT DEFAULT NULL;