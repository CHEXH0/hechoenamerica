-- Schedule the cleanup job to run daily at 3 AM UTC
SELECT cron.schedule(
  'cleanup-completed-files-daily',
  '0 3 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://eapbuoqkhckqaswfjexv.supabase.co/functions/v1/cleanup-completed-files',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhcGJ1b3FraGNrcWFzd2ZqZXh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NzM0NjMsImV4cCI6MjA3MTQ0OTQ2M30.oybb51fqUbvPklFND2ah5ko3PVUDRUIulSIojuPfoWE"}'::jsonb,
        body:='{"triggered_by": "cron"}'::jsonb
    ) as request_id;
  $$
);