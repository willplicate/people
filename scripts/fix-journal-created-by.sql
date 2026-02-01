-- Fix journal_entries to auto-populate created_by with current user
-- This allows the app to work without explicitly passing user ID

ALTER TABLE journal_entries
ALTER COLUMN created_by SET DEFAULT auth.uid();

COMMENT ON COLUMN journal_entries.created_by IS 'User who created the entry - defaults to current authenticated user';
