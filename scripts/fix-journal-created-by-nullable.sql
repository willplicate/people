-- Make created_by nullable since we don't have proper authentication
-- This allows the journal to work without requiring user authentication
-- Similar to how other tables in the system work

ALTER TABLE journal_entries
ALTER COLUMN created_by DROP NOT NULL;

-- Update the column comment
COMMENT ON COLUMN journal_entries.created_by IS 'User who created the entry - nullable since authentication is not enforced';

-- Verify the change
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'journal_entries'
  AND column_name = 'created_by';
