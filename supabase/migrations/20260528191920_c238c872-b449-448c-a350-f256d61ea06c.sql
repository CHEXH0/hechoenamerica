-- 1. Drop unused columns from song_requests (never shipped)
ALTER TABLE public.song_requests DROP COLUMN IF EXISTS wants_distro_help;
ALTER TABLE public.song_requests DROP COLUMN IF EXISTS wants_hea_box;

-- 2. Add 'support' role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'support';

-- 3. New table for distro help requests
CREATE TABLE public.distro_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_request_id UUID NOT NULL,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | scheduled | completed | declined
  google_meet_link TEXT NOT NULL DEFAULT 'https://calendar.app.google/7giF7xaXxa7DtK1P9',
  client_selected_time TIMESTAMPTZ,
  assigned_support_id UUID,
  support_notes TEXT,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(song_request_id)
);

GRANT SELECT, INSERT, UPDATE ON public.distro_requests TO authenticated;
GRANT ALL ON public.distro_requests TO service_role;

ALTER TABLE public.distro_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own
CREATE POLICY "Users can view own distro requests"
ON public.distro_requests FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can update their own (to set client_selected_time)
CREATE POLICY "Users can update own distro requests"
ON public.distro_requests FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Support and admins can view all
CREATE POLICY "Support and admins can view all distro requests"
ON public.distro_requests FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'support'));

-- Support and admins can update all
CREATE POLICY "Support and admins can update all distro requests"
ON public.distro_requests FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'support'));

-- Admins can insert (edge functions use service role)
CREATE POLICY "Admins can insert distro requests"
ON public.distro_requests FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Auto-update updated_at
CREATE TRIGGER update_distro_requests_updated_at
BEFORE UPDATE ON public.distro_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();