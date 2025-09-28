-- Remove user_id column from urgent_tasks to match personal_tasks pattern
ALTER TABLE urgent_tasks DROP COLUMN IF EXISTS user_id;

-- Drop the user_id index
DROP INDEX IF EXISTS idx_urgent_tasks_user_id;