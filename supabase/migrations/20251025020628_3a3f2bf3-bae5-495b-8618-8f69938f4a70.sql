-- Create song_requests table for better organization
CREATE TABLE public.song_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  song_idea text NOT NULL,
  tier text NOT NULL,
  price text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  file_urls text[] DEFAULT NULL,
  stripe_session_id text DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.song_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view their own song requests"
  ON public.song_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own requests
CREATE POLICY "Users can create their own song requests"
  ON public.song_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins and producers can view all requests
CREATE POLICY "Admins and producers can view all song requests"
  ON public.song_requests
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'producer'::app_role));

-- Admins and producers can update requests
CREATE POLICY "Admins and producers can update song requests"
  ON public.song_requests
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'producer'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_song_requests_updated_at
  BEFORE UPDATE ON public.song_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();