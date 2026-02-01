-- Fix RLS policies for budget tables
-- This script removes and recreates the policies correctly

-- ============================================================================
-- DROP ALL EXISTING POLICIES
-- ============================================================================

-- Budget Months policies
DROP POLICY IF EXISTS "Authenticated users can view budget months" ON budget_months;
DROP POLICY IF EXISTS "Users can view budget months" ON budget_months;
DROP POLICY IF EXISTS "Authenticated users can create budget months" ON budget_months;
DROP POLICY IF EXISTS "Users can create budget months" ON budget_months;
DROP POLICY IF EXISTS "Authenticated users can update budget months" ON budget_months;
DROP POLICY IF EXISTS "Users can update budget months" ON budget_months;

-- Expense Categories policies
DROP POLICY IF EXISTS "Authenticated users can view expense categories" ON expense_categories;
DROP POLICY IF EXISTS "Authenticated users can manage expense categories" ON expense_categories;

-- Expenses policies
DROP POLICY IF EXISTS "Users can view their expenses" ON expenses;
DROP POLICY IF EXISTS "Users can create expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update their expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete their expenses" ON expenses;

-- ============================================================================
-- RECREATE POLICIES FOR BUDGET_MONTHS
-- ============================================================================

-- Budget months don't have a user_id column, they're shared across all users
-- Allow all authenticated users full access

CREATE POLICY "budget_months_select_policy"
  ON budget_months FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "budget_months_insert_policy"
  ON budget_months FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "budget_months_update_policy"
  ON budget_months FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "budget_months_delete_policy"
  ON budget_months FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- RECREATE POLICIES FOR EXPENSE_CATEGORIES
-- ============================================================================

-- Categories are shared across all users
CREATE POLICY "expense_categories_select_policy"
  ON expense_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "expense_categories_insert_policy"
  ON expense_categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "expense_categories_update_policy"
  ON expense_categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- RECREATE POLICIES FOR EXPENSES
-- ============================================================================

-- Users can see expenses they're involved in
CREATE POLICY "expenses_select_policy"
  ON expenses FOR SELECT
  TO authenticated
  USING (
    paid_by_user_id = auth.uid() OR
    split_with_user_id = auth.uid() OR
    created_by = auth.uid()
  );

-- Users can create expenses (must set created_by to their own ID)
CREATE POLICY "expenses_insert_policy"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Users can update expenses they created or paid for
CREATE POLICY "expenses_update_policy"
  ON expenses FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    paid_by_user_id = auth.uid()
  )
  WITH CHECK (
    created_by = auth.uid() OR
    paid_by_user_id = auth.uid()
  );

-- Users can delete expenses they created or paid for
CREATE POLICY "expenses_delete_policy"
  ON expenses FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    paid_by_user_id = auth.uid()
  );

-- ============================================================================
-- VERIFY THE POLICIES
-- ============================================================================

SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  CASE
    WHEN qual IS NOT NULL THEN 'USING: ' || qual
    ELSE 'No USING clause'
  END as using_clause,
  CASE
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policies
WHERE tablename IN ('budget_months', 'expense_categories', 'expenses')
ORDER BY tablename, policyname;
