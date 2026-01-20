-- Add DELETE policy for admins on song_requests table
CREATE POLICY "Admins can delete song requests" 
ON public.song_requests 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));