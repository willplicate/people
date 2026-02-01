# Fix Telegram Bot - Add Service Role Key

## Problem
The Telegram bot fails when trying to create tasks or perform other database operations because it's using the Supabase **anon key** which is restricted by Row Level Security (RLS) policies. Since the bot doesn't have an authenticated user session, these operations are blocked.

## Solution
Use the Supabase **service role key** which bypasses RLS policies for server-side operations.

## Steps to Fix

### 1. Get Your Service Role Key

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/tdclhoimzksmqmnsaccw/settings/api

2. Scroll down to find the **Project API keys** section

3. Copy the **`service_role`** key (NOT the anon key)
   - It should start with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - ⚠️  **KEEP THIS SECRET** - Never commit it to Git or share publicly

### 2. Add to Environment Variables

Open your `.env.local` file and add this line:

```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. Restart Your Application

If running locally:
```bash
# Stop the dev server (Ctrl+C)
npm run dev
```

If deployed on Vercel:
1. Go to your Vercel project settings
2. Add `SUPABASE_SERVICE_ROLE_KEY` as an environment variable
3. Redeploy your application

### 4. Test the Bot

Send a message to James on Telegram:
```
Add a task: Test the fixed bot
```

The bot should now successfully create the task without errors!

## What Was Changed

1. **Created `/src/lib/supabase-admin.ts`**
   - New admin Supabase client that uses the service role key
   - Only used for server-side operations (Telegram bot, API routes)

2. **Updated `/src/services/TaskService.ts`**
   - Now automatically uses admin client when running server-side
   - Falls back to regular client for client-side operations
   - Added `getClient()` method to choose the appropriate client

3. **Improved error logging in `/src/services/telegram-commands/AIChatHandler.ts`**
   - Now shows detailed error messages
   - Added logging for tool execution to help debug issues

## Security Note

The service role key bypasses ALL Row Level Security policies. It should only be used:
- ✅ On the server-side (API routes, Telegram bot, server components)
- ✅ In secure environments (Vercel, backend services)
- ❌ NEVER in client-side code
- ❌ NEVER committed to Git (already in `.gitignore` via `.env.local`)

The code automatically detects if it's running server-side and uses the admin client only in those cases.
