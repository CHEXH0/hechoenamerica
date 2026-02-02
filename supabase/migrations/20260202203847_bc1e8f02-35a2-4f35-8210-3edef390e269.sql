-- Add column to track when interview invite was sent
ALTER TABLE public.contact_submissions 
ADD COLUMN interview_invite_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;