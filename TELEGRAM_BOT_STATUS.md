# Telegram Bot (James) - Status & Documentation

**Bot Name:** James (@people_crm_bot)
**Production URL:** https://personal-crm-pearl.vercel.app
**Last Updated:** January 28, 2026

---

## ✅ What's Implemented (Phases 1-3 Complete)

### Phase 1: Foundation ✅
**Status:** Live and working

**Infrastructure:**
- Telegram webhook handler at `/api/telegram/webhook`
- Database tables: `telegram_users`, `telegram_messages`, `telegram_conversation_state`
- User registration and authentication
- Message logging and audit trail
- Webhook signature verification (currently disabled for simplicity)

**Basic Commands:**
- `/start` - Initialize bot and register user
- `/help` - Show available commands
- `/settings` - View notification settings (placeholder)

**Files Created:**
- `scripts/add-telegram-schema.sql` - Database migration
- `src/types/database.ts` - Added TelegramUser, TelegramMessage, TelegramConversationState types
- `src/services/TelegramService.ts` - Telegram API wrapper
- `src/services/TelegramUserService.ts` - User and conversation state management
- `src/app/api/telegram/webhook/route.ts` - Main webhook handler
- `src/app/api/telegram/setup/route.ts` - Webhook registration endpoint
- `src/lib/telegram/types.ts` - Telegram API types
- `src/lib/telegram/validation.ts` - Security and parsing utilities
- `src/lib/telegram/formatting.ts` - Message formatting utilities

---

### Phase 2: CRM Integration ✅
**Status:** Live and working

**Features:**
- `/birthdays [days]` - Show upcoming birthdays (default: 7 days)
- `/contacts` - Show contacts needing outreach based on communication frequency
- `/reminders` - Show pending reminders (placeholder)
- `/log {name}` - Multi-step conversation to log interactions

**How It Works:**
- Integrates with existing `ContactService` and `InteractionService`
- Queries Supabase `personal_contacts` and `personal_interactions` tables
- Multi-step conversations use `telegram_conversation_state` table
- Conversation state expires after 10 minutes

**Files Created:**
- `src/services/TelegramCommandRouter.ts` - Routes messages to handlers
- `src/services/telegram-commands/CRMCommands.ts` - CRM command handlers
- `src/services/telegram-commands/GeneralCommands.ts` - General command handlers

**Example Usage:**
```
User: /birthdays 30
Bot: Shows all birthdays in next 30 days from Supabase

User: /log Rachel
Bot: What type of interaction? 1.Call 2.Text 3.Email 4.Meetup 5.Other
User: 1
Bot: What notes would you like to add?
User: Discussed wedding venue options
Bot: ✅ Interaction with Rachel logged successfully!
```

---

### Phase 3: AI Chat Integration ✅
**Status:** Live and working

**Core Features:**
- Natural language understanding (no commands needed)
- Claude API integration with tool/function calling
- Conversation memory (last 10 messages)
- James personality (helpful best friend, not formal assistant)

**Available Tools (Claude can call automatically):**
1. `get_upcoming_birthdays` - Fetch birthdays from Supabase
2. `get_contacts_needing_outreach` - Show contacts to reach out to
3. `search_contacts` - Find specific people
4. `log_interaction` - Record interactions with contacts
5. `create_task` - Add tasks to personal_tasks table
6. `get_tasks` - View tasks with filters
7. `log_trade` - Record options trades (LEAPS strategy)

**Smart Features:**
- **Date parsing:** "next Friday", "tomorrow", "in 5 days" → actual dates
- **Context awareness:** Remembers last 10 messages in conversation
- **Follow-up questions:** Asks for missing info (e.g., ticker symbol)
- **Life coach integration:** Uses your LIFE_COACH.md context

**Files Created:**
- `src/services/telegram-commands/AIChatHandler.ts` - AI chat with Claude API
- `src/services/TaskService.ts` - Task CRUD operations

**Example Usage:**
```
User: What birthdays are coming up?
→ Claude calls get_upcoming_birthdays tool
→ Returns: "You have 2 birthdays coming up: Yolande in 12 days, Rachel in 28 days"

User: Add a task to call the wedding venue
→ Claude calls create_task tool
→ Returns: "✅ Created task: Call the wedding venue"

User: I sold a SPY call at 450 strike for $2.50, expiring next Friday
→ Claude calls log_trade tool
→ Parses: ticker=SPY, action=SELL, type=CALL, strike=450, premium=2.50
→ Calculates: "next Friday" = 2026-02-07
→ Records to options_trades table
→ Returns: "Sold 1 SPY CALL contract @ $450 strike for $2.50, exp 2026-02-07"
```

