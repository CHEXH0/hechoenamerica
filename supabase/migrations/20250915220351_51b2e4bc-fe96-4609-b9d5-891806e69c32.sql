-- Add the missing VST products v005 and v006
INSERT INTO products (
  id, name, type, category, price, description, image, showcase, 
  duration, size, weight, has_comparison, is_instrument, 
  audio_preview_url, sort_order, is_active
) VALUES 
(
  'v005', 'Soothe2', 'VST3', 'vsts', '$199', 
  'Soothe harshness so your EQ doesn''t have to', 
  '/laptop-uploads/soothe2.png', '/laptop-uploads/oeksound_logo.jpg',
  NULL, '45 MB', NULL, true, false, NULL, 5, true
),
(
  'v006', 'Spiff', 'VST3', 'vsts', '$149', 
  'Cut or boost transients where it matters', 
  '/laptop-uploads/spiff.png', '/laptop-uploads/oeksound_logo.jpg',
  NULL, '32 MB', NULL, true, false, NULL, 6, true
);