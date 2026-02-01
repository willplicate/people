-- Add column to link urgent tasks to original tasks
ALTER TABLE urgent_tasks ADD COLUMN original_task_id UUID REFERENCES personal_tasks(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX idx_urgent_tasks_original_task_id ON urgent_tasks(original_task_id);