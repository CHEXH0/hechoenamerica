-- Add payment tracking columns to song_requests
ALTER TABLE public.song_requests
ADD COLUMN IF NOT EXISTS payment_intent_id text,
ADD COLUMN IF NOT EXISTS acceptance_deadline timestamp with time zone,
ADD COLUMN IF NOT EXISTS platform_fee_cents integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS producer_payout_cents integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS refunded_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS producer_paid_at timestamp with time zone;

-- Create index for efficient deadline checking
CREATE INDEX IF NOT EXISTS idx_song_requests_acceptance_deadline 
ON public.song_requests(acceptance_deadline) 
WHERE status = 'pending' AND refunded_at IS NULL;

-- Create index for payment intent lookups
CREATE INDEX IF NOT EXISTS idx_song_requests_payment_intent 
ON public.song_requests(payment_intent_id) 
WHERE payment_intent_id IS NOT NULL;

-- Add comment explaining the payment flow
COMMENT ON COLUMN public.song_requests.payment_intent_id IS 'Stripe PaymentIntent ID for tracking the payment';
COMMENT ON COLUMN public.song_requests.acceptance_deadline IS 'Timestamp when auto-refund triggers if no producer accepts (48h after creation)';
COMMENT ON COLUMN public.song_requests.platform_fee_cents IS 'Platform fee in cents (e.g., 15% of total)';
COMMENT ON COLUMN public.song_requests.producer_payout_cents IS 'Amount to pay producer in cents (total - platform fee)';
COMMENT ON COLUMN public.song_requests.refunded_at IS 'Timestamp when payment was refunded';
COMMENT ON COLUMN public.song_requests.producer_paid_at IS 'Timestamp when producer was paid';