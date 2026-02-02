-- Drop the problematic policies that query auth.users directly
DROP POLICY IF EXISTS "Producers can update their own profile" ON public.producers;
DROP POLICY IF EXISTS "Producers can insert their own profile" ON public.producers;

-- Recreate policies using auth.email() instead of querying auth.users
CREATE POLICY "Producers can update their own profile" 
ON public.producers 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'producer'::app_role) 
  AND email = auth.email()
);

CREATE POLICY "Producers can insert their own profile" 
ON public.producers 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'producer'::app_role) 
  AND email = auth.email()
);