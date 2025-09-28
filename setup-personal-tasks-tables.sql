-- Personal Tasks and Shopping Lists Tables Setup
-- Run this in your Supabase SQL Editor

-- Create personal tasks table
CREATE TABLE IF NOT EXISTS personal_tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed', 'cancelled')),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  category VARCHAR(50),
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create shopping lists table
CREATE TABLE IF NOT EXISTS personal_shopping_lists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create shopping items table
CREATE TABLE IF NOT EXISTS personal_shopping_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  shopping_list_id UUID REFERENCES personal_shopping_lists(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit VARCHAR(20),
  category VARCHAR(50),
  priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  is_completed BOOLEAN DEFAULT false,
  estimated_price DECIMAL(10,2),
  actual_price DECIMAL(10,2),
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_personal_tasks_status ON personal_tasks(status);
CREATE INDEX IF NOT EXISTS idx_personal_tasks_priority ON personal_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_personal_tasks_due_date ON personal_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_personal_tasks_category ON personal_tasks(category);
CREATE INDEX IF NOT EXISTS idx_personal_tasks_tags ON personal_tasks USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_shopping_lists_status ON personal_shopping_lists(status);
CREATE INDEX IF NOT EXISTS idx_shopping_items_list_id ON personal_shopping_items(shopping_list_id);
CREATE INDEX IF NOT EXISTS idx_shopping_items_completed ON personal_shopping_items(is_completed);
CREATE INDEX IF NOT EXISTS idx_shopping_items_category ON personal_shopping_items(category);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to personal tasks and shopping tables
-- Drop triggers if they exist, then create them
DROP TRIGGER IF EXISTS update_personal_tasks_updated_at ON personal_tasks;
CREATE TRIGGER update_personal_tasks_updated_at
  BEFORE UPDATE ON personal_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_personal_shopping_lists_updated_at ON personal_shopping_lists;
CREATE TRIGGER update_personal_shopping_lists_updated_at
  BEFORE UPDATE ON personal_shopping_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_personal_shopping_items_updated_at ON personal_shopping_items;
CREATE TRIGGER update_personal_shopping_items_updated_at
  BEFORE UPDATE ON personal_shopping_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on personal tasks and shopping tables
ALTER TABLE personal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_shopping_items ENABLE ROW LEVEL SECURITY;

-- Create policies that allow all operations (single user)
-- Drop policies if they exist, then create them
DROP POLICY IF EXISTS "Allow all operations" ON personal_tasks;
CREATE POLICY "Allow all operations" ON personal_tasks FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations" ON personal_shopping_lists;
CREATE POLICY "Allow all operations" ON personal_shopping_lists FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations" ON personal_shopping_items;
CREATE POLICY "Allow all operations" ON personal_shopping_items FOR ALL USING (true);

-- Insert some sample data to test (optional)
INSERT INTO personal_tasks (title, description, priority, status, category) VALUES
('Set up Supabase tables', 'Run SQL script to create personal tasks tables', 'high', 'completed', 'development'),
('Test task management', 'Create and manage some test tasks', 'medium', 'todo', 'testing'),
('Plan weekend activities', 'Research and plan weekend activities', 'low', 'todo', 'personal')
ON CONFLICT DO NOTHING;

INSERT INTO personal_shopping_lists (name, description, status) VALUES
('Groceries', 'Weekly grocery shopping list', 'active'),
('Hardware Store', 'Items needed for home improvement', 'active')
ON CONFLICT DO NOTHING;

-- Get the shopping list IDs for inserting items
WITH grocery_list AS (
  SELECT id FROM personal_shopping_lists WHERE name = 'Groceries' LIMIT 1
),
hardware_list AS (
  SELECT id FROM personal_shopping_lists WHERE name = 'Hardware Store' LIMIT 1
)
INSERT INTO personal_shopping_items (shopping_list_id, name, quantity, unit, category, priority)
SELECT
  grocery_list.id,
  item.name,
  item.quantity,
  item.unit,
  item.category,
  item.priority
FROM grocery_list,
(VALUES
  ('Milk', 1, 'gallon', 'dairy', 'medium'),
  ('Bread', 2, 'loaves', 'bakery', 'medium'),
  ('Bananas', 1, 'bunch', 'produce', 'low'),
  ('Chicken breast', 2, 'lbs', 'meat', 'high')
) AS item(name, quantity, unit, category, priority)
ON CONFLICT DO NOTHING;