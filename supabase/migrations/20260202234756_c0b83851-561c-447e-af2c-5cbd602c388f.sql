-- Update the product-assets bucket to 50MB file size limit
UPDATE storage.buckets
SET file_size_limit = 52428800  -- 50MB in bytes
WHERE id = 'product-assets';