-- Create urgent_tasks table for fast task management
CREATE TABLE IF NOT EXISTS urgent_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE urgent_tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own urgent tasks" ON urgent_tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own urgent tasks" ON urgent_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own urgent tasks" ON urgent_tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own urgent tasks" ON urgent_tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_urgent_tasks_user_id ON urgent_tasks(user_id);
CREATE INDEX idx_urgent_tasks_order ON urgent_tasks(user_id, order_index);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_urgent_tasks_updated_at BEFORE UPDATE ON urgent_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();