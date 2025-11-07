-- Disable RLS for journal_entries table
-- This is needed because the app doesn't have proper authentication session management
-- Similar to how budget tables have RLS disabled

ALTER TABLE journal_entries DISABLE ROW LEVEL SECURITY;

-- Drop all policies (they're not needed without RLS)
DROP POLICY IF EXISTS "Authenticated users can create journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Authenticated users can update journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Authenticated users can delete journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Authenticated users can view all journal entries" ON journal_entries;

-- Verify RLS is disabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'journal_entries'
  AND schemaname = 'public';
