-- Add Stripe Connect account ID to producers table for automatic payouts
ALTER TABLE public.producers 
ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_connect_onboarded_at TIMESTAMPTZ;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_producers_stripe_connect ON public.producers(stripe_connect_account_id) WHERE stripe_connect_account_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.producers.stripe_connect_account_id IS 'Stripe Connect Express account ID for automatic payouts';
COMMENT ON COLUMN public.producers.stripe_connect_onboarded_at IS 'Timestamp when producer completed Stripe Connect onboarding';