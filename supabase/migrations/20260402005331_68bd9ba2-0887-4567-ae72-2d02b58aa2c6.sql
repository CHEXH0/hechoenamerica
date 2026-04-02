
-- 1. Remove the overly permissive anon SELECT policy on producers
DROP POLICY IF EXISTS "Anon can view non-sensitive producer fields via view" ON public.producers;

-- 2. Fix song_requests: drop broad producer update, replace with scoped one
DROP POLICY IF EXISTS "Admins and producers can update song requests" ON public.song_requests;

CREATE POLICY "Admins can update all song requests"
ON public.song_requests FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Producers can update assigned song requests"
ON public.song_requests FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'producer'::app_role) AND
  assigned_producer_id IN (
    SELECT id FROM public.producers WHERE email = auth.email()
  )
);

-- 3. Fix song_revisions: drop broad producer update, replace with scoped one
DROP POLICY IF EXISTS "Admins and producers can update revisions" ON public.song_revisions;

CREATE POLICY "Admins can update all revisions"
ON public.song_revisions FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Producers can update assigned revisions"
ON public.song_revisions FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'producer'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.song_requests sr
    JOIN public.producers p ON p.id = sr.assigned_producer_id
    WHERE sr.id = song_revisions.song_request_id
      AND p.email = auth.email()
  )
);
