-- Email Integration Setup
-- Run this SQL in your Supabase SQL Editor

-- Create user_settings table for Gmail OAuth tokens and preferences
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,

  -- Gmail OAuth
  gmail_access_token TEXT,
  gmail_refresh_token TEXT,
  gmail_token_expiry TIMESTAMPTZ,
  gmail_connected BOOLEAN DEFAULT FALSE,

  -- Email monitoring preferences
  email_vip_senders TEXT[] DEFAULT '{}',
  email_monitoring_enabled BOOLEAN DEFAULT TRUE,
  email_check_frequency_minutes INTEGER DEFAULT 30,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Create email_log table to track processed emails (prevents duplicate notifications)
CREATE TABLE IF NOT EXISTS email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  message_id TEXT NOT NULL,
  thread_id TEXT,

  -- Email details
  from_address TEXT NOT NULL,
  subject TEXT,
  snippet TEXT,
  received_at TIMESTAMPTZ,

  -- Classification
  is_important BOOLEAN DEFAULT FALSE,
  classification_reason TEXT,
  classification_method TEXT, -- 'rule' or 'ai'

  -- Actions
  notified_at TIMESTAMPTZ,
  marked_read BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, message_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_log_user_id ON email_log(user_id);
CREATE INDEX IF NOT EXISTS idx_email_log_message_id ON email_log(message_id);
CREATE INDEX IF NOT EXISTS idx_email_log_created_at ON email_log(created_at DESC);

-- Add RLS policies
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;

-- Users can only access their own settings
CREATE POLICY user_settings_policy ON user_settings
  FOR ALL
  USING (user_id = auth.uid());

-- Users can only access their own email logs
CREATE POLICY email_log_policy ON email_log
  FOR ALL
  USING (user_id = auth.uid());

-- Grant permissions
GRANT ALL ON user_settings TO authenticated;
GRANT ALL ON email_log TO authenticated;
GRANT ALL ON user_settings TO service_role;
GRANT ALL ON email_log TO service_role;
