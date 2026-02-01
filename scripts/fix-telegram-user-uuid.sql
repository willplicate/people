-- Fix existing telegram_users records that have 'default-user' as user_id
-- This script will update them to use their own UUID as user_id

-- First, let's see what we're working with
SELECT id, telegram_chat_id, user_id, telegram_username
FROM telegram_users
WHERE user_id = 'default-user';

-- Update existing records to use their own ID as user_id
UPDATE telegram_users
SET user_id = id
WHERE user_id = 'default-user';

-- Verify the fix
SELECT id, telegram_chat_id, user_id, telegram_username
FROM telegram_users;
