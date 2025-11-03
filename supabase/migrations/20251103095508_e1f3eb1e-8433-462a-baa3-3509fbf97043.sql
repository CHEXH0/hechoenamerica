-- Create platforms table
CREATE TABLE IF NOT EXISTS public.platforms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  icon text NOT NULL,
  url text NOT NULL,
  artist_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platforms ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Anyone can view platforms" 
ON public.platforms 
FOR SELECT 
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_platforms_updated_at
BEFORE UPDATE ON public.platforms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();