
-- Add column to track producers blocked from re-accepting a project (used in change producer workflow)
ALTER TABLE public.song_requests
ADD COLUMN blocked_producer_ids uuid[] DEFAULT '{}';

-- Add comment for clarity
COMMENT ON COLUMN public.song_requests.blocked_producer_ids IS 'Array of producer IDs blocked from accepting this project after being changed/removed';
