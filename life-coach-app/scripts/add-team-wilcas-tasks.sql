-- Team Wilcas Task Manager Schema

-- Create team_wilcas_tasks table
CREATE TABLE IF NOT EXISTS team_wilcas_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT NOT NULL CHECK (assigned_to IN ('Will', 'Partner', 'Either')),
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_team_wilcas_tasks_completed ON team_wilcas_tasks(completed);
CREATE INDEX IF NOT EXISTS idx_team_wilcas_tasks_assigned_to ON team_wilcas_tasks(assigned_to);

-- Add RLS policies
ALTER TABLE team_wilcas_tasks ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (or public if you want)
CREATE POLICY "Allow all operations on team_wilcas_tasks" ON team_wilcas_tasks
  FOR ALL USING (true);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_team_wilcas_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER team_wilcas_tasks_updated_at
  BEFORE UPDATE ON team_wilcas_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_team_wilcas_tasks_updated_at();

-- Add comment
COMMENT ON TABLE team_wilcas_tasks IS 'Household task manager for Team Wilcas';
