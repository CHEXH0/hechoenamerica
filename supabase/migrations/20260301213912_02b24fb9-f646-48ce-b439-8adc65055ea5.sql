-- Add unique index on stripe_session_id for idempotency (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_purchases_stripe_session_unique 
ON public.purchases(stripe_session_id) 
WHERE stripe_session_id IS NOT NULL;