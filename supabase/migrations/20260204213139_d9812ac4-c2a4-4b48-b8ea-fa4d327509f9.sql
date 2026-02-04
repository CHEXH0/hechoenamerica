-- Add policy to allow authenticated users to download product assets they have purchased
CREATE POLICY "Users can download purchased product assets"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'product-assets'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.purchases
    WHERE purchases.user_id = auth.uid()
    AND purchases.product_id = (storage.foldername(name))[1]
    AND purchases.status = 'completed'
  )
);