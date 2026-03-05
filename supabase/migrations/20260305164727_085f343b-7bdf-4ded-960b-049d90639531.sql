-- Drop the restrictive authenticated-only policy
DROP POLICY IF EXISTS "Authenticated users can view producers" ON public.producers;

-- Allow everyone (including anonymous/unauthenticated) to view producers
CREATE POLICY "Anyone can view producers"
ON public.producers
FOR SELECT
TO anon, authenticated
USING (true);