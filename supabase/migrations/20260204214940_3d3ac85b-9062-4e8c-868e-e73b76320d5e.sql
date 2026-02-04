-- Allow users to delete their own purchases
CREATE POLICY "Users can delete their own purchases"
ON public.purchases
FOR DELETE
USING (auth.uid() = user_id);