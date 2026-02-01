# James Advanced Features Implementation Guide

## Overview

I've implemented OpenClaw/Moltbot-inspired features for James, your Telegram AI assistant. This gives James capabilities for web search, email monitoring, and self-improvement - all while minimizing compute costs through intelligent hybrid approaches.

## Features Implemented

### 1. Web Search & Fetch ✅
**Files Created:**
- `/src/app/api/web-search/route.ts` - Web search endpoint
- `/src/app/api/web-fetch/route.ts` - URL reading endpoint
- Updated `/src/services/telegram-commands/AIChatHandler.ts` - Added `web_search` and `web_fetch` tools

**How It Works:**
- James can now search the web when answering questions that need current information
- Can read and summarize specific URLs you provide
- No manual commands needed - James automatically decides when to search

**Examples:**
```
You: What's the weather in Barcelona tomorrow?
James: [searches web] Tomorrow will be 18°C and sunny...

You: Read this article: https://example.com/article
James: [fetches and summarizes] This article discusses...

You: What's SPY trading at?
James: [searches] SPY is currently trading at $450.25...
```

---

### 2. Gmail Integration with Intelligent Monitoring ✅
**Files Created:**
- `/src/services/GmailService.ts` - Gmail OAuth2 integration
- `/src/services/EmailFilteringService.ts` - Hybrid AI+rules classification
- `/src/app/api/cron/email-monitor/route.ts` - Email monitoring cron (every 30 min)
- `/src/app/api/auth/gmail/connect/route.ts` - OAuth connection endpoint
- `/src/app/api/auth/gmail/callback/route.ts` - OAuth callback handler
- `/EMAIL_SETUP.sql` - Database schema for email features

**How It Works:**
The system uses a **hybrid approach** to minimize AI costs while maximizing accuracy:

#### Phase 1: Rule-Based Filtering (Free)
1. Auto-ignores newsletters (substack, beehiiv, noreply domains)
2. Auto-prioritizes emails from your CRM contacts
3. Flags urgency keywords ("urgent", "asap", "important")
4. Recognizes replies (RE:, FWD:)

#### Phase 2: AI Batch Classification (Efficient)
- Ambiguous emails are grouped together
- **ONE Claude API call** classifies multiple emails at once
- Much cheaper than individual classification
- ~90% of emails filtered by rules, only ~10% need AI

**Setup Required:**
1. **Run SQL migration:**
   ```sql
   -- In Supabase SQL Editor
   \i EMAIL_SETUP.sql
   ```

2. **Set up Google OAuth:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create project or select existing
   - Enable Gmail API
   - Create OAuth 2.0 credentials (Web application)
   - Add authorized redirect URI: `https://your-domain.vercel.app/api/auth/gmail/callback`
   - Add to Vercel environment variables:
     ```
     GOOGLE_CLIENT_ID=your_client_id
     GOOGLE_CLIENT_SECRET=your_client_secret
     GOOGLE_REDIRECT_URI=https://your-domain.vercel.app/api/auth/gmail/callback
     ```

3. **Connect your Gmail:**
   - Visit: `https://your-domain.vercel.app/api/auth/gmail/connect?userId=YOUR_USER_ID`
   - Or add a `/connect_gmail` command to Telegram bot

**Features:**
- ✅ Monitors inbox every 30 minutes
- ✅ Smart filtering (rules + AI)
- ✅ Telegram alerts for important emails only
- ✅ Prevents duplicate notifications
- ✅ Learns from your CRM contacts
- ✅ VIP sender list support

**Cost Optimization:**
- Rules filter ~90% of emails (free)
- AI processes ~10% in batches
- Estimate: **$0.01-0.05 per day** for 50-100 emails

---

### 3. Weekly Self-Improvement Reflection ✅
**Files Created:**
- `/src/app/api/cron/weekly-reflection/route.ts` - Weekly analysis cron (Sundays 8 PM)

