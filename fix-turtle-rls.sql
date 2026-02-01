-- Fix Row Level Security policies for turtle tables
-- This should be run in your Supabase SQL editor

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations on turtle_positions" ON turtle_positions;
DROP POLICY IF EXISTS "Allow all operations on turtle_trades" ON turtle_trades;
DROP POLICY IF EXISTS "Allow all operations on turtle_market_data" ON turtle_market_data;
DROP POLICY IF EXISTS "Allow all operations on turtle_assignments" ON turtle_assignments;

-- Option 1: Temporarily disable RLS for development
ALTER TABLE turtle_positions DISABLE ROW LEVEL SECURITY;
ALTER TABLE turtle_trades DISABLE ROW LEVEL SECURITY;
ALTER TABLE turtle_market_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE turtle_assignments DISABLE ROW LEVEL SECURITY;

-- Option 2: If you want to keep RLS enabled, use these policies instead:
-- (Comment out the DISABLE commands above and uncomment these)

/*
-- Enable RLS
ALTER TABLE turtle_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE turtle_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE turtle_market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE turtle_assignments ENABLE ROW LEVEL SECURITY;

-- Create permissive policies that allow all operations
CREATE POLICY "turtle_positions_policy" ON turtle_positions FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "turtle_trades_policy" ON turtle_trades FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "turtle_market_data_policy" ON turtle_market_data FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "turtle_assignments_policy" ON turtle_assignments FOR ALL TO public USING (true) WITH CHECK (true);
*/