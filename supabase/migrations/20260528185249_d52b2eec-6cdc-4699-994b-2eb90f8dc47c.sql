-- Add 'support' role to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'support';

-- Track new add-ons on song_requests
ALTER TABLE public.song_requests
  ADD COLUMN IF NOT EXISTS wants_distro_help boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS wants_hea_box boolean NOT NULL DEFAULT false;