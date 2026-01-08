-- Create table to store context files
CREATE TABLE IF NOT EXISTS life_coach_context (
  key TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (but allow all for now - simplest approach)
ALTER TABLE life_coach_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to context" ON life_coach_context
  FOR ALL USING (true) WITH CHECK (true);
