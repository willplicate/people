-- Add emergency contact flag to personal_contacts table
-- Run this in your Supabase SQL Editor after the initial setup

ALTER TABLE personal_contacts
ADD COLUMN is_emergency BOOLEAN DEFAULT false;

-- Add index for performance when filtering emergency contacts
CREATE INDEX idx_personal_contacts_emergency ON personal_contacts(is_emergency) WHERE is_emergency = true;

-- Update the comment to reflect the new column
COMMENT ON COLUMN personal_contacts.is_emergency IS 'Flag to mark contact as emergency contact for quick access';