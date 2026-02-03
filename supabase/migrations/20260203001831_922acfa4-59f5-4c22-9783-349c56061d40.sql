-- Allow users to delete their own song requests if status is 'pending' (awaiting payment)
CREATE POLICY "Users can delete their own pending song requests" 
ON public.song_requests 
FOR DELETE 
USING (auth.uid() = user_id AND status = 'pending');