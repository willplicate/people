-- Habit Tracker Database Schema
-- Add to existing Personal CRM database

-- Create personal habits table
CREATE TABLE personal_habits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  frequency_type VARCHAR(20) NOT NULL CHECK (frequency_type IN ('daily', 'weekly', 'monthly', 'specific_days')),
  frequency_days INTEGER[], -- For specific_days: array of day numbers (0=Sunday, 1=Monday, ..., 6=Saturday)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create personal habit completions table
CREATE TABLE personal_habit_completions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  habit_id UUID REFERENCES personal_habits(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL, -- Just the date, not timestamp
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(habit_id, completed_date) -- Prevent multiple completions for same habit on same day
);

-- Create indexes for performance
CREATE INDEX idx_personal_habits_active ON personal_habits(is_active);
CREATE INDEX idx_personal_habits_frequency ON personal_habits(frequency_type, is_active);
CREATE INDEX idx_personal_habit_completions_date ON personal_habit_completions(completed_date DESC);
CREATE INDEX idx_personal_habit_completions_habit_date ON personal_habit_completions(habit_id, completed_date DESC);

-- Add update trigger for habits
CREATE TRIGGER update_personal_habits_updated_at
  BEFORE UPDATE ON personal_habits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on habit tables
ALTER TABLE personal_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_habit_completions ENABLE ROW LEVEL SECURITY;

-- Create policies that allow all operations (single user)
CREATE POLICY "Allow all operations" ON personal_habits FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON personal_habit_completions FOR ALL USING (true);

-- Example frequency_days values:
-- Daily: NULL (every day)
-- Weekly: NULL (once per week, any day)
-- Monthly: NULL (once per month, any day)
-- Specific days: [1,3,5] for Monday, Wednesday, Friday
-- Weekends: [0,6] for Sunday and Saturday
-- Weekdays: [1,2,3,4,5] for Monday through Friday