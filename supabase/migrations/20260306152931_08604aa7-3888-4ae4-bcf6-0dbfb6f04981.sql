-- Drop all existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own chamoy requests" ON public.chamoy_requests;
DROP POLICY IF EXISTS "Users can create their own chamoy requests" ON public.chamoy_requests;
DROP POLICY IF EXISTS "Users can update their own chamoy requests" ON public.chamoy_requests;
DROP POLICY IF EXISTS "Admins can view all chamoy requests" ON public.chamoy_requests;
DROP POLICY IF EXISTS "Admins can update all chamoy requests" ON public.chamoy_requests;
DROP POLICY IF EXISTS "Admins can delete chamoy requests" ON public.chamoy_requests;

-- Recreate as PERMISSIVE (default) so any matching policy grants access
CREATE POLICY "Users can view their own chamoy requests"
  ON public.chamoy_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chamoy requests"
  ON public.chamoy_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chamoy requests"
  ON public.chamoy_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all chamoy requests"
  ON public.chamoy_requests FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all chamoy requests"
  ON public.chamoy_requests FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete chamoy requests"
  ON public.chamoy_requests FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));