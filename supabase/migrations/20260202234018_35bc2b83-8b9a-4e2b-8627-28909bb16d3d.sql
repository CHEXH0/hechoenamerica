-- Update the product-assets bucket to allow larger file sizes (500MB)
UPDATE storage.buckets
SET file_size_limit = 524288000  -- 500MB in bytes
WHERE id = 'product-assets';

-- If bucket doesn't exist, create it with the larger limit
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('product-assets', 'product-assets', false, 524288000)
ON CONFLICT (id) DO UPDATE SET file_size_limit = 524288000;