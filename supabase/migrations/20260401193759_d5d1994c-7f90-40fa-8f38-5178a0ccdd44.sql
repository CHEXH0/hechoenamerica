
ALTER TABLE public.purchases 
ADD COLUMN IF NOT EXISTS shipping_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS tracking_number text,
ADD COLUMN IF NOT EXISTS shipping_address text;
