-- Fix journal_entries RLS policies to allow shared access without strict created_by checks
-- Since this is a shared journal for both users, simplify the policies

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can create journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Authenticated users can update journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Authenticated users can delete journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Authenticated users can view all journal entries" ON journal_entries;

-- Recreate simplified policies for shared access
CREATE POLICY "Authenticated users can view all journal entries"
  ON journal_entries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create journal entries"
  ON journal_entries FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update journal entries"
  ON journal_entries FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete journal entries"
  ON journal_entries FOR DELETE
  TO authenticated
  USING (true);

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'journal_entries';
