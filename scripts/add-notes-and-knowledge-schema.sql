/**
 * Add notes and knowledge base tables
 *
 * Features:
 * 1. Weekly notes - freeform notes for each week
 * 2. Concept knowledge base - structured concepts for quiz generation
 * 3. Wednesday project discussions - templates and actual discussions
 */

-- ============================================================================
-- WEEKLY NOTES TABLE
-- ============================================================================
-- Stores freeform notes for each week
CREATE TABLE IF NOT EXISTS week_notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  week_id UUID NOT NULL REFERENCES learning_weeks(id) ON DELETE CASCADE,

  -- Note content
  note_date DATE DEFAULT CURRENT_DATE,
  content TEXT NOT NULL,

  -- Categorization
  note_type VARCHAR(50) CHECK (note_type IN ('general', 'breakthrough', 'question', 'struggle', 'project_idea', 'review')),
  tags TEXT[], -- Flexible tagging

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_week_notes_week_id ON week_notes(week_id);
CREATE INDEX idx_week_notes_date ON week_notes(note_date);

-- ============================================================================
-- KNOWLEDGE BASE TABLE
-- ============================================================================
-- Stores learned concepts that can be used for quiz generation
CREATE TABLE IF NOT EXISTS knowledge_concepts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  week_id UUID NOT NULL REFERENCES learning_weeks(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES learning_topics(id) ON DELETE SET NULL,

  -- Concept details
  concept_name VARCHAR(255) NOT NULL,
  definition TEXT NOT NULL, -- What it is
  explanation TEXT, -- How it works / why it matters
  examples TEXT[], -- Real-world examples
  related_concepts TEXT[], -- Links to other concepts

  -- Learning metadata
  understanding_level INTEGER CHECK (understanding_level >= 1 AND understanding_level <= 5), -- 1=basic, 5=expert
  last_reviewed DATE,
  times_reviewed INTEGER DEFAULT 0,

  -- Quiz generation hints
  quiz_difficulty VARCHAR(20) CHECK (quiz_difficulty IN ('easy', 'medium', 'hard')),
  quiz_focus VARCHAR(50) CHECK (quiz_focus IN ('definition', 'application', 'comparison', 'calculation')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_knowledge_week_id ON knowledge_concepts(week_id);
CREATE INDEX idx_knowledge_topic_id ON knowledge_concepts(topic_id);
CREATE INDEX idx_knowledge_understanding ON knowledge_concepts(understanding_level);

-- ============================================================================
-- WEDNESDAY PROJECT DISCUSSIONS TABLE
-- ============================================================================
-- Stores Wednesday project discussion templates and actual discussions
CREATE TABLE IF NOT EXISTS project_discussions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  week_id UUID NOT NULL REFERENCES learning_weeks(id) ON DELETE CASCADE,

  -- Discussion metadata
  discussion_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),

  -- Template (pre-filled questions based on week)
  template_questions TEXT[], -- Questions to ask Claude

  -- Actual discussion
  project_idea TEXT, -- Your project idea
  claude_feedback TEXT, -- Claude's suggestions
  refined_approach TEXT, -- Your refined plan after discussion
  implementation_notes TEXT, -- Notes on how to implement

  -- Outcome
  confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5), -- How confident you feel
  estimated_hours INTEGER, -- How long you think it will take

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_project_discussions_week_id ON project_discussions(week_id);
CREATE INDEX idx_project_discussions_date ON project_discussions(discussion_date);
CREATE INDEX idx_project_discussions_status ON project_discussions(status);

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_week_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER week_notes_updated_at
  BEFORE UPDATE ON week_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_week_notes_updated_at();

CREATE OR REPLACE FUNCTION update_knowledge_concepts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER knowledge_concepts_updated_at
  BEFORE UPDATE ON knowledge_concepts
  FOR EACH ROW
  EXECUTE FUNCTION update_knowledge_concepts_updated_at();

CREATE OR REPLACE FUNCTION update_project_discussions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER project_discussions_updated_at
  BEFORE UPDATE ON project_discussions
  FOR EACH ROW
  EXECUTE FUNCTION update_project_discussions_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE week_notes IS 'Freeform notes for each week of learning';
COMMENT ON TABLE knowledge_concepts IS 'Structured knowledge base of learned concepts for quiz generation';
COMMENT ON TABLE project_discussions IS 'Wednesday project discussion templates and actual conversations with Claude';

COMMENT ON COLUMN knowledge_concepts.understanding_level IS '1=basic awareness, 2=can explain, 3=can apply, 4=can teach, 5=expert/intuitive';
COMMENT ON COLUMN knowledge_concepts.quiz_focus IS 'What type of quiz questions work best for this concept';
COMMENT ON COLUMN project_discussions.template_questions IS 'Pre-generated questions to guide Wednesday discussion with Claude';
