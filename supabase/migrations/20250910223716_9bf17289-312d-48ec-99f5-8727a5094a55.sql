-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('samples', 'vsts', 'candies')),
  price TEXT NOT NULL,
  description TEXT NOT NULL,
  image TEXT NOT NULL,
  showcase TEXT NOT NULL,
  duration TEXT,
  size TEXT,
  weight TEXT,
  has_comparison BOOLEAN DEFAULT FALSE,
  is_instrument BOOLEAN DEFAULT FALSE,
  audio_preview_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for viewing products
CREATE POLICY "Anyone can view active products" 
ON public.products 
FOR SELECT 
USING (is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('audio-samples', 'audio-samples', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('product-assets', 'product-assets', false);

-- Create storage policies for audio samples (public read access)
CREATE POLICY "Public can view audio samples" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'audio-samples');

-- Create storage policies for product images (public read access)
CREATE POLICY "Public can view product images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'product-images');

-- Create storage policies for product assets (private access for downloads)
CREATE POLICY "Authenticated users can view product assets" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'product-assets' AND auth.role() = 'authenticated');

-- Insert sample data from the existing hardcoded products
INSERT INTO public.products (id, name, type, category, price, description, image, showcase, duration, sort_order) VALUES
-- Audio Samples
('s001', 'MY Keys Sound Pack - Nick Zinchenko', 'WAV', 'samples', '$19.99', 'ONE Shot Key Sounds – 37 Handpicked WAV Samples from My Own Collection ', '/laptop-uploads/Zinchenko.png', '/laptop-uploads/Nick.png', '45MB', 1),

-- VST Plugins
('v001', 'Chexho Synth VSTi', 'VST3/VST', 'vsts', '$15.99', 'Build pschedelic sounds by your own creation', '/laptop-uploads/Synth.png', '/laptop-uploads/AlbumCover.png', NULL, 1),
('v002', 'The God Particle', 'VST3/VST/AXX', 'vsts', 'Free', 'The God Paricle. Beyond the super analog', '/laptop-uploads/God_Particle.jpg', '/laptop-uploads/Cradle_logo.jpg', NULL, 2),
('v003', 'NARCOTIC', 'VST3/VST/AXX', 'vsts', 'Free', 'Narcotic is the ultimate way to add motion, movement and pulse to your sounds', '/laptop-uploads/Narcotic.webp', '/laptop-uploads/narcotic_logo.png', NULL, 3),
('v004', 'SUGAR', 'VST3/VST/AXX', 'vsts', 'Free', 'This full spectrum enhancer will add punch, thickness, depth, warmth, edge and grit to all your tracks', '/laptop-uploads/sugar.jpg', '/laptop-uploads/process_logo.jpg', NULL, 4),
('v005', 'soothe2', 'VST3/VST/AXX', 'vsts', 'Free', 'Soothe harshness so your EQ doesn’t have to', '/laptop-uploads/soothe2.png', '/laptop-uploads/oeksound_logo.jpg', NULL, 5),
('v006', 'spiff', 'VST3/VST/AXX', 'vsts', 'Free', 'Cut or boost transients where it matters', '/laptop-uploads/spiff.png', '/laptop-uploads/oeksound_logo.jpg', NULL, 6),

-- Candies
('c001', 'Chammoy Gummy Bursts', 'Sweet & Spicy Treat', 'candies', '$12.99', 'Chamoy-covered gushers', '/laptop-uploads/Donut.png', '/laptop-uploads/Star.png', NULL, 1),
('c002', 'Mango Chili Gummies', 'Gummy Candy', 'candies', '$8.99', 'Spicy-sweet mango flavored gummies', '/laptop-uploads/Pill.png', '/laptop-uploads/Donut.png', NULL, 2),
('c003', 'Café Cubano Truffles', 'Chocolate', 'candies', '$16.99', 'Rich coffee-infused chocolate truffles', '/laptop-uploads/Star.png', '/laptop-uploads/Pill.png', NULL, 3),
('c004', 'Tropical Mix Variety Pack', 'Mixed Candy', 'candies', '$24.99', 'Assorted tropical flavored gummy candies', '/laptop-uploads/Donut.png', '/laptop-uploads/Star.png', NULL, 4);

-- Update VST-specific fields
UPDATE public.products SET size = '30MB', has_comparison = false, is_instrument = true WHERE id = 'v001';

-- Update candy-specific fields
UPDATE public.products SET weight = '250g' WHERE id = 'c001';
UPDATE public.products SET weight = '200g' WHERE id = 'c002';
UPDATE public.products SET weight = '300g' WHERE id = 'c003';
UPDATE public.products SET weight = '500g' WHERE id = 'c004';