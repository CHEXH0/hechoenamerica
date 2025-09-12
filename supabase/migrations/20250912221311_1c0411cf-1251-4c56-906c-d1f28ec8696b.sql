-- Create purchases table to track user purchases
CREATE TABLE public.purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_type TEXT NOT NULL,
  product_category TEXT NOT NULL,
  price TEXT NOT NULL,
  purchase_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view their own purchases" 
ON public.purchases 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own purchases
CREATE POLICY "Users can create their own purchases" 
ON public.purchases 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_purchases_updated_at
BEFORE UPDATE ON public.purchases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();