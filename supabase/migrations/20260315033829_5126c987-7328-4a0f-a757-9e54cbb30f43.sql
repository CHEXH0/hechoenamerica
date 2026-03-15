
INSERT INTO public.products (id, name, type, category, price, description, image, showcase, is_active, sort_order)
VALUES 
  ('c001', 'Chamoy Gummy Bears', 'Candy', 'candies', '$5.00', 'Classic gummy bears coated in our signature chamoy sauce with a hint of chili lime. Sweet, tangy, and irresistibly spicy.', '/laptop-uploads/Gomas_Chamoy.png', '/laptop-uploads/Gomas_Chamoy.png', true, 1),
  ('c002', 'Chamoy Peach Rings', 'Candy', 'candies', '$5.00', 'Juicy peach ring gummies drenched in chamoy with Tajín seasoning. A perfect balance of fruity sweetness and bold Mexican flavor.', '/laptop-uploads/Gomas_Chamoy.png', '/laptop-uploads/Gomas_Chamoy.png', true, 2)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;
