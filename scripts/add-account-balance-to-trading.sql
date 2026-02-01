-- Add account balance tracking to trading_sessions

ALTER TABLE trading_sessions ADD COLUMN IF NOT EXISTS account_balance DECIMAL(12,2);
ALTER TABLE trading_sessions ADD COLUMN IF NOT EXISTS balance_updated_at TIMESTAMP WITH TIME ZONE;

-- Add a comment to explain
COMMENT ON COLUMN trading_sessions.account_balance IS 'Current account balance at time of session (target: $20,000)';
COMMENT ON COLUMN trading_sessions.balance_updated_at IS 'When the balance was last updated';
