-- Turtle Trading System Tables
-- Run this in your LinkedinCRM Supabase database

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create turtle_positions table
CREATE TABLE turtle_positions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  position_name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  leaps_strike DECIMAL(10,2) NOT NULL,
  leaps_expiry DATE NOT NULL,
  leaps_cost_basis DECIMAL(10,2) NOT NULL,
  current_value DECIMAL(10,2),
  current_delta DECIMAL(6,4),
  contracts INTEGER NOT NULL,
  status TEXT CHECK (status IN ('active', 'closed', 'called_away')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create turtle_trades table
CREATE TABLE turtle_trades (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  position_id UUID REFERENCES turtle_positions(id) ON DELETE CASCADE,
  trade_date DATE NOT NULL,
  action TEXT CHECK (action IN ('sell', 'buy_to_close', 'roll_call', 'assignment')) NOT NULL,
  strike DECIMAL(10,2),
  premium DECIMAL(10,2) NOT NULL,
  expiry DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create turtle_market_data table
CREATE TABLE turtle_market_data (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  symbol TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  ema21 DECIMAL(10,2),
  ema50 DECIMAL(10,2),
  rsi DECIMAL(5,2),
  vix DECIMAL(5,2),
  timestamp TIMESTAMPTZ NOT NULL,
  last_api_update TIMESTAMPTZ NOT NULL
);

-- Create turtle_assignments table
CREATE TABLE turtle_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  position_id UUID REFERENCES turtle_positions(id) ON DELETE CASCADE,
  trade_id UUID REFERENCES turtle_trades(id) ON DELETE CASCADE,
  assignment_date DATE NOT NULL,
  assignment_type TEXT CHECK (assignment_type IN ('stock_assigned', 'expires_worthless', 'leaps_called_away')) NOT NULL,
  spy_price_at_assignment DECIMAL(10,2),
  pnl_impact DECIMAL(10,2) NOT NULL,
  notes TEXT
);

-- Create indexes for better performance
CREATE INDEX idx_turtle_positions_symbol ON turtle_positions(symbol);
CREATE INDEX idx_turtle_positions_status ON turtle_positions(status);
CREATE INDEX idx_turtle_trades_position_id ON turtle_trades(position_id);
CREATE INDEX idx_turtle_trades_trade_date ON turtle_trades(trade_date);
CREATE INDEX idx_turtle_market_data_symbol ON turtle_market_data(symbol);
CREATE INDEX idx_turtle_market_data_timestamp ON turtle_market_data(timestamp);
CREATE INDEX idx_turtle_assignments_position_id ON turtle_assignments(position_id);

-- Enable Row Level Security (RLS) - if needed
ALTER TABLE turtle_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE turtle_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE turtle_market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE turtle_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for now - adjust based on your auth requirements)
CREATE POLICY "Allow all operations on turtle_positions" ON turtle_positions FOR ALL USING (true);
CREATE POLICY "Allow all operations on turtle_trades" ON turtle_trades FOR ALL USING (true);
CREATE POLICY "Allow all operations on turtle_market_data" ON turtle_market_data FOR ALL USING (true);
CREATE POLICY "Allow all operations on turtle_assignments" ON turtle_assignments FOR ALL USING (true);