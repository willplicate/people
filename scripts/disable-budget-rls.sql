-- Disable RLS for budget tables
-- This allows the tables to work without authentication
-- Use this for personal/single-user applications

-- Disable RLS on budget tables
ALTER TABLE budget_months DISABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;

-- Drop all policies (they're not needed without RLS)
DROP POLICY IF EXISTS "budget_months_select_policy" ON budget_months;
DROP POLICY IF EXISTS "budget_months_insert_policy" ON budget_months;
DROP POLICY IF EXISTS "budget_months_update_policy" ON budget_months;
DROP POLICY IF EXISTS "budget_months_delete_policy" ON budget_months;

DROP POLICY IF EXISTS "expense_categories_select_policy" ON expense_categories;
DROP POLICY IF EXISTS "expense_categories_insert_policy" ON expense_categories;
DROP POLICY IF EXISTS "expense_categories_update_policy" ON expense_categories;

DROP POLICY IF EXISTS "expenses_select_policy" ON expenses;
DROP POLICY IF EXISTS "expenses_insert_policy" ON expenses;
DROP POLICY IF EXISTS "expenses_update_policy" ON expenses;
DROP POLICY IF EXISTS "expenses_delete_policy" ON expenses;

-- Verify RLS is disabled
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('budget_months', 'expense_categories', 'expenses')
ORDER BY tablename;
