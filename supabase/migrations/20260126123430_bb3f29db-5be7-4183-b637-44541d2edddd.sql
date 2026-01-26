-- Allow authenticated users to upload producer application images
CREATE POLICY "Authenticated users can upload application images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images' AND (storage.foldername(name))[1] = 'applications');

-- Allow public read access to application images
CREATE POLICY "Public can view application images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = 'applications');