**How It Works:**
Every Sunday evening, James analyzes the past week's conversations and:
1. Identifies frequent requests and patterns
2. Finds pain points or frustrations
3. Discovers missing capabilities you asked for
4. Generates 2-3 concrete suggestions for improvement

**Example Notification:**
```
💡 Weekly Reflection

I analyzed our 47 conversations this week and have some ideas
to make myself more useful:

1. **SPY Price Command**: You checked SPY prices 8 times manually.
   I could add a /spy_price command for instant quotes.

2. **Birthday Reminders**: You looked up 3 birthdays. I could send
   automatic reminders 7 days before.

3. **Trading Journal**: You mentioned trades in chat 5 times. I could
   add a /journal command to log reflections.

Let me know if any of these would be helpful! I can implement them
or we can discuss other improvements.
```

---

### 4. Updated Cron Jobs
**Updated:** `/vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/morning-digest",
      "schedule": "0 8 * * *"  // 9 AM CET - Birthdays + contacts
    },
    {
      "path": "/api/cron/evening-habits",
      "schedule": "0 19 * * *"  // 8 PM CET - Incomplete habits
    },
    {
      "path": "/api/cron/trading-health",
      "schedule": "30 15 * * 1,3,5"  // 4:30 PM CET Mon/Wed/Fri - Positions
    },
    {
      "path": "/api/cron/email-monitor",
      "schedule": "*/30 * * * *"  // Every 30 minutes - Important emails
    },
    {
      "path": "/api/cron/weekly-reflection",
      "schedule": "0 19 * * 0"  // 8 PM CET Sundays - Self-improvement suggestions
    }
  ]
}
```

---

## Deployment Instructions

### 1. Install Dependencies
```bash
# googleapis is already in package.json
npm install
```

### 2. Set Up Database
```bash
# Copy EMAIL_SETUP.sql to Supabase SQL Editor and run it
```

### 3. Configure Environment Variables
Add to Vercel:
```bash
# Google OAuth (for Gmail)
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=https://your-domain.vercel.app/api/auth/gmail/callback

# Claude API (already set)
ANTHROPIC_API_KEY=your_key_here
```

### 4. Deploy to Vercel
```bash
git add .
git commit -m "Add advanced features: web search, email monitoring, self-improvement"
git push
```

### 5. Verify Deployment
1. Check Vercel crons dashboard: All 5 cron jobs should appear
2. Test web search: Ask James "What's the weather today?"
3. Connect Gmail: Visit `/api/auth/gmail/connect?userId=YOUR_ID`
4. Wait for Sunday: Weekly reflection will run automatically

---

## Cost Analysis

### Current Implementation Costs (Estimated Monthly)

**Web Search:**
- Usage: ~10 searches/day = 300/month
- Cost: ~$1.50/month (Claude Sonnet calls)

**Email Monitoring:**
- Unread emails: ~50/day = 1,500/month
- Rule filtering: ~90% (free)
- AI classification: ~10% = 150/month in batches of 10
- API calls: ~15/month
- Cost: ~$0.75/month

**Weekly Reflection:**
- API calls: 4/month (once per week)
- Cost: ~$0.20/month

**Daily Notifications:**
- Morning/evening/trading: Already implemented
- Cost: Included in existing usage

**Total Additional Cost: ~$2.50/month**

---

## Comparison to OpenClaw/Moltbot

| Feature | OpenClaw/Moltbot | James (Our Implementation) |
|---------|------------------|----------------------------|
| **Web Search** | ✅ Via search tools | ✅ Automatic in conversations |
| **Web Fetch** | ✅ Read specific URLs | ✅ Summarize any URL |
| **Email Integration** | ✅ Gmail monitoring | ✅ Smart hybrid filtering |
| **Self-Improvement** | ✅ Heartbeat engine | ✅ Weekly reflection analysis |
| **Background Tasks** | ✅ Autonomous agents | ✅ Cron-based (5 jobs) |
| **Proactive Notifications** | ✅ Event-driven | ✅ Scheduled + intelligent |
| **Cost Optimization** | ❌ High compute | ✅ Rule-based + batch AI |
| **Browser Automation** | ✅ Puppeteer/CDP | ❌ Not yet |
| **File System Access** | ✅ Local execution | ❌ Cloud-based |
| **Skills Marketplace** | ✅ Community skills | ❌ Custom only |

