-- Fix RLS policies for budget tables
-- Run this in Supabase SQL Editor if you get "row-level security policy" errors

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can create budget months" ON budget_months;
DROP POLICY IF EXISTS "Users can update budget months" ON budget_months;

-- Create more permissive policies for budget_months
-- Allow all authenticated users to create months
CREATE POLICY "Authenticated users can create budget months"
  ON budget_months FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow all authenticated users to update months
CREATE POLICY "Authenticated users can update budget months"
  ON budget_months FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'budget_months';
