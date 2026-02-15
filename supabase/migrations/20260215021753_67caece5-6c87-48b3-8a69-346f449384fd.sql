
-- Add Google Meet fields to song_revisions
ALTER TABLE public.song_revisions
ADD COLUMN wants_meeting boolean DEFAULT false,
ADD COLUMN meeting_link text;

-- Create revision messages table for chat
CREATE TABLE public.revision_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  revision_id uuid NOT NULL REFERENCES public.song_revisions(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_role text NOT NULL CHECK (sender_role IN ('client', 'producer')),
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.revision_messages ENABLE ROW LEVEL SECURITY;

-- Clients can view messages on their own revisions
CREATE POLICY "Users can view their revision messages"
ON public.revision_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM song_revisions sr
    JOIN song_requests req ON req.id = sr.song_request_id
    WHERE sr.id = revision_messages.revision_id
    AND req.user_id = auth.uid()
  )
);

-- Clients can send messages on their own revisions
CREATE POLICY "Users can send revision messages"
ON public.revision_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM song_revisions sr
    JOIN song_requests req ON req.id = sr.song_request_id
    WHERE sr.id = revision_messages.revision_id
    AND req.user_id = auth.uid()
  )
);

-- Producers can view messages on assigned projects
CREATE POLICY "Producers can view revision messages"
ON public.revision_messages
FOR SELECT
USING (
  has_role(auth.uid(), 'producer'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
);

-- Producers can send messages
CREATE POLICY "Producers can send revision messages"
ON public.revision_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  (has_role(auth.uid(), 'producer'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

-- Index for fast lookups
CREATE INDEX idx_revision_messages_revision_id ON public.revision_messages(revision_id);
CREATE INDEX idx_revision_messages_created_at ON public.revision_messages(created_at);
