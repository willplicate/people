-- Add christmas_list column to contacts table
ALTER TABLE contacts
ADD COLUMN christmas_list BOOLEAN DEFAULT false;

-- Add a comment for documentation
COMMENT ON COLUMN contacts.christmas_list IS 'Whether this contact should be included in the Christmas card/letter list';

-- Verify the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'contacts'
AND column_name = 'christmas_list';