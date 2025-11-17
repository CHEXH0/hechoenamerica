-- Rename artists table to producers
ALTER TABLE artists RENAME TO producers;

-- Update the slug column comment if any
COMMENT ON TABLE producers IS 'Stores producer information';

-- No need to recreate RLS policies as they persist through table rename
-- The existing "Anyone can view artists" policy will continue to work