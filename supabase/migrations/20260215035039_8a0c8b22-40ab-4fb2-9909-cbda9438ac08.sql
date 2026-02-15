
-- Add stripe_session_id to purchases for idempotency
ALTER TABLE public.purchases ADD COLUMN stripe_session_id text;

-- Add unique constraint to prevent duplicate processing
CREATE UNIQUE INDEX idx_purchases_stripe_session_id ON public.purchases (stripe_session_id) WHERE stripe_session_id IS NOT NULL;
