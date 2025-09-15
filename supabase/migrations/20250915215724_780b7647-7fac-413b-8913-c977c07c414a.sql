-- Update VST products with corrected image paths and descriptions
UPDATE products SET 
  image = '/laptop-uploads/God_Particle.jpg'
WHERE id = 'v002';

UPDATE products SET 
  image = '/laptop-uploads/narcotic_Logo.png'
WHERE id = 'v003';

UPDATE products SET 
  description = 'Soothe harshness so your EQ doesn''t have to',
  image = '/laptop-uploads/soothe2.png',
  showcase = '/laptop-uploads/oeksound_logo.jpg'
WHERE id = 'v005';

UPDATE products SET 
  description = 'Cut or boost transients where it matters',
  image = '/laptop-uploads/spiff.png'
WHERE id = 'v006';

-- Remove s002 from Audio samples
DELETE FROM products WHERE id = 's002';