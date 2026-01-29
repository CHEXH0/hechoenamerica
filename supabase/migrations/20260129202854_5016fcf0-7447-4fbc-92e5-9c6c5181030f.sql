-- Add RLS policies for producers to edit the producers table

-- Admins can do everything on the producers table
CREATE POLICY "Admins can manage all producers"
ON public.producers
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Producers can update their own record (matched by email)
CREATE POLICY "Producers can update their own profile"
ON public.producers
FOR UPDATE
USING (
  has_role(auth.uid(), 'producer'::app_role) 
  AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Producers can insert their own record if they don't have one yet
CREATE POLICY "Producers can insert their own profile"
ON public.producers
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'producer'::app_role)
  AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
);