-- Complete the database setup - run only the parts that might be missing

-- Create remaining tables if they don't exist
CREATE TABLE IF NOT EXISTS personal_contact_info (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contact_id UUID REFERENCES personal_contacts(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('phone', 'email', 'address')),
  label VARCHAR(10) NOT NULL CHECK (label IN ('home', 'work', 'mobile', 'other')),
  value TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS personal_interactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contact_id UUID REFERENCES personal_contacts(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('call', 'text', 'email', 'meetup', 'other')),
  notes TEXT NOT NULL,
  interaction_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS personal_reminders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contact_id UUID REFERENCES personal_contacts(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('communication', 'birthday_week', 'birthday_day')),
  scheduled_for TIMESTAMPTZ NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'dismissed')),
  message VARCHAR(200) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

-- Create indexes for performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_personal_contacts_communication_frequency ON personal_contacts(communication_frequency, last_contacted_at);
CREATE INDEX IF NOT EXISTS idx_personal_contacts_birthday ON personal_contacts(birthday);
CREATE INDEX IF NOT EXISTS idx_personal_reminders_scheduled_status ON personal_reminders(scheduled_for, status);
CREATE INDEX IF NOT EXISTS idx_personal_interactions_contact_date ON personal_interactions(contact_id, interaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_personal_contact_info_primary ON personal_contact_info(contact_id, is_primary);

-- Full-text search indexes (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_personal_contacts_search') THEN
    CREATE INDEX idx_personal_contacts_search ON personal_contacts USING GIN(to_tsvector('english', first_name || ' ' || COALESCE(last_name, '') || ' ' || COALESCE(nickname, '')));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_personal_interactions_notes_search') THEN
    CREATE INDEX idx_personal_interactions_notes_search ON personal_interactions USING GIN(to_tsvector('english', notes));
  END IF;
END $$;

-- Create functions and triggers (replace if exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop and recreate triggers to ensure they work
DROP TRIGGER IF EXISTS update_personal_contacts_updated_at ON personal_contacts;
DROP TRIGGER IF EXISTS update_personal_contact_info_updated_at ON personal_contact_info;
DROP TRIGGER IF EXISTS update_personal_interactions_updated_at ON personal_interactions;

CREATE TRIGGER update_personal_contacts_updated_at BEFORE UPDATE ON personal_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_personal_contact_info_updated_at BEFORE UPDATE ON personal_contact_info FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_personal_interactions_updated_at BEFORE UPDATE ON personal_interactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Last contacted trigger
CREATE OR REPLACE FUNCTION update_personal_last_contacted_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE personal_contacts
  SET last_contacted_at = NEW.interaction_date
  WHERE id = NEW.contact_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_personal_contact_last_contacted ON personal_interactions;
CREATE TRIGGER update_personal_contact_last_contacted AFTER INSERT ON personal_interactions FOR EACH ROW EXECUTE FUNCTION update_personal_last_contacted_at();

-- Enable RLS on all personal CRM tables
ALTER TABLE personal_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_contact_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_reminders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and recreate them
DROP POLICY IF EXISTS "Allow all operations" ON personal_contacts;
DROP POLICY IF EXISTS "Allow all operations" ON personal_contact_info;
DROP POLICY IF EXISTS "Allow all operations" ON personal_interactions;
DROP POLICY IF EXISTS "Allow all operations" ON personal_reminders;

CREATE POLICY "Allow all operations" ON personal_contacts FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON personal_contact_info FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON personal_interactions FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON personal_reminders FOR ALL USING (true);