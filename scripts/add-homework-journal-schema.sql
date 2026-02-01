/**
 * Add homework journal (Homework for Life) feature
 *
 * Features:
 * 1. Daily journal entries with timestamped content appends
 * 2. Streak tracking based on consecutive days with entries
 * 3. Shared access - both users can view and contribute to all entries
 * 4. Archive of previous entries with full history
 */

-- ============================================================================
-- JOURNAL ENTRIES TABLE
-- ============================================================================
-- Daily journal entries with append support
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- One entry per calendar date
  date DATE NOT NULL UNIQUE,

  -- Content as JSONB array: [{text: string, timestamp: timestamptz}]
  -- Allows multiple appends throughout the day with individual timestamps
  content JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Tracking
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(), -- First entry timestamp (for streak calculation)
  updated_at TIMESTAMPTZ DEFAULT NOW(), -- Last append timestamp

  -- Constraints
  CHECK (jsonb_typeof(content) = 'array')
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_journal_entries_date ON journal_entries(date DESC);
CREATE INDEX idx_journal_entries_created_at ON journal_entries(created_at);
CREATE INDEX idx_journal_entries_created_by ON journal_entries(created_by);

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_journal_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER journal_entries_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_journal_entries_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view all journal entries (shared access)
CREATE POLICY "Authenticated users can view all journal entries"
  ON journal_entries FOR SELECT
  TO authenticated
  USING (true);

-- All authenticated users can create journal entries
CREATE POLICY "Authenticated users can create journal entries"
  ON journal_entries FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- All authenticated users can update journal entries (for appending)
CREATE POLICY "Authenticated users can update journal entries"
  ON journal_entries FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- All authenticated users can delete journal entries
CREATE POLICY "Authenticated users can delete journal entries"
  ON journal_entries FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Calculate current streak (consecutive days with entries from today backwards)
-- Excludes backfilled entries (where created_at date != entry date)
CREATE OR REPLACE FUNCTION calculate_journal_streak()
RETURNS INTEGER AS $$
DECLARE
  streak INTEGER := 0;
  current_check_date DATE := CURRENT_DATE;
  entry_exists BOOLEAN;
  entry_was_backfilled BOOLEAN;
BEGIN
  LOOP
    -- Check if entry exists for current_check_date and wasn't backfilled
    SELECT
      COUNT(*) > 0,
      CASE
        WHEN COUNT(*) > 0 THEN DATE(MIN(created_at)) != current_check_date
        ELSE false
      END
    INTO entry_exists, entry_was_backfilled
    FROM journal_entries
    WHERE date = current_check_date;

    -- If no entry exists or it was backfilled, stop counting
    IF NOT entry_exists OR entry_was_backfilled THEN
      EXIT;
    END IF;

    -- Increment streak and check previous day
    streak := streak + 1;
    current_check_date := current_check_date - INTERVAL '1 day';
  END LOOP;

  RETURN streak;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- View for recent journal entries with user details
CREATE OR REPLACE VIEW recent_journal_entries AS
SELECT
  je.id,
  je.date,
  je.content,
  u.email as created_by_email,
  je.created_at,
  je.updated_at,
  -- Calculate if this was a backfilled entry
  DATE(je.created_at) != je.date as is_backfilled
FROM journal_entries je
JOIN auth.users u ON je.created_by = u.id
ORDER BY je.date DESC;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE journal_entries IS 'Daily homework journal entries with append support and streak tracking';
COMMENT ON COLUMN journal_entries.content IS 'JSONB array of {text: string, timestamp: timestamptz} objects for each append';
COMMENT ON COLUMN journal_entries.created_at IS 'Timestamp of first entry creation - used for streak calculation to exclude backfills';
COMMENT ON FUNCTION calculate_journal_streak() IS 'Returns current streak of consecutive days with non-backfilled entries';