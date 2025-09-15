-- Add missing sample products
INSERT INTO products (id, name, type, category, price, description, image, showcase, audio_preview_url, sort_order, is_active) VALUES
('s002', 'Tropical Bounce Pack - Rosella', 'Sample Pack', 'samples', '$29.99', 'Vibrant tropical sounds with bouncy rhythms perfect for summer vibes and dance productions.', '/laptop-uploads/Rosella.jpg', '/laptop-uploads/Rossella.jpg', 'https://eapbuoqkhckqaswfjexv.supabase.co/storage/v1/object/public/audio-samples/s002-preview.mp3', 1, true),
('s003', 'Dark Ambient Collection - BlackJ', 'Sample Pack', 'samples', '$34.99', 'Mysterious and atmospheric sounds for cinematic and dark ambient productions.', '/laptop-uploads/BlackJ.png', '/laptop-uploads/RIVERSIDE.jpg', 'https://eapbuoqkhckqaswfjexv.supabase.co/storage/v1/object/public/audio-samples/s003-preview.mp3', 2, true),
('s004', 'FL Studio Signature Loops', 'Sample Pack', 'samples', '$24.99', 'Professional quality loops optimized for FL Studio workflow and modern production.', '/laptop-uploads/FLoops.png', '/laptop-uploads/Masker.jpg', 'https://eapbuoqkhckqaswfjexv.supabase.co/storage/v1/object/public/audio-samples/s004-preview.mp3', 3, true);

-- Update existing products with proper audio preview URLs from Supabase storage
UPDATE products SET audio_preview_url = 'https://eapbuoqkhckqaswfjexv.supabase.co/storage/v1/object/public/audio-samples/s001-preview.mp3' WHERE id = 's001';

-- Update VST products with audio preview URLs (both dry and wet versions will be handled in the component)
UPDATE products SET audio_preview_url = 'https://eapbuoqkhckqaswfjexv.supabase.co/storage/v1/object/public/audio-samples/v001-dry.mp3' WHERE id = 'v001';
UPDATE products SET audio_preview_url = 'https://eapbuoqkhckqaswfjexv.supabase.co/storage/v1/object/public/audio-samples/v002-dry.mp3' WHERE id = 'v002';
UPDATE products SET audio_preview_url = 'https://eapbuoqkhckqaswfjexv.supabase.co/storage/v1/object/public/audio-samples/v003-dry.mp3' WHERE id = 'v003';
UPDATE products SET audio_preview_url = 'https://eapbuoqkhckqaswfjexv.supabase.co/storage/v1/object/public/audio-samples/v004-dry.mp3' WHERE id = 'v004';
UPDATE products SET audio_preview_url = 'https://eapbuoqkhckqaswfjexv.supabase.co/storage/v1/object/public/audio-samples/v005-dry.mp3' WHERE id = 'v005';
UPDATE products SET audio_preview_url = 'https://eapbuoqkhckqaswfjexv.supabase.co/storage/v1/object/public/audio-samples/v006-dry.mp3' WHERE id = 'v006';