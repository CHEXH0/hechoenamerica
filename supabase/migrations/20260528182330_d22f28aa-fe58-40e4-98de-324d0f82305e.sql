UPDATE public.song_requests
SET producer_paid_at = NULL,
    stripe_transfer_id = NULL,
    payout_method = NULL
WHERE id = '33d769fc-f106-47a8-a41d-636d13c71792'
  AND stripe_transfer_id IS NULL;