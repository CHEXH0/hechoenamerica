-- Add mixing and mastering options to song_requests table
ALTER TABLE song_requests 
ADD COLUMN wants_mixing boolean DEFAULT false,
ADD COLUMN wants_mastering boolean DEFAULT false;