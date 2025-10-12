-- ============================================================================
-- LEARNING MANAGEMENT SYSTEM (LMS) - DATABASE SCHEMA
-- ============================================================================
-- Purpose: Track your 20-week AI/ML Analyst training program
--
-- Structure:
--   1. Program info (what role you're training for, program description)
--   2. Weekly curriculum (20 weeks, each with topics and resources)
--   3. Learning sessions (track when you study, how long, your notes)
--
-- This enables:
--   - Navigate between weeks easily
--   - See all topics for each week
--   - Log study sessions with time tracking and reflections
--   - Later: Analyze patterns, identify difficult topics, track progress
-- ============================================================================


-- ----------------------------------------------------------------------------
-- TABLE 1: learning_programs
-- ----------------------------------------------------------------------------
-- Stores: High-level information about the training program
-- Why: You might do multiple programs (e.g., AI/ML now, sailing later)
-- ----------------------------------------------------------------------------
CREATE TABLE learning_programs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- BASIC INFO
  name VARCHAR(200) NOT NULL, -- e.g., "AI/ML Analyst Training"
  description TEXT, -- What this program is about
  role_description TEXT, -- Description of the target role

  -- TIMELINE
  total_weeks INTEGER NOT NULL, -- e.g., 20
  start_date DATE, -- When you started (or plan to start)
  target_end_date DATE, -- When you plan to finish

  -- STATUS
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),

  -- INTRO CONTENT
  -- This is separate from weekly content - it's the "overview" material
  intro_content TEXT, -- Markdown content for the intro page

  -- METADATA
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE learning_programs IS 'Training programs you are completing';
COMMENT ON COLUMN learning_programs.intro_content IS 'Overview content shown before Week 1 (supports Markdown)';


-- ----------------------------------------------------------------------------
-- TABLE 2: learning_weeks
-- ----------------------------------------------------------------------------
-- Stores: Content for each week of the program
-- Why: Each week has different topics, resources, and goals
-- ----------------------------------------------------------------------------
CREATE TABLE learning_weeks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  program_id UUID REFERENCES learning_programs(id) ON DELETE CASCADE,

  -- WEEK INFO
  week_number INTEGER NOT NULL, -- 1-20
  title VARCHAR(200) NOT NULL, -- e.g., "Introduction to Machine Learning"
  description TEXT, -- Overview of what you'll learn this week

  -- LEARNING OBJECTIVES
  -- What you should be able to do by the end of this week
  objectives TEXT[], -- Array of strings: ["Understand supervised learning", "Build first model"]

  -- CONTENT
  content TEXT, -- Main content (supports Markdown)

  -- RESOURCES
  -- Links to articles, videos, courses, etc.
  resources JSONB, -- Flexible structure: [{ type: 'video', url: '...', title: '...' }]

  -- METADATA
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure each program has unique week numbers
  UNIQUE(program_id, week_number)
);

COMMENT ON TABLE learning_weeks IS 'Weekly curriculum content for a learning program';
COMMENT ON COLUMN learning_weeks.objectives IS 'Learning objectives for this week';
COMMENT ON COLUMN learning_weeks.resources IS 'External resources (videos, articles, courses) as JSON';


-- ----------------------------------------------------------------------------
-- TABLE 3: learning_topics
-- ----------------------------------------------------------------------------
-- Stores: Individual topics within each week
-- Why: Each week covers multiple topics (e.g., "Linear Regression", "Gradient Descent")
-- ----------------------------------------------------------------------------
CREATE TABLE learning_topics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  week_id UUID REFERENCES learning_weeks(id) ON DELETE CASCADE,

  -- TOPIC INFO
  topic_order INTEGER NOT NULL, -- Order within the week (1, 2, 3...)
  title VARCHAR(200) NOT NULL, -- e.g., "Linear Regression"
  description TEXT, -- What this topic covers

  -- CONTENT
  content TEXT, -- Detailed explanation (supports Markdown)

  -- ESTIMATED TIME
  estimated_hours DECIMAL(4,2), -- How long this topic should take (e.g., 2.5 hours)

  -- COMPLETION STATUS
  -- This is manually marked by you when you feel you've mastered it
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,

  -- DIFFICULTY (self-assessed)
  difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),

  -- METADATA
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE learning_topics IS 'Individual topics within each week';
COMMENT ON COLUMN learning_topics.difficulty_rating IS 'Your assessment: 1=easy, 5=very difficult';


