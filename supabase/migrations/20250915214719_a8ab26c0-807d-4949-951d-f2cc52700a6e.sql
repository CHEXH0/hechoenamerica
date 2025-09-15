-- Update existing products with new details from migration
UPDATE public.products SET 
  name = 'MY Keys Sound Pack - Nick Zinchenko',
  description = 'ONE Shot Key Sounds – 37 Handpicked WAV Samples from My Own Collection',
  price = '$19.99',
  image = '/laptop-uploads/Zinchenko.png',
  showcase = '/laptop-uploads/Nick.png',
  size = '45MB'
WHERE id = 's001';

-- Update VST v001 with new details
UPDATE public.products SET 
  name = 'Chexho Synth VSTi',
  price = '$15.99',
  description = 'Build pschedelic sounds by your own creation',
  image = '/laptop-uploads/Synth.png',
  showcase = '/laptop-uploads/AlbumCover.png',
  size = '3.2 GB',
  has_comparison = false,
  is_instrument = true
WHERE id = 'v001';

-- Remove the old v003 entry (it was duplicate of v001)
DELETE FROM public.products WHERE id = 'v003';

-- Insert new VST products from migration
INSERT INTO public.products (id, name, type, category, price, description, image, showcase, size, sort_order, has_comparison, is_instrument, is_active, created_at, updated_at) VALUES
('v002', 'The God Particle', 'VST3/VST/AXX', 'vsts', 'Free', 'The God Paricle. Beyond the super analog', '/laptop-uploads/God Particle.jpg', '/laptop-uploads/Cradle_logo.jpg', NULL, 2, false, false, true, now(), now()),
('v003', 'NARCOTIC', 'VST3/VST/AXX', 'vsts', 'Free', 'Narcotic is the ultimate way to add motion, movement and pulse to your sounds', '/laptop-uploads/Narcotic.webp', '/laptop-uploads/narcotic_logo.png', NULL, 3, false, false, true, now(), now()),
('v004', 'SUGAR', 'VST3/VST/AXX', 'vsts', 'Free', 'This full spectrum enhancer will add punch, thickness, depth, warmth, edge and grit to all your tracks', '/laptop-uploads/sugar.jpg', '/laptop-uploads/process_logo.jpg', NULL, 4, false, false, true, now(), now());