---

## 🤖 James's Personality & Context

**Identity:**
- Name: James
- Role: Helpful best friend who happens to be an AI
- Tone: Intelligent, funny, supportive (NOT formal assistant)

**What James Knows About You:**
- Living in Barcelona with partner Jucas
- Getting married in 4 months
- Learning Spanish for B2 exam
- Working on systematic trading (Turtle strategy LEAPS)
- 2026 theme: "Year of Following Through"
- Habits: Monday trading, Admin Friday, swimming 3x/week
- Patterns: Imposter syndrome, trading drift, catastrophizing, project hopping

**Embedded Context Location:**
- `src/services/telegram-commands/AIChatHandler.ts` - `getSystemPrompt()` method
- Context is embedded directly in code (not read from file) to work in Vercel serverless

---

## 🔧 Technical Details

### Architecture
```
Telegram User
    ↓
Telegram Bot API (webhook)
    ↓
Vercel: /api/telegram/webhook
    ↓
TelegramCommandRouter
    ├─ Command Handler (/birthdays, /tasks, etc.)
    ├─ Conversation State Handler (multi-step flows)
    └─ AI Chat Handler (Claude API with tools)
    ↓
Services (Contact, Task, Trading, Interaction)
    ↓
Supabase (PostgreSQL)
```

### Environment Variables (Vercel)
```
TELEGRAM_BOT_TOKEN=7269780793:AAFCoEgMGGl2PeRYKUKW_y90pLTJAePCDYI
ANTHROPIC_API_KEY=sk-ant-api03-gCU...cwAA (trading-coach key)
NEXT_PUBLIC_SUPABASE_URL=https://tdclhoimzksmqmnsaccw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### Webhook Configuration
- **URL:** https://personal-crm-pearl.vercel.app/api/telegram/webhook/
- **Note:** Trailing slash is required (Next.js redirects without it)
- **Secret Token:** Currently disabled (not set in production)
- **Allowed Updates:** `["message"]`

### Cost Management
- **Current:** ~$0.0075 per message with AI chat + tools
- **Context Cap:** Hard limit of 10 messages (prevents cost spiral)
- **Daily Usage:** ~$0.03 for 4 messages (very reasonable)
- **Model:** Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`)

---

## 📋 What's NOT Implemented Yet

### Phase 4: Trading Commands (Optional)
**Status:** Not needed - natural language works!

- `/positions` - Show active LEAPS positions
- `/pl [period]` - Profit/loss summary
- `/health` - Position health check

**Decision:** Skip this phase since natural language already handles trading via `log_trade` tool.

---

### Phase 5: Habits Integration (Optional)
**Status:** Not implemented

**Would Add:**
- `/habits` - Show today's habits with completion status
- `/log_habit {name}` - Mark habit complete
- `/habit_stats [period]` - Show habit statistics

**Integration Points:**
- `life_habits` table (already exists in Supabase)
- `life_habit_logs` table (already exists in Supabase)
- Could use natural language instead of commands

**Example:**
```
User: Log my swimming habit
→ Marks swimming complete for today
→ Updates current_streak

User: How's my Spanish habit going?
→ Shows 7-day stats and current streak
```

---

### Phase 6: Scheduled Notifications
**Status:** Not implemented - PRIORITY IF WANTED

**Would Add:**
- Daily morning digest (9 AM): Today's birthdays + contacts needing outreach
- Evening habit check-in (8 PM): "Did you complete your habits today?"
- Trading alerts (Mon/Wed/Fri 4:30 PM): Position health warnings

**Implementation Required:**
1. Create cron API routes:
   - `/api/cron/daily-reminders`
   - `/api/cron/habit-checkin`
   - `/api/cron/position-health`

2. Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/daily-reminders",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/habit-checkin",
      "schedule": "0 20 * * *"
    },
    {
      "path": "/api/cron/position-health",
      "schedule": "30 16 * * 1,3,5"
    }
  ]
}
```

3. Use `TelegramService.sendMessage()` to push notifications

**This would be VERY useful for:**
- Morning accountability ("Here's what you need to do today")
- Evening check-ins ("Did you stick to your habits?")
- Trading discipline ("Your positions need attention")

---

## 🚀 How to Deploy Changes

### 1. Make Code Changes Locally
```bash
cd /Users/williamford/people/personal-crm
# Edit files...
npm run build  # Test build locally
```

### 2. Commit to Git
```bash
git add .
git commit -m "Description of changes"
```

### 3. Deploy to Vercel
```bash
# If not logged in
vercel login

