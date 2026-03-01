
-- Performance indexes for high-traffic queries

-- song_requests: frequently queried by user_id, status, and assigned_producer_id
CREATE INDEX IF NOT EXISTS idx_song_requests_user_id ON public.song_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_song_requests_status ON public.song_requests(status);
CREATE INDEX IF NOT EXISTS idx_song_requests_assigned_producer ON public.song_requests(assigned_producer_id);
CREATE INDEX IF NOT EXISTS idx_song_requests_user_status ON public.song_requests(user_id, status);

-- purchases: frequently queried by user_id and product_id
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_product_id ON public.purchases(product_id);

-- song_revisions: frequently joined with song_requests
CREATE INDEX IF NOT EXISTS idx_song_revisions_song_request_id ON public.song_revisions(song_request_id);
CREATE INDEX IF NOT EXISTS idx_song_revisions_status ON public.song_revisions(status);

-- revision_messages: frequently queried by revision_id
CREATE INDEX IF NOT EXISTS idx_revision_messages_revision_id ON public.revision_messages(revision_id);

-- products: filtered by is_active and ordered by category + sort_order
CREATE INDEX IF NOT EXISTS idx_products_active_category ON public.products(is_active, category, sort_order);

-- platforms: queried by artist_id
CREATE INDEX IF NOT EXISTS idx_platforms_artist_id ON public.platforms(artist_id);

-- user_roles: frequently checked by user_id and role
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role ON public.user_roles(user_id, role);

-- contact_submissions: filtered by application_status
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON public.contact_submissions(application_status);

-- hea_projects: queried by assigned_producer_id and status
CREATE INDEX IF NOT EXISTS idx_hea_projects_producer ON public.hea_projects(assigned_producer_id);
CREATE INDEX IF NOT EXISTS idx_hea_projects_status ON public.hea_projects(status);
