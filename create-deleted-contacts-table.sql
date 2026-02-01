-- Create table to track deleted contacts to prevent re-import during sync
CREATE TABLE personal_deleted_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identifiers from the original contact
  google_resource_name TEXT, -- Google's unique identifier
  email TEXT, -- Primary email if available
  full_name TEXT NOT NULL, -- Full name for identification
  first_name TEXT,
  last_name TEXT,

  -- Metadata
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  deleted_by TEXT, -- Could track who deleted it
  reason TEXT DEFAULT 'user_deleted', -- 'user_deleted', 'bulk_deleted', etc.

  -- Original contact info for reference
  original_contact_id UUID, -- Reference to the deleted contact (may not exist anymore)

  -- Indexes for fast lookup during sync
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for efficient lookups during sync
CREATE INDEX idx_deleted_contacts_google_resource ON personal_deleted_contacts(google_resource_name);
CREATE INDEX idx_deleted_contacts_email ON personal_deleted_contacts(email);
CREATE INDEX idx_deleted_contacts_name ON personal_deleted_contacts(full_name);
CREATE INDEX idx_deleted_contacts_deleted_at ON personal_deleted_contacts(deleted_at);

-- Add comment
COMMENT ON TABLE personal_deleted_contacts IS 'Tracks contacts that were deleted to prevent re-importing during Google sync';