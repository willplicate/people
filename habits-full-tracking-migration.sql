-- ============================================================================
-- HABIT FULL TRACKING MIGRATION
-- ============================================================================
-- Purpose: Extend the habits system to support detailed session tracking
--          for learning activities (studying, language practice, skills)
--
-- This enables tracking:
--   - How long you studied (duration)
--   - How engaged you were (1-5 scale)
--   - What subject/topic you worked on
--   - Notes about the session
--   - Patterns that predict when you'll give up or lose engagement
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Add "full tracking" mode to habits table
-- ----------------------------------------------------------------------------
-- Why: Some habits just need a checkmark (flossing, meditation)
--      Others need detailed data (studying Spanish, learning to code)
--      This flag controls which UI appears when logging completion
-- ----------------------------------------------------------------------------
ALTER TABLE personal_habits
ADD COLUMN full_tracking_enabled BOOLEAN DEFAULT false,
ADD COLUMN default_subject VARCHAR(100), -- e.g., "Spanish", "Math", "Sailing"
ADD COLUMN target_duration_minutes INTEGER, -- Optional goal: study 60 min/day
ADD COLUMN track_engagement BOOLEAN DEFAULT false; -- Whether to prompt for engagement rating

-- Add helpful comments on these columns
COMMENT ON COLUMN personal_habits.full_tracking_enabled IS 'When true, completing this habit requires duration, engagement, and notes';
COMMENT ON COLUMN personal_habits.default_subject IS 'Default subject/topic for this habit (e.g., "Spanish", "Mathematics")';
COMMENT ON COLUMN personal_habits.target_duration_minutes IS 'Target duration in minutes for each session (optional goal)';
COMMENT ON COLUMN personal_habits.track_engagement IS 'Whether to track engagement level (1-5) for this habit';


-- ----------------------------------------------------------------------------
-- STEP 2: Extend habit completions table with session details
-- ----------------------------------------------------------------------------
-- Why: When you complete a habit, we need to store MORE than just "I did it"
--      We need: How long? How focused? What did you study? Any reflections?
-- ----------------------------------------------------------------------------
ALTER TABLE personal_habit_completions
ADD COLUMN duration_minutes INTEGER, -- How long the session lasted
ADD COLUMN start_time TIMESTAMPTZ, -- When you started (for time-of-day patterns)
ADD COLUMN end_time TIMESTAMPTZ, -- When you finished
ADD COLUMN engagement_level INTEGER CHECK (engagement_level >= 1 AND engagement_level <= 5), -- 1=distracted, 5=fully engaged
ADD COLUMN subject VARCHAR(100), -- What you studied (can differ from default)
ADD COLUMN session_notes TEXT, -- Reflections: "Felt tired", "Finally understood recursion!"
ADD COLUMN mood VARCHAR(20) CHECK (mood IN ('energized', 'focused', 'tired', 'frustrated', 'motivated', 'neutral')); -- Emotional state

-- Add helpful comments
COMMENT ON COLUMN personal_habit_completions.duration_minutes IS 'Length of session in minutes (e.g., studied for 45 minutes)';
COMMENT ON COLUMN personal_habit_completions.start_time IS 'When the session started (helps identify if you study better in morning vs night)';
COMMENT ON COLUMN personal_habit_completions.end_time IS 'When the session ended';
COMMENT ON COLUMN personal_habit_completions.engagement_level IS 'How engaged you were: 1=very distracted, 3=okay, 5=deep focus';
COMMENT ON COLUMN personal_habit_completions.subject IS 'What you studied (e.g., "Spanish verbs", "Sailing knots", "React hooks")';
COMMENT ON COLUMN personal_habit_completions.session_notes IS 'Your reflections about the session';
COMMENT ON COLUMN personal_habit_completions.mood IS 'Your emotional state during the session';


