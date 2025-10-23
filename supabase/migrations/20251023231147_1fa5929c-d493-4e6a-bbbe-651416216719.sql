-- Add storage policies for authenticated users to upload files to product-assets bucket

-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Authenticated users can upload to their folder in product-assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own files
CREATE POLICY "Authenticated users can update their own files in product-assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'product-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Authenticated users can delete their own files in product-assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);