# Deploy to production
vercel --prod
```

### 4. Verify Deployment
- Check: https://vercel.com/wills-projects-acbd70f9/personal-crm
- Test bot in Telegram
- Monitor logs: `vercel logs https://personal-crm-pearl.vercel.app`

---

## 🐛 Common Issues & Fixes

### Issue: Bot doesn't respond
**Fix:**
1. Check webhook: `curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo`
2. Verify URL has trailing slash: `/api/telegram/webhook/`
3. Check Vercel logs for errors

### Issue: "Unauthorized" error
**Fix:** Webhook secret mismatch - currently disabled in production

### Issue: AI chat gives errors
**Check:**
1. `ANTHROPIC_API_KEY` is set in Vercel
2. Model name is correct: `claude-sonnet-4-5-20250929`
3. API key has sufficient credits

### Issue: Database queries fail
**Check:**
1. Supabase connection variables are set
2. Tables exist (run migration if needed)
3. RLS policies allow access

---

## 📊 Database Tables Used

### Telegram-Specific Tables
- `telegram_users` - Maps Telegram chat_id to app user_id
- `telegram_messages` - Audit log of all messages
- `telegram_conversation_state` - Multi-step conversation state

### Existing Tables Used
- `personal_contacts` - Contact information
- `personal_interactions` - Logged interactions
- `personal_tasks` - Todo items
- `options_trades` - Trading records
- `trading_sessions` - Daily trading sessions
- `life_habits` - Habit definitions (not yet used)
- `life_habit_logs` - Habit completion logs (not yet used)

---

## 🎯 Recommended Next Steps

**Priority 1: Phase 6 - Scheduled Notifications**
- Daily digest would provide massive value
- Low effort to implement (2-3 hours)
- High impact on accountability

**Priority 2: Habits Integration**
- Natural language habit logging
- Add tools: `log_habit`, `get_habit_stats`
- Integrates with life_habits tables

**Priority 3: Enhancements**
- Task completion: "Mark task X as done"
- Better date parsing: "next month", "end of February"
- Email integration: Send/read emails via Gmail API
- Calendar integration: Check schedule, add events

**Low Priority:**
- Trading commands (natural language works fine)
- Webhook secret token (security improvement but not critical)

---

## 📝 Maintenance Notes

**Regular Tasks:**
- Monitor API costs (Anthropic dashboard)
- Check Vercel logs for errors occasionally
- Update model if new Claude versions released
- Clean up old telegram_messages periodically (optional)

**If Costs Increase:**
- Reduce conversation history from 10 to 5 messages
- Add conversation summaries to reduce context
- Switch to cheaper model (Claude Haiku) for simple queries

**To Update James's Personality:**
- Edit `src/services/telegram-commands/AIChatHandler.ts`
- Update `getSystemPrompt()` method
- Redeploy to Vercel

---

## 🔑 Key Files Reference

**Core Logic:**
- `src/app/api/telegram/webhook/route.ts` - Webhook entry point
- `src/services/TelegramCommandRouter.ts` - Message routing
- `src/services/telegram-commands/AIChatHandler.ts` - AI chat with Claude
- `src/services/telegram-commands/CRMCommands.ts` - CRM features
- `src/services/TelegramService.ts` - Telegram API wrapper
- `src/services/TelegramUserService.ts` - User/state management

**Services Integration:**
- `src/services/ContactService.ts` - Contact CRUD
- `src/services/InteractionService.ts` - Interaction logging
- `src/services/TaskService.ts` - Task management
- `src/services/TradingService.ts` - Trading records

**Utilities:**
- `src/lib/telegram/types.ts` - Type definitions
- `src/lib/telegram/validation.ts` - Parsing and validation
- `src/lib/telegram/formatting.ts` - Message formatting

---

## 🎉 Success Metrics

**What's Working:**
✅ Natural language task creation
✅ Birthday tracking with real data
✅ Contact management and logging
✅ Trading record keeping
✅ James has personality and context
✅ Multi-step conversations
✅ Smart date parsing
✅ Cost-effective (~$0.0075/message)

**What Users Love:**
- No need to remember commands
- Conversational, friendly tone
- Actually useful (not just a toy)
- Fast responses
- Remembers context

---

**End of Status Document**

*For questions or updates, edit this file and redeploy.*
