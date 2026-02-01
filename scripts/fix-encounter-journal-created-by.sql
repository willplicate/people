-- Fix personal_encounter_journal to work without real authentication
-- Remove the foreign key constraint and make created_by nullable

-- Drop the foreign key constraint
ALTER TABLE personal_encounter_journal
  DROP CONSTRAINT IF EXISTS personal_encounter_journal_created_by_fkey;

-- Make created_by nullable (optional - it's still set by the app)
ALTER TABLE personal_encounter_journal
  ALTER COLUMN created_by DROP NOT NULL;

-- Verify changes
SELECT
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'personal_encounter_journal'
  AND column_name = 'created_by';
