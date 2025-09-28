-- Complete fix for urgent_tasks table
-- Step 1: Drop existing RLS policies first
DROP POLICY IF EXISTS "Users can view their own urgent tasks" ON urgent_tasks;
DROP POLICY IF EXISTS "Users can insert their own urgent tasks" ON urgent_tasks;
DROP POLICY IF EXISTS "Users can update their own urgent tasks" ON urgent_tasks;
DROP POLICY IF EXISTS "Users can delete their own urgent tasks" ON urgent_tasks;

-- Step 2: Drop the user_id index
DROP INDEX IF EXISTS idx_urgent_tasks_user_id;

-- Step 3: Remove user_id column (now that policies are gone)
ALTER TABLE urgent_tasks DROP COLUMN IF EXISTS user_id;

-- Step 4: Create new permissive policy like other tables
CREATE POLICY "Allow all operations on urgent_tasks" ON urgent_tasks FOR ALL USING (true);