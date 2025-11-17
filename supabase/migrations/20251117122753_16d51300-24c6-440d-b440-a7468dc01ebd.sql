-- Add producer assignment fields to song_requests table
ALTER TABLE public.song_requests 
ADD COLUMN assigned_producer_id uuid REFERENCES public.producers(id),
ADD COLUMN genre_category text,
ADD COLUMN complexity_level text CHECK (complexity_level IN ('basic', 'standard', 'premium', 'custom'));

-- Create index for faster lookups
CREATE INDEX idx_song_requests_assigned_producer ON public.song_requests(assigned_producer_id);
CREATE INDEX idx_song_requests_genre ON public.song_requests(genre_category);