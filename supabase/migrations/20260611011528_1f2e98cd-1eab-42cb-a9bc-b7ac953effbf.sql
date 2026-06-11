ALTER TABLE public.song_requests
ADD COLUMN IF NOT EXISTS producer_paid_out_cents integer NOT NULL DEFAULT 0;