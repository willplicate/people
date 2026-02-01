/**
 * Add week_sections table to store the three parts of each week
 *
 * Each week has 3 sections:
 * 1. Monday-Tuesday: Study Focus (concepts to learn)
 * 2. Wednesday-Saturday: Practical Experiments (hands-on work)
 * 3. Sunday: Knowledge Check (reflection and portfolio)
 *
 * This allows better formatting and display of the weekly structure
 */

-- Create week_sections table
CREATE TABLE IF NOT EXISTS week_sections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  week_id UUID NOT NULL REFERENCES learning_weeks(id) ON DELETE CASCADE,

  -- Section identification
  section_type VARCHAR(50) NOT NULL CHECK (section_type IN ('study_focus', 'practical_experiments', 'knowledge_check')),
  section_order INTEGER NOT NULL, -- 1, 2, 3

  -- Section metadata
  title VARCHAR(255) NOT NULL, -- e.g., "Study Focus (Monday-Tuesday)"
  day_range VARCHAR(100), -- e.g., "Monday-Tuesday", "Wednesday-Saturday", "Sunday"

  -- Section content (Markdown)
  content TEXT NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(week_id, section_type),
  UNIQUE(week_id, section_order)
);

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_week_sections_week_id ON week_sections(week_id);
CREATE INDEX IF NOT EXISTS idx_week_sections_order ON week_sections(week_id, section_order);

-- Add update trigger
CREATE OR REPLACE FUNCTION update_week_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER week_sections_updated_at
  BEFORE UPDATE ON week_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_week_sections_updated_at();

-- Add comments
COMMENT ON TABLE week_sections IS 'Stores the three distinct sections of each week (Study Focus, Practical Experiments, Knowledge Check)';
COMMENT ON COLUMN week_sections.section_type IS 'Type of section: study_focus, practical_experiments, knowledge_check';
COMMENT ON COLUMN week_sections.section_order IS 'Display order: 1 = Mon-Tue, 2 = Wed-Sat, 3 = Sun';
COMMENT ON COLUMN week_sections.day_range IS 'Human-readable day range like "Monday-Tuesday"';
COMMENT ON COLUMN week_sections.content IS 'Markdown content for this section';
