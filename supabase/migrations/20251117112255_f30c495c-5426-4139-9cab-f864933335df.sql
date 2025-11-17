-- Add optional features to song_requests table
ALTER TABLE song_requests 
ADD COLUMN number_of_revisions integer DEFAULT 0,
ADD COLUMN wants_recorded_stems boolean DEFAULT false,
ADD COLUMN wants_analog boolean DEFAULT false;