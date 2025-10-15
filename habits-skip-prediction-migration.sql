-- Migration: Add skip prediction analytics to habits
-- Run this after the initial habits-database.sql

-- Add skip prediction metadata to personal_habits table
ALTER TABLE personal_habits
ADD COLUMN last_skip_prediction_date DATE,
ADD COLUMN skip_risk_score DECIMAL(3,2) DEFAULT 0.00 CHECK (skip_risk_score >= 0 AND skip_risk_score <= 1),
ADD COLUMN last_skip_pattern TEXT; -- Store identified pattern (e.g., 'weekend_skip', 'stress_pattern', 'random')

-- Create habit analytics table to store historical skip patterns
CREATE TABLE personal_habit_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  habit_id UUID REFERENCES personal_habits(id) ON DELETE CASCADE,
  analysis_date DATE NOT NULL,
  total_expected_days INTEGER NOT NULL,
  total_completed_days INTEGER NOT NULL,
  completion_rate DECIMAL(5,2) NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  skip_pattern_detected VARCHAR(50), -- Pattern type: 'weekend_skip', 'weekday_skip', 'weekly_pattern', 'none'
  skip_days JSON, -- Array of day indices when skips commonly occur [0=Sunday, ..., 6=Saturday]
  average_skip_interval DECIMAL(5,2), -- Average days between skips
  next_predicted_skip_date DATE,
  prediction_confidence DECIMAL(3,2), -- 0.00 to 1.00
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for quick analytics lookups
CREATE INDEX idx_habit_analytics_habit_date ON personal_habit_analytics(habit_id, analysis_date DESC);

-- Enable RLS on analytics table
ALTER TABLE personal_habit_analytics ENABLE ROW LEVEL SECURITY;

-- Create policy for analytics table
CREATE POLICY "Allow all operations" ON personal_habit_analytics FOR ALL USING (true);

-- Comment on columns for documentation
COMMENT ON COLUMN personal_habits.skip_risk_score IS 'Calculated risk score (0-1) indicating likelihood of skipping today';
COMMENT ON COLUMN personal_habits.last_skip_pattern IS 'Last identified skip pattern for quick reference';
COMMENT ON TABLE personal_habit_analytics IS 'Historical analytics and skip prediction data for habits';
