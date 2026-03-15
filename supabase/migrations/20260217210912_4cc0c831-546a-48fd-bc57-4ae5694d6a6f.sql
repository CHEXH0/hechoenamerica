
-- Drop the overly permissive public policies
DROP POLICY "Anyone can view project by contract token" ON public.hea_projects;
DROP POLICY "Anyone can sign contracts via token" ON public.hea_projects;
