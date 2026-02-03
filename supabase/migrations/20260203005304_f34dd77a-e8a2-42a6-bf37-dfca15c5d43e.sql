
-- Insert missing revisions for the in_progress project
INSERT INTO public.song_revisions (song_request_id, revision_number, status)
SELECT 
  sr.id,
  generate_series(1, sr.number_of_revisions),
  'pending'
FROM public.song_requests sr
WHERE sr.id = 'a4fd350d-2680-45cf-b7b7-d238fa19e059'
  AND sr.number_of_revisions > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.song_revisions rev WHERE rev.song_request_id = sr.id
  );
