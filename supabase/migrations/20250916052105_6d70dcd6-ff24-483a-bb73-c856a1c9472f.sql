-- Add support for multiple audio preview types
ALTER TABLE public.products 
ADD COLUMN audio_preview_dry text,
ADD COLUMN audio_preview_wet text,
ADD COLUMN audio_preview_comparison text;

-- Update the comment to clarify the audio preview fields
COMMENT ON COLUMN public.products.audio_preview_url IS 'Single audio preview URL for simple products';
COMMENT ON COLUMN public.products.audio_preview_dry IS 'Dry audio preview URL for products with comparisons';
COMMENT ON COLUMN public.products.audio_preview_wet IS 'Wet audio preview URL for products with comparisons';
COMMENT ON COLUMN public.products.audio_preview_comparison IS 'Before/after comparison audio for products with comparisons';
COMMENT ON COLUMN public.products.has_comparison IS 'Whether product has multiple audio previews (dry/wet/comparison)';