-- ----------------------------------------------------------------------------
-- TABLE 4: learning_sessions
-- ----------------------------------------------------------------------------
-- Stores: Records of your study sessions
-- Why: Track WHEN you study, HOW LONG, and YOUR REFLECTIONS
--
-- This is the core tracking table - every time you study, you log a session
-- ----------------------------------------------------------------------------
CREATE TABLE learning_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- WHAT YOU STUDIED
  program_id UUID REFERENCES learning_programs(id) ON DELETE CASCADE,
  week_id UUID REFERENCES learning_weeks(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES learning_topics(id) ON DELETE SET NULL, -- Optional: specific topic

  -- WHEN YOU STUDIED
  session_date DATE NOT NULL, -- Which day
  start_time TIMESTAMPTZ, -- When you started
  end_time TIMESTAMPTZ, -- When you finished
  duration_minutes INTEGER, -- How long (can be calculated from start/end, or entered manually)

  -- WHAT YOU LEARNED
  session_notes TEXT, -- Your reflections, key takeaways, questions

  -- HOW IT WENT
  engagement_level INTEGER CHECK (engagement_level >= 1 AND engagement_level <= 5), -- How focused were you?
  difficulty_encountered INTEGER CHECK (difficulty_encountered >= 1 AND difficulty_encountered <= 5), -- How hard was the material?
  mood VARCHAR(20) CHECK (mood IN ('energized', 'focused', 'tired', 'frustrated', 'motivated', 'confused', 'confident')),

  -- TAGS
  -- Flexible tagging: ["breakthrough", "struggled-with-math", "need-review"]
  tags TEXT[],

  -- METADATA
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE learning_sessions IS 'Log of every study session';
COMMENT ON COLUMN learning_sessions.session_notes IS 'Your reflections: what you learned, questions, breakthroughs, struggles';
COMMENT ON COLUMN learning_sessions.engagement_level IS '1=very distracted, 5=deep focus';
COMMENT ON COLUMN learning_sessions.difficulty_encountered IS '1=easy to understand, 5=very confusing';
COMMENT ON COLUMN learning_sessions.tags IS 'Flexible tags for analysis: ["breakthrough", "need-review", "math-heavy"]';


-- ----------------------------------------------------------------------------
-- INDEXES for performance
-- ----------------------------------------------------------------------------
CREATE INDEX idx_learning_weeks_program ON learning_weeks(program_id, week_number);
CREATE INDEX idx_learning_topics_week ON learning_topics(week_id, topic_order);
CREATE INDEX idx_learning_sessions_date ON learning_sessions(session_date DESC);
CREATE INDEX idx_learning_sessions_program ON learning_sessions(program_id, session_date DESC);
CREATE INDEX idx_learning_sessions_week ON learning_sessions(week_id, session_date DESC);


-- ----------------------------------------------------------------------------
-- UPDATE TRIGGERS
-- ----------------------------------------------------------------------------
CREATE TRIGGER update_learning_programs_updated_at
  BEFORE UPDATE ON learning_programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_weeks_updated_at
  BEFORE UPDATE ON learning_weeks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_topics_updated_at
  BEFORE UPDATE ON learning_topics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_sessions_updated_at
  BEFORE UPDATE ON learning_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------
ALTER TABLE learning_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;

-- Policies (allow all for single-user app)
CREATE POLICY "Allow all operations" ON learning_programs FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON learning_weeks FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON learning_topics FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON learning_sessions FOR ALL USING (true);


-- ----------------------------------------------------------------------------
-- HELPFUL VIEWS
-- ----------------------------------------------------------------------------

-- View: Get week progress summary
CREATE OR REPLACE VIEW week_progress_summary AS
SELECT
  w.id as week_id,
  w.program_id,
  w.week_number,
  w.title,

  -- Topic completion stats
  COUNT(t.id) as total_topics,
  COUNT(t.id) FILTER (WHERE t.is_completed = true) as completed_topics,
  CASE
    WHEN COUNT(t.id) > 0
    THEN ROUND((COUNT(t.id) FILTER (WHERE t.is_completed = true)::DECIMAL / COUNT(t.id)) * 100)
    ELSE 0
  END as completion_percentage,

  -- Study session stats
  COUNT(DISTINCT s.id) as total_sessions,
  COALESCE(SUM(s.duration_minutes), 0) as total_study_minutes,
  ROUND(AVG(s.engagement_level), 2) as avg_engagement,

  -- Time tracking
  MIN(s.session_date) as first_studied,
  MAX(s.session_date) as last_studied

FROM learning_weeks w
LEFT JOIN learning_topics t ON t.week_id = w.id
LEFT JOIN learning_sessions s ON s.week_id = w.id
GROUP BY w.id, w.program_id, w.week_number, w.title
ORDER BY w.week_number;

COMMENT ON VIEW week_progress_summary IS 'Summary of progress and study stats for each week';


-- View: Recent learning sessions with context
CREATE OR REPLACE VIEW recent_learning_sessions AS
SELECT
  s.id,
  s.session_date,
  s.duration_minutes,
  s.engagement_level,
  s.session_notes,
  s.tags,

  -- Context
  p.name as program_name,
  w.week_number,
  w.title as week_title,
  t.title as topic_title,

  s.created_at
FROM learning_sessions s
JOIN learning_programs p ON p.id = s.program_id
LEFT JOIN learning_weeks w ON w.id = s.week_id
LEFT JOIN learning_topics t ON t.id = s.topic_id
ORDER BY s.session_date DESC, s.created_at DESC
LIMIT 100;

COMMENT ON VIEW recent_learning_sessions IS 'Last 100 learning sessions with full context';


-- ============================================================================
-- EXAMPLE DATA (for testing)
-- ============================================================================
-- Uncomment to insert sample AI/ML program:

/*
-- Create the program
INSERT INTO learning_programs (name, description, role_description, total_weeks, intro_content)
VALUES (
  'AI/ML Analyst Training',
  'Comprehensive 20-week program to become a professional AI/ML Analyst',
  'An AI/ML Analyst bridges the gap between data science and business. They analyze data using machine learning, build predictive models, and communicate insights to stakeholders.',
  20,
  '# Welcome to AI/ML Analyst Training

## Program Overview
This 20-week intensive program will take you from beginner to job-ready AI/ML Analyst.

## What You''ll Learn
- Python programming and data analysis
- Machine learning fundamentals
- Model building and evaluation
- Real-world project experience
- Communication and presentation skills

## Time Commitment
- **Recommended**: 10-15 hours per week
- **Minimum**: 7 hours per week
- **Includes**: Video lectures, readings, coding exercises, projects

## Let''s begin!'
);

-- Create Week 1
INSERT INTO learning_weeks (program_id, week_number, title, description, objectives, content)
SELECT
  id,
  1,
  'Introduction to AI/ML',
  'Understand what AI and ML are, and what an AI/ML Analyst does',
  ARRAY[
    'Define artificial intelligence and machine learning',
    'Understand the AI/ML Analyst role',
    'Set up your development environment'
  ],
  '# Week 1: Introduction to AI/ML

## Overview
Welcome to your first week! This week is about understanding the landscape...

## Key Concepts
- AI vs ML vs Deep Learning
- Supervised vs Unsupervised Learning
- The ML workflow

## Setup
1. Install Python 3.9+
2. Install VS Code
3. Create virtual environment'
FROM learning_programs WHERE name = 'AI/ML Analyst Training';

-- Add topics to Week 1
INSERT INTO learning_topics (week_id, topic_order, title, description, estimated_hours)
SELECT
  id,
  1,
  'What is Machine Learning?',
  'Core concepts and definitions',
  2.0
FROM learning_weeks WHERE week_number = 1;

INSERT INTO learning_topics (week_id, topic_order, title, description, estimated_hours)
SELECT
  id,
  2,
  'Python Development Environment',
  'Setting up your tools',
  3.0
FROM learning_weeks WHERE week_number = 1;
*/
