-- Update policy to also include pending_payment status
DROP POLICY IF EXISTS "Users can cancel their own pre-acceptance requests" ON public.song_requests;

CREATE POLICY "Users can cancel their own pre-acceptance requests" 
ON public.song_requests 
FOR DELETE 
USING (auth.uid() = user_id AND status IN ('pending', 'pending_payment', 'paid'));