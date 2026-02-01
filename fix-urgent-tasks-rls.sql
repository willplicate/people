-- Fix urgent_tasks RLS policies to match existing tables
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own urgent tasks" ON urgent_tasks;
DROP POLICY IF EXISTS "Users can insert their own urgent tasks" ON urgent_tasks;
DROP POLICY IF EXISTS "Users can update their own urgent tasks" ON urgent_tasks;
DROP POLICY IF EXISTS "Users can delete their own urgent tasks" ON urgent_tasks;

-- Create permissive policy like other tables
CREATE POLICY "Allow all operations on urgent_tasks" ON urgent_tasks FOR ALL USING (true);