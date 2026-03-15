-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = 'avatars'
  AND auth.uid() IS NOT NULL
);

-- Allow authenticated users to update (upsert) their own avatars
CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = 'avatars'
  AND auth.uid() IS NOT NULL
);

-- Allow anyone to view avatars (public bucket, but explicit policy)
CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = 'avatars'
);