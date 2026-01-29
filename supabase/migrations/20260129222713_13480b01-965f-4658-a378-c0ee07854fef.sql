-- Add user_id and status columns to contact_submissions for tracking producer applications
ALTER TABLE public.contact_submissions 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS application_status text DEFAULT 'pending';

-- Create index for efficient lookup of producer applications
CREATE INDEX IF NOT EXISTS idx_contact_submissions_application 
ON public.contact_submissions(subject, application_status) 
WHERE subject = 'Producer Application';

-- Add RLS policy for admins to view and update applications
CREATE POLICY "Admins can view all contact submissions"
ON public.contact_submissions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update contact submissions"
ON public.contact_submissions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update INSERT policy to require authentication for producer applications
DROP POLICY IF EXISTS "Anyone can submit contact forms" ON public.contact_submissions;

-- Regular contact forms can still be submitted by anyone, but producer applications require auth
CREATE POLICY "Anyone can submit contact forms"
ON public.contact_submissions
FOR INSERT
WITH CHECK (
  -- Either it's not a producer application (general contact form)
  subject != 'Producer Application'
  OR
  -- Or it IS a producer application and user is authenticated with matching user_id
  (subject = 'Producer Application' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
);