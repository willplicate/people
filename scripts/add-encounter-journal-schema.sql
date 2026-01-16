-- Personal Encounter Journal Schema
-- Private journal for tracking personal encounters

-- Create the table
CREATE TABLE IF NOT EXISTS personal_encounter_journal (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Core data fields
  encounter_date TIMESTAMPTZ NOT NULL,
  partner_description TEXT,
  location TEXT,
  private_notes TEXT,

  -- Tracking columns
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_encounter_journal_date
  ON personal_encounter_journal(encounter_date DESC);

CREATE INDEX IF NOT EXISTS idx_encounter_journal_created_by
  ON personal_encounter_journal(created_by);

CREATE INDEX IF NOT EXISTS idx_encounter_journal_created_by_date
  ON personal_encounter_journal(created_by, encounter_date DESC);

-- Create update trigger
CREATE OR REPLACE FUNCTION update_personal_encounter_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER personal_encounter_updated_at
  BEFORE UPDATE ON personal_encounter_journal
  FOR EACH ROW
  EXECUTE FUNCTION update_personal_encounter_updated_at();

-- Enable Row Level Security
ALTER TABLE personal_encounter_journal ENABLE ROW LEVEL SECURITY;

-- RLS Policies - CRITICAL: Users can ONLY access their own entries
CREATE POLICY "Users can view their own entries"
  ON personal_encounter_journal FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can create their own entries"
  ON personal_encounter_journal FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own entries"
  ON personal_encounter_journal FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own entries"
  ON personal_encounter_journal FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON personal_encounter_journal TO authenticated;