---

## Future Enhancements (Not Yet Implemented)

### Priority 1: Email Tools for AIChatHandler
Add conversational email management:
```typescript
Tools to add:
- check_email: "Check my inbox for important emails"
- reply_to_email: "Reply to the email from John"
- search_emails: "Find emails about the wedding"
- mark_as_read: "Mark email from boss as read"
```

### Priority 2: Advanced Email Features
- Smart categorization (work, personal, finance, etc.)
- Auto-archive newsletters
- Email templates for common replies
- Meeting extraction from email

### Priority 3: Calendar Integration
- Google Calendar OAuth
- Show today's meetings in morning digest
- Conflict detection
- Travel time calculations

### Priority 4: Browser Automation
- Screenshot websites
- Fill forms automatically
- Monitor price changes
- Track package deliveries

### Priority 5: Smart Reminders
- Context-aware reminders (location, time, person)
- Recurring task suggestions
- Deadline predictions based on patterns

---

## Testing

### Test Web Search
```
Telegram message: "What's the latest news about AI agents?"
Expected: James searches and provides summary
```

### Test Web Fetch
```
Telegram message: "Read this article: https://news.ycombinator.com"
Expected: James fetches and summarizes
```

### Test Email Monitoring
```
1. Send yourself an email with subject "URGENT: Test"
2. Wait up to 30 minutes
3. Expected: Telegram notification from James
```

### Test Weekly Reflection
```
# Manual trigger for testing
curl https://your-domain.vercel.app/api/cron/weekly-reflection
```

---

## Troubleshooting

### Web Search Not Working
- Check ANTHROPIC_API_KEY is set
- Verify `/api/web-search` endpoint is deployed
- Check Vercel function logs

### Email Monitoring Not Working
1. Verify Gmail OAuth is configured
2. Check user has connected Gmail via `/api/auth/gmail/connect`
3. Run SQL: `SELECT * FROM user_settings WHERE gmail_connected = true`
4. Check email_log table for entries
5. Review `/api/cron/email-monitor` logs

### No Weekly Reflection
1. Check cron job is in Vercel dashboard
2. Verify it's Sunday 8 PM CET (19:00 UTC)
3. Check conversation history exists
4. Review function logs

---

## Security Notes

### Gmail OAuth
- Tokens stored encrypted in Supabase
- Row-level security (RLS) enabled
- Users can only access their own data
- Refresh tokens handle expiration automatically

### Email Privacy
- Emails never stored in full (only metadata)
- AI classification happens server-side
- No email content sent to Telegram (only summaries)
- Users can disconnect Gmail anytime

### API Keys
- All secrets in Vercel environment variables
- Never committed to git
- Separate keys per environment

---

## Next Steps

1. **Deploy** - Push to Vercel and verify crons
2. **Connect Gmail** - Set up OAuth and connect your account
3. **Test** - Try web search, wait for email notification
4. **Monitor** - Check first week's reflection on Sunday
5. **Iterate** - James will suggest improvements based on usage

---

## Support

If you encounter issues:
1. Check Vercel function logs
2. Review Supabase database tables
3. Test individual endpoints manually
4. Check environment variables are set
5. Verify OAuth redirect URIs match

---

## Credits

Inspired by OpenClaw (formerly Moltbot/Clawdbot) but optimized for:
- Lower cost through hybrid AI+rules approach
- Serverless architecture (no local execution)
- Telegram-first interface
- Privacy-focused design
