
-- Create HEA Projects table for admin-managed client projects
CREATE TABLE public.hea_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  address text,
  price text NOT NULL DEFAULT '0',
  terms text,
  details text,
  number_of_revisions integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  assigned_producer_id uuid REFERENCES public.producers(id),
  contract_signed boolean NOT NULL DEFAULT false,
  contract_signed_at timestamp with time zone,
  contract_signature_name text,
  contract_token text UNIQUE,
  receipt_sent boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hea_projects ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can manage all HEA projects"
ON public.hea_projects
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Producers can view assigned projects
CREATE POLICY "Producers can view assigned HEA projects"
ON public.hea_projects
FOR SELECT
USING (
  public.has_role(auth.uid(), 'producer') AND
  assigned_producer_id IN (
    SELECT id FROM public.producers WHERE email = auth.email()
  )
);

-- Public access for contract signing via token (no auth needed)
CREATE POLICY "Anyone can view project by contract token"
ON public.hea_projects
FOR SELECT
USING (contract_token IS NOT NULL);

-- Allow unsigned updates for contract signing
CREATE POLICY "Anyone can sign contracts via token"
ON public.hea_projects
FOR UPDATE
USING (contract_token IS NOT NULL AND contract_signed = false)
WITH CHECK (contract_token IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_hea_projects_updated_at
BEFORE UPDATE ON public.hea_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
