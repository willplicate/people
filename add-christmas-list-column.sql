-- Add christmas_list column to contacts table
ALTER TABLE contacts ADD COLUMN christmas_list BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN contacts.christmas_list IS 'Whether this contact should be included in the Christmas card/letter list';