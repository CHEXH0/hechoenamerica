-- Drop the existing policy and create a new one that covers both pending and paid statuses
DROP POLICY IF EXISTS "Users can delete their own pending song requests" ON public.song_requests;

CREATE POLICY "Users can cancel their own pre-acceptance requests" 
ON public.song_requests 
FOR DELETE 
USING (auth.uid() = user_id AND status IN ('pending', 'paid'));