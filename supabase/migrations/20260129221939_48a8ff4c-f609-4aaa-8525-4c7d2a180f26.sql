-- Allow producers to upload their profile images to the producers folder
CREATE POLICY "Producers can upload profile images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND (storage.foldername(name))[1] = 'producers'
  AND has_role(auth.uid(), 'producer'::app_role)
);

-- Allow producers to update their profile images
CREATE POLICY "Producers can update profile images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'product-images' 
  AND (storage.foldername(name))[1] = 'producers'
  AND has_role(auth.uid(), 'producer'::app_role)
)
WITH CHECK (
  bucket_id = 'product-images' 
  AND (storage.foldername(name))[1] = 'producers'
  AND has_role(auth.uid(), 'producer'::app_role)
);

-- Allow producers to delete their profile images
CREATE POLICY "Producers can delete profile images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'product-images' 
  AND (storage.foldername(name))[1] = 'producers'
  AND has_role(auth.uid(), 'producer'::app_role)
);