-- ----------------------------------------------------------------------------
-- STEP 3: Create study analytics table for advanced predictions
-- ----------------------------------------------------------------------------
-- Why: To predict when you'll give up, we need to track:
--      - Trends in engagement (declining = warning sign)
--      - Study duration patterns (too much = burnout risk)
--      - Time gaps between sessions (3+ days missed = higher quit risk)
-- ----------------------------------------------------------------------------
CREATE TABLE personal_study_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  habit_id UUID REFERENCES personal_habits(id) ON DELETE CASCADE,
  analysis_date DATE NOT NULL,

  -- ENGAGEMENT METRICS
  -- These track how motivated and focused you are
  avg_engagement_last_7_days DECIMAL(3,2), -- Average engagement over past week
  avg_engagement_last_30_days DECIMAL(3,2), -- Average engagement over past month
  engagement_trend VARCHAR(20) CHECK (engagement_trend IN ('improving', 'stable', 'declining', 'critical')),
  lowest_engagement_day INTEGER, -- Which day (0-6) has worst engagement

  -- DURATION METRICS
  -- These track how much time you're putting in
  total_minutes_last_7_days INTEGER, -- Total study time this week
  total_minutes_last_30_days INTEGER, -- Total study time this month
  avg_session_duration_minutes DECIMAL(5,2), -- Average length of each session

  -- CONSISTENCY METRICS
  -- These track how regularly you're practicing
  sessions_last_7_days INTEGER, -- How many times you studied this week
  longest_gap_days INTEGER, -- Longest break between sessions (high = risk!)
  current_active_streak_days INTEGER, -- Days in a row you've studied

  -- RISK PREDICTIONS
  -- These are the ML-style predictions to warn you
  burnout_risk_score DECIMAL(3,2) CHECK (burnout_risk_score >= 0 AND burnout_risk_score <= 1),
  disengagement_risk_score DECIMAL(3,2) CHECK (disengagement_risk_score >= 0 AND disengagement_risk_score <= 1),
  quit_risk_score DECIMAL(3,2) CHECK (quit_risk_score >= 0 AND quit_risk_score <= 1),

  -- PATTERN DETECTION
  -- These identify your behavior patterns
  best_time_of_day VARCHAR(20), -- When you study most effectively: 'morning', 'afternoon', 'evening', 'night'
  best_day_of_week INTEGER, -- Which day (0-6) you study best on
  common_mood VARCHAR(20), -- Your most common emotional state while studying

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments explaining what each metric means
COMMENT ON COLUMN personal_study_analytics.engagement_trend IS 'Is your focus improving or declining over time?';
COMMENT ON COLUMN personal_study_analytics.burnout_risk_score IS 'Risk (0-1) of burning out from over-studying without breaks';
COMMENT ON COLUMN personal_study_analytics.disengagement_risk_score IS 'Risk (0-1) of losing interest based on declining engagement levels';
COMMENT ON COLUMN personal_study_analytics.quit_risk_score IS 'Overall risk (0-1) of giving up this habit entirely';
COMMENT ON COLUMN personal_study_analytics.best_time_of_day IS 'Time when your engagement and duration are highest';

-- Create index for fast lookups
CREATE INDEX idx_study_analytics_habit_date ON personal_study_analytics(habit_id, analysis_date DESC);

-- Enable row level security
ALTER TABLE personal_study_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations" ON personal_study_analytics FOR ALL USING (true);


-- ----------------------------------------------------------------------------
-- STEP 4: Create view for quick study session summaries
-- ----------------------------------------------------------------------------
-- Why: Instead of writing complex queries every time, this view gives us
--      a ready-made summary of each study session with all relevant data
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW study_session_summary AS
SELECT
  hc.id,
  hc.habit_id,
  h.name as habit_name,
  h.default_subject,
  hc.completed_date,
  hc.start_time,
  hc.end_time,
  hc.duration_minutes,
  hc.engagement_level,
  hc.subject,
  hc.session_notes,
  hc.mood,
  -- Calculate how close to target duration
  CASE
    WHEN h.target_duration_minutes IS NOT NULL AND hc.duration_minutes IS NOT NULL
    THEN ROUND((hc.duration_minutes::DECIMAL / h.target_duration_minutes) * 100)
    ELSE NULL
  END as target_completion_percentage,
  hc.created_at
FROM personal_habit_completions hc
JOIN personal_habits h ON h.id = hc.habit_id
WHERE h.full_tracking_enabled = true
ORDER BY hc.completed_date DESC, hc.start_time DESC;

COMMENT ON VIEW study_session_summary IS 'Quick view of all study sessions with calculated metrics';


-- ----------------------------------------------------------------------------
-- EXAMPLE DATA (for testing)
-- ----------------------------------------------------------------------------
-- Uncomment to insert sample data:

/*
-- Create a "Learn Spanish" habit with full tracking
INSERT INTO personal_habits (name, description, frequency_type, full_tracking_enabled, default_subject, target_duration_minutes, track_engagement, is_active)
VALUES (
  'Learn Spanish',
  'Daily Spanish practice - vocabulary, grammar, conversation',
  'daily',
  true,
  'Spanish',
  60, -- Target: 1 hour per day
  true,
  true
);

-- Log a study session
INSERT INTO personal_habit_completions (
  habit_id,
  completed_date,
  start_time,
  end_time,
  duration_minutes,
  engagement_level,
  subject,
  session_notes,
  mood
)
SELECT
  id,
  CURRENT_DATE,
  NOW() - INTERVAL '45 minutes',
  NOW(),
  45,
  4, -- Pretty engaged
  'Spanish verb conjugations',
  'Finally understood the subjunctive mood! Still struggle with irregular verbs.',
  'motivated'
FROM personal_habits WHERE name = 'Learn Spanish';
*/
