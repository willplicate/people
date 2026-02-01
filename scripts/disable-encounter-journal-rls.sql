-- Disable RLS for personal_encounter_journal table
-- This is needed because the app doesn't have proper authentication session management
-- Similar to how journal_entries table has RLS disabled

ALTER TABLE personal_encounter_journal DISABLE ROW LEVEL SECURITY;

-- Drop all policies (they're not needed without RLS)
DROP POLICY IF EXISTS "Users can view their own entries" ON personal_encounter_journal;
DROP POLICY IF EXISTS "Users can create their own entries" ON personal_encounter_journal;
DROP POLICY IF EXISTS "Users can update their own entries" ON personal_encounter_journal;
DROP POLICY IF EXISTS "Users can delete their own entries" ON personal_encounter_journal;

-- Verify RLS is disabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'personal_encounter_journal'
  AND schemaname = 'public';
