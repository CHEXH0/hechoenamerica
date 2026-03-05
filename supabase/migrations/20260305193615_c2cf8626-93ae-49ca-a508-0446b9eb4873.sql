
-- Create chamoy_requests table for custom gummy candy orders
CREATE TABLE public.chamoy_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_price text NULL,
  admin_description text NULL,
  admin_reviewed_at timestamptz NULL,
  user_accepted boolean NULL,
  user_responded_at timestamptz NULL,
  stripe_session_id text NULL,
  paid_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chamoy_requests ENABLE ROW LEVEL SECURITY;

-- Users can create their own requests
CREATE POLICY "Users can create their own chamoy requests"
ON public.chamoy_requests FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own requests
CREATE POLICY "Users can view their own chamoy requests"
ON public.chamoy_requests FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Users can update their own requests (for accepting/declining)
CREATE POLICY "Users can update their own chamoy requests"
ON public.chamoy_requests FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all requests
CREATE POLICY "Admins can view all chamoy requests"
ON public.chamoy_requests FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update all requests (for setting price/approval)
CREATE POLICY "Admins can update all chamoy requests"
ON public.chamoy_requests FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete requests
CREATE POLICY "Admins can delete chamoy requests"
ON public.chamoy_requests FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Updated at trigger
CREATE TRIGGER update_chamoy_requests_updated_at
  BEFORE UPDATE ON public.chamoy_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
