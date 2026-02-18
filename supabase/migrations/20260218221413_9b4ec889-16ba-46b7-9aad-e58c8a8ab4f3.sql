
-- Insert HEA Admin as a producer (skip if already exists)
INSERT INTO public.producers (name, slug, email, image, country, genre, bio)
VALUES (
  'Hecho En America',
  'hecho-en-america',
  'hechoenamerica369@gmail.com',
  '/laptop-uploads/HEA_White.png',
  'Los Angeles, USA',
  'All Genres',
  'Hecho En America Studio — Official admin producer.'
)
ON CONFLICT DO NOTHING;

-- Create RPC to get producer IDs that belong to admin users
CREATE OR REPLACE FUNCTION public.get_admin_producer_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id
  FROM public.producers p
  JOIN auth.users u ON u.email = p.email
  JOIN public.user_roles ur ON ur.user_id = u.id
  WHERE ur.role = 'admin'
$$;
