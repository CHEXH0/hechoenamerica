-- Add status and download_url fields to purchases table
ALTER TABLE public.purchases 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'completed',
ADD COLUMN IF NOT EXISTS download_url text,
ADD COLUMN IF NOT EXISTS song_idea text,
ADD COLUMN IF NOT EXISTS file_urls text[];

-- Add index for faster status queries
CREATE INDEX IF NOT EXISTS idx_purchases_status ON public.purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_user_status ON public.purchases(user_id, status);

-- Add RLS policy for admins to view all purchases
CREATE POLICY "Admins can view all purchases"
ON public.purchases
FOR SELECT
USING (
  auth.jwt() ->> 'email' = 'hechoenamerica369@gmail.com'
);

-- Add RLS policy for admins to update purchases
CREATE POLICY "Admins can update purchases"
ON public.purchases
FOR UPDATE
USING (
  auth.jwt() ->> 'email' = 'hechoenamerica369@gmail.com'
);