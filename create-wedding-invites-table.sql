-- Wedding Invites Table (for tracking who to invite)
-- Run this in your Supabase SQL Editor

-- Create wedding_invites table
CREATE TABLE wedding_invites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  address VARCHAR(500),
  category VARCHAR(100),
  likeliness_to_come INTEGER CHECK (likeliness_to_come >= 0 AND likeliness_to_come <= 5),
  invite_status VARCHAR(50) DEFAULT 'Not contacted' CHECK (invite_status IN ('Not contacted', 'Contacted - awaiting response', 'Confirmed attending', 'Confirmed not attending', 'No response')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_wedding_invites_category ON wedding_invites(category);
CREATE INDEX idx_wedding_invites_status ON wedding_invites(invite_status);
CREATE INDEX idx_wedding_invites_likeliness ON wedding_invites(likeliness_to_come);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_wedding_invites_updated_at
  BEFORE UPDATE ON wedding_invites
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE wedding_invites ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated access
CREATE POLICY "Allow authenticated access"
  ON wedding_invites
  FOR ALL
  USING (true);