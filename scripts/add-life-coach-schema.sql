-- Life Coach System Database Schema
-- Created: 2026-01-02
-- Purpose: Track habits and coaching conversations for mindset work

-- Habits (quantifiable behaviors to track)
CREATE TABLE IF NOT EXISTS life_habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('cultivate', 'eliminate', 'limit')),
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  target_count INTEGER DEFAULT 1, -- For "max 2x daily" type limits
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily habit completion logs
CREATE TABLE IF NOT EXISTS life_habit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id UUID NOT NULL REFERENCES life_habits(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  count INTEGER DEFAULT 0, -- For countable habits (e.g., "checked app 3 times")
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(habit_id, log_date)
);

-- Coaching chat messages
CREATE TABLE IF NOT EXISTS life_coach_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  message_date DATE NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  role VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  context_type VARCHAR(20), -- 'morning', 'anxiety', 'trading', 'reflection', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI-spotted insights and patterns
CREATE TABLE IF NOT EXISTS life_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  insight_date DATE NOT NULL,
  pattern_type VARCHAR(30), -- 'imposter', 'catastrophizing', 'trading_drift', etc.
  title TEXT NOT NULL,
  description TEXT,
  evidence TEXT[], -- Array of references to specific messages or events
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_life_habits_user ON life_habits(user_id);
CREATE INDEX IF NOT EXISTS idx_life_habit_logs_habit_date ON life_habit_logs(habit_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_life_coach_messages_user_date ON life_coach_messages(user_id, message_date DESC, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_life_coach_messages_context ON life_coach_messages(context_type);
CREATE INDEX IF NOT EXISTS idx_life_insights_user_date ON life_insights(user_id, insight_date DESC);
CREATE INDEX IF NOT EXISTS idx_life_insights_pattern ON life_insights(pattern_type);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_life_habits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER life_habits_updated_at
  BEFORE UPDATE ON life_habits
  FOR EACH ROW
  EXECUTE FUNCTION update_life_habits_updated_at();

-- Add table references to constants (for TypeScript)
COMMENT ON TABLE life_habits IS 'Life coach: User habits to cultivate or eliminate';
COMMENT ON TABLE life_habit_logs IS 'Life coach: Daily habit completion tracking';
COMMENT ON TABLE life_coach_messages IS 'Life coach: Conversational coaching chat history';
COMMENT ON TABLE life_insights IS 'Life coach: AI-spotted behavioral patterns and insights';
