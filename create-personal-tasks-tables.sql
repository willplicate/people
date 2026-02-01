-- Personal Tasks and Shopping Lists Tables
-- Run this in your Supabase SQL editor

-- Create personal tasks table
CREATE TABLE personal_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    status TEXT CHECK (status IN ('todo', 'in_progress', 'completed', 'cancelled')) DEFAULT 'todo',
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    category TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create shopping lists table
CREATE TABLE personal_shopping_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK (status IN ('active', 'completed', 'archived')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create shopping list items table
CREATE TABLE personal_shopping_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shopping_list_id UUID REFERENCES personal_shopping_lists(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    quantity INTEGER DEFAULT 1,
    unit TEXT, -- e.g., 'piece', 'kg', 'liter', 'pack'
    category TEXT, -- e.g., 'groceries', 'household', 'electronics'
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    is_completed BOOLEAN DEFAULT false,
    estimated_price DECIMAL(10,2),
    actual_price DECIMAL(10,2),
    notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_personal_tasks_status ON personal_tasks(status);
CREATE INDEX idx_personal_tasks_priority ON personal_tasks(priority);
CREATE INDEX idx_personal_tasks_due_date ON personal_tasks(due_date);
CREATE INDEX idx_personal_tasks_category ON personal_tasks(category);
CREATE INDEX idx_personal_tasks_created_at ON personal_tasks(created_at);

CREATE INDEX idx_shopping_lists_status ON personal_shopping_lists(status);
CREATE INDEX idx_shopping_lists_created_at ON personal_shopping_lists(created_at);

CREATE INDEX idx_shopping_items_list_id ON personal_shopping_items(shopping_list_id);
CREATE INDEX idx_shopping_items_completed ON personal_shopping_items(is_completed);
CREATE INDEX idx_shopping_items_category ON personal_shopping_items(category);
CREATE INDEX idx_shopping_items_priority ON personal_shopping_items(priority);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_personal_tasks_updated_at
    BEFORE UPDATE ON personal_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_lists_updated_at
    BEFORE UPDATE ON personal_shopping_lists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_items_updated_at
    BEFORE UPDATE ON personal_shopping_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE personal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_shopping_items ENABLE ROW LEVEL SECURITY;

-- Create policies (for now, allow all operations - you can restrict later if needed)
CREATE POLICY "Allow all operations on personal_tasks" ON personal_tasks FOR ALL USING (true);
CREATE POLICY "Allow all operations on personal_shopping_lists" ON personal_shopping_lists FOR ALL USING (true);
CREATE POLICY "Allow all operations on personal_shopping_items" ON personal_shopping_items FOR ALL USING (true);

-- Insert sample data for testing
INSERT INTO personal_tasks (title, description, priority, category) VALUES
('Buy groceries', 'Weekly grocery shopping', 'medium', 'household'),
('Call dentist', 'Schedule dental cleaning appointment', 'high', 'health'),
('Update resume', 'Add recent projects and skills', 'low', 'career'),
('Plan vacation', 'Research destinations and book flights', 'medium', 'personal');

INSERT INTO personal_shopping_lists (name, description) VALUES
('Weekly Groceries', 'Regular weekly grocery shopping'),
('Home Office Setup', 'Items needed for home office renovation'),
('Birthday Party Supplies', 'Supplies for upcoming birthday party');

-- Insert sample shopping items
INSERT INTO personal_shopping_items (shopping_list_id, name, quantity, unit, category, priority)
SELECT
    (SELECT id FROM personal_shopping_lists WHERE name = 'Weekly Groceries'),
    item_name,
    quantity,
    unit,
    'groceries',
    'medium'
FROM (VALUES
    ('Milk', 2, 'liter'),
    ('Bread', 1, 'loaf'),
    ('Eggs', 12, 'piece'),
    ('Apples', 1, 'kg'),
    ('Chicken breast', 500, 'gram')
) AS items(item_name, quantity, unit);

INSERT INTO personal_shopping_items (shopping_list_id, name, quantity, unit, category, priority)
SELECT
    (SELECT id FROM personal_shopping_lists WHERE name = 'Home Office Setup'),
    item_name,
    quantity,
    unit,
    'furniture',
    'high'
FROM (VALUES
    ('Standing desk', 1, 'piece'),
    ('Ergonomic chair', 1, 'piece'),
    ('Monitor arm', 1, 'piece'),
    ('Desk lamp', 1, 'piece')
) AS items(item_name, quantity, unit);