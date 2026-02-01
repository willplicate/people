-- Wedding Guests RSVP Table
-- Run this in your Supabase SQL Editor

-- Create wedding_guests table
CREATE TABLE wedding_guests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  guest_name VARCHAR(200) NOT NULL,
  email VARCHAR(200),
  phone VARCHAR(50),
  rsvp_status VARCHAR(20) DEFAULT 'pending' CHECK (rsvp_status IN ('pending', 'attending', 'not_attending', 'maybe')),
  number_of_guests INTEGER DEFAULT 1,
  dietary_restrictions TEXT,
  plus_one_name VARCHAR(200),
  message TEXT,
  rsvp_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_wedding_guests_rsvp_status ON wedding_guests(rsvp_status);
CREATE INDEX idx_wedding_guests_email ON wedding_guests(email);
CREATE INDEX idx_wedding_guests_created_at ON wedding_guests(created_at DESC);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_wedding_guests_updated_at
  BEFORE UPDATE ON wedding_guests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE wedding_guests ENABLE ROW LEVEL SECURITY;

-- Create policy for public RSVP submission (INSERT only)
CREATE POLICY "Allow public RSVP submission"
  ON wedding_guests
  FOR INSERT
  WITH CHECK (true);

-- Create policy for authenticated admin access (SELECT, UPDATE, DELETE)
CREATE POLICY "Allow authenticated admin access"
  ON wedding_guests
  FOR ALL
  USING (true);