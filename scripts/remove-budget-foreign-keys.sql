-- Remove foreign key constraints for budget tables to work without authentication
-- This allows the budget system to work in single-user mode without auth.users

-- First, let's see what constraints exist
SELECT
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as referenced_table
FROM pg_constraint
WHERE conrelid IN (
  'budget_months'::regclass,
  'expenses'::regclass
)
AND contype = 'f';  -- foreign key constraints

-- Drop foreign key constraints that reference auth.users
ALTER TABLE budget_months DROP CONSTRAINT IF EXISTS budget_months_finalized_by_fkey;
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_paid_by_user_id_fkey;
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_split_with_user_id_fkey;
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_created_by_fkey;

-- Change the user ID columns to allow any UUID (not just ones in auth.users)
-- The columns are already UUID type, we just removed the foreign key constraint

-- Verify the constraints are removed
SELECT
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as referenced_table
FROM pg_constraint
WHERE conrelid IN (
  'budget_months'::regclass,
  'expenses'::regclass
)
AND contype = 'f';  -- Should return empty if all removed
