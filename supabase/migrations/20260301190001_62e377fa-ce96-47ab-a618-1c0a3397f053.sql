ALTER TABLE public.song_requests
  ADD COLUMN IF NOT EXISTS bit_depth text DEFAULT '24',
  ADD COLUMN IF NOT EXISTS sample_rate text DEFAULT '44.1';