-- Create storage policies for product-assets bucket to allow producers to upload deliverables
-- Producers can upload to deliverables folder for their assigned projects
CREATE POLICY "Producers can upload deliverables"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'product-assets' 
  AND (storage.foldername(name))[1] = 'deliverables'
  AND has_role(auth.uid(), 'producer'::app_role)
);

-- Producers can view deliverables they uploaded
CREATE POLICY "Producers can view deliverables"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'product-assets' 
  AND (storage.foldername(name))[1] = 'deliverables'
  AND has_role(auth.uid(), 'producer'::app_role)
);

-- Allow service role to delete deliverables (for cleanup after Drive upload)
CREATE POLICY "Service can delete deliverables"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'product-assets' 
  AND (storage.foldername(name))[1] = 'deliverables'
);