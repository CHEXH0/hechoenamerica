
-- Add producer_checklist JSONB column to song_requests
-- This stores which add-on tasks the producer has completed
-- Example: {"mixing": true, "mastering": false, "stems": true, "analog": false, "base_production": true}
ALTER TABLE public.song_requests
ADD COLUMN producer_checklist jsonb DEFAULT '{}'::jsonb;

-- Add a comment for documentation
COMMENT ON COLUMN public.song_requests.producer_checklist IS 'Tracks producer completion of requested add-ons: base_production, mixing, mastering, stems, analog';
