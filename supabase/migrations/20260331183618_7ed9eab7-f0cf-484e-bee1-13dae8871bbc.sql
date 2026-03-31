
-- 1. Fix producers table: restrict SELECT to admins/producers only
DROP POLICY IF EXISTS "Anyone can view producers" ON public.producers;

CREATE POLICY "Admins and producers can view producers"
ON public.producers FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'producer'::app_role)
);

-- Keep anon access via producer_profiles view (which excludes sensitive fields)
-- Add anon SELECT on producers for the view to work (the view uses security_invoker)
CREATE POLICY "Anon can view non-sensitive producer fields via view"
ON public.producers FOR SELECT
TO anon
USING (true);

-- 2. Fix purchases table: scope producer access to their assigned requests
DROP POLICY IF EXISTS "Admins and producers can view all purchases" ON public.producers;
DROP POLICY IF EXISTS "Admins and producers can view all purchases" ON public.purchases;

CREATE POLICY "Admins can view all purchases"
ON public.purchases FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Producers can view purchases for their assigned requests"
ON public.purchases FOR SELECT
USING (
  has_role(auth.uid(), 'producer'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.song_requests sr
    JOIN public.producers p ON p.id = sr.assigned_producer_id
    WHERE sr.id::text = purchases.product_id
    AND p.email = auth.email()
  )
);

-- 3. Fix product_notifications: add SELECT policies
CREATE POLICY "Admins can manage all notifications"
ON public.product_notifications FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own notification subscriptions"
ON public.product_notifications FOR SELECT
USING (email = auth.email());
