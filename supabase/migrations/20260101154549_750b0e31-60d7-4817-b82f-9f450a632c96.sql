-- Create table to store producer Google OAuth tokens
CREATE TABLE public.producer_google_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.producer_google_tokens ENABLE ROW LEVEL SECURITY;

-- Producers can view their own tokens
CREATE POLICY "Producers can view their own tokens"
ON public.producer_google_tokens
FOR SELECT
USING (auth.uid() = user_id);

-- Producers can insert their own tokens
CREATE POLICY "Producers can insert their own tokens"
ON public.producer_google_tokens
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Producers can update their own tokens
CREATE POLICY "Producers can update their own tokens"
ON public.producer_google_tokens
FOR UPDATE
USING (auth.uid() = user_id);

-- Producers can delete their own tokens
CREATE POLICY "Producers can delete their own tokens"
ON public.producer_google_tokens
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_producer_google_tokens_updated_at
BEFORE UPDATE ON public.producer_google_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();