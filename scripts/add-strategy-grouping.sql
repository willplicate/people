-- Add strategy grouping to options_trades
-- This allows multi-leg strategies (condors, spreads, etc.) to be tracked as a unit

-- Add strategy_group_id to link related legs together
ALTER TABLE options_trades
ADD COLUMN IF NOT EXISTS strategy_group_id UUID;

-- Add strategy_name to describe the type of strategy
ALTER TABLE options_trades
ADD COLUMN IF NOT EXISTS strategy_name VARCHAR(50);

-- Add index for faster group queries
CREATE INDEX IF NOT EXISTS idx_options_trades_group ON options_trades(strategy_group_id);

-- Examples of strategy_name values:
-- 'PUT_CONDOR', 'CALL_CONDOR', 'IRON_CONDOR', 'VERTICAL_SPREAD', 'SINGLE_LEG', etc.
