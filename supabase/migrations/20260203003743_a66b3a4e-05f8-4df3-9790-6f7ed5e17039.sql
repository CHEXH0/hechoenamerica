-- Create table to track individual revisions for song requests
CREATE TABLE public.song_revisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  song_request_id UUID NOT NULL REFERENCES public.song_requests(id) ON DELETE CASCADE,
  revision_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'requested', 'in_progress', 'delivered')),
  requested_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  drive_folder_id TEXT,
  drive_link TEXT,
  client_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(song_request_id, revision_number)
);

-- Enable RLS
ALTER TABLE public.song_revisions ENABLE ROW LEVEL SECURITY;

-- Users can view revisions for their own song requests
CREATE POLICY "Users can view their own revisions"
ON public.song_revisions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.song_requests sr 
    WHERE sr.id = song_request_id AND sr.user_id = auth.uid()
  )
);

-- Users can update their own revisions (for requesting)
CREATE POLICY "Users can request their own revisions"
ON public.song_revisions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.song_requests sr 
    WHERE sr.id = song_request_id AND sr.user_id = auth.uid()
  )
);

-- Admins and producers can view all revisions
CREATE POLICY "Admins and producers can view all revisions"
ON public.song_revisions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'producer'::app_role));

-- Admins and producers can update revisions (for delivering)
CREATE POLICY "Admins and producers can update revisions"
ON public.song_revisions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'producer'::app_role));

-- Admins can insert revisions
CREATE POLICY "Admins can insert revisions"
ON public.song_revisions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_song_revisions_updated_at
BEFORE UPDATE ON public.song_revisions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_song_revisions_request ON public.song_revisions(song_request_id);
CREATE INDEX idx_song_revisions_status ON public.song_revisions(status);