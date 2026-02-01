# Scheduled Notifications - Deployment Guide

## Overview
Three automated daily notifications have been implemented for the Telegram bot "James":

1. **Morning Digest** (9 AM CET) - Birthdays and contacts needing outreach
2. **Evening Habit Check-in** (8 PM CET) - Incomplete habits
3. **Trading Position Health** (Mon/Wed/Fri 4:30 PM CET) - Positions requiring attention

## Files Created

### Vercel Configuration
- `/vercel.json` - Cron job schedules

### Notification Utilities
- `/src/lib/telegram/notifications.ts` - Formatting functions and health calculations

### API Routes (Cron Endpoints)
- `/src/app/api/cron/morning-digest/route.ts`
- `/src/app/api/cron/evening-habits/route.ts`
- `/src/app/api/cron/trading-health/route.ts`
- `/src/app/api/cron/test-notifications/route.ts` (for testing)

## Cron Schedules (UTC)

```json
{
  "morning-digest": "0 8 * * *",      // 9 AM CET (8 AM UTC)
  "evening-habits": "0 19 * * *",     // 8 PM CET (7 PM UTC)
  "trading-health": "30 15 * * 1,3,5" // 4:30 PM CET Mon/Wed/Fri (3:30 PM UTC)
}
```

**Note:** These times are set for CET (UTC+1). During CEST (summer, UTC+2), notifications will arrive 1 hour earlier. You may want to adjust the schedules seasonally.

## Testing Instructions

### Local Testing

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test each notification type:**
   ```bash
   # Morning digest preview
   curl "http://localhost:3000/api/cron/test-notifications?type=morning"

   # Evening habits preview
   curl "http://localhost:3000/api/cron/test-notifications?type=evening"

   # Trading health preview
   curl "http://localhost:3000/api/cron/test-notifications?type=trading"
   ```

3. **Actually send notifications (use with caution):**
   ```bash
   # Send morning digest
   curl "http://localhost:3000/api/cron/morning-digest"

   # Send evening habits
   curl "http://localhost:3000/api/cron/evening-habits"

   # Send trading health
   curl "http://localhost:3000/api/cron/trading-health"
   ```

### Production Deployment

1. **Deploy to Vercel:**
   ```bash
   git add .
   git commit -m "Add scheduled notifications for Telegram bot"
   git push
   ```

2. **Verify cron jobs in Vercel dashboard:**
   - Go to: https://vercel.com/wills-projects-acbd70f9/personal-crm/settings/crons
   - You should see all 3 cron jobs listed

3. **Manually trigger each job once:**
   - In the Vercel crons dashboard, click "Run Now" for each job
   - Check your Telegram chat with James to verify the messages

4. **Monitor logs:**
   - Go to: https://vercel.com/wills-projects-acbd70f9/personal-crm/logs
   - Filter by function name (e.g., `/api/cron/morning-digest`)
   - Check for any errors in the first 24-48 hours

## Notification Behavior

### Morning Digest (9 AM)
**Sends when:**
- There are birthdays today, OR
- There are contacts needing outreach

**Skips when:**
- No birthdays AND all contacts are up-to-date

**Example:**
```
🌅 Good Morning!

🎂 Birthdays Today:
• John Smith

📞 Contacts Needing Outreach:
• Mike Davis (weekly, last: Jan 15)
• Lisa Chen (monthly, last: Dec 20)

Use /contacts to see full list
```

### Evening Habits (8 PM)
**Sends when:**
- One or more habits are incomplete

**Skips when:**
- All habits completed OR no habits defined

**Example:**
```
🌙 Evening Check-in

Incomplete habits today:
⬜ Meditation (streak: 7 days 🔥)
⬜ Reading (streak: 3 days)

Send me a message to log completions
```

### Trading Health (Mon/Wed/Fri 4:30 PM)
**Sends when:**
- One or more positions have DTE < 60 days

**Skips when:**
- No open positions OR all positions have DTE > 60 days

**Example:**
```
📊 Trading Position Health

🔴 URGENT (< 7 days):
• SPY PUT $450 (Exp: Feb 5, DTE: 4)
  2 contracts @ $3.50

🟡 WARNING (< 30 days):
• AAPL CALL $180 (Exp: Feb 28, DTE: 27)
  1 contract @ $5.00

Send me a message for details
```

## Troubleshooting

### Notifications not sending
1. Check Vercel cron job status in dashboard
2. Check function logs for errors
3. Verify `telegram_users` table has active users with `notifications_enabled = true`
4. Test the endpoint manually with curl

### Wrong timezone
1. Update cron schedules in `vercel.json`
2. Redeploy to Vercel
3. Cron schedules use UTC, so adjust accordingly:
   - CET (winter): UTC+1
   - CEST (summer): UTC+2

### Messages have formatting issues
1. Check Telegram message in bot chat
2. All special characters should be escaped with backslash
3. Review `/src/lib/telegram/notifications.ts` formatting functions
4. Test with `/api/cron/test-notifications` endpoint

### Rate limiting
- Telegram allows 30 messages/second
- Current implementation processes users concurrently
- Should not be an issue with small user base (<100 users)

## Environment Variables

Ensure these are set in Vercel:
- `TELEGRAM_BOT_TOKEN` - Your Telegram bot token
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (if needed)

## Monitoring Checklist

After deployment, monitor for 24-48 hours:
- [ ] Morning digest sent successfully
- [ ] Evening habits sent successfully
- [ ] Trading health sent successfully (check Mon/Wed/Fri)
- [ ] No errors in Vercel function logs
- [ ] Messages formatted correctly in Telegram
- [ ] Empty states handled correctly (no messages sent)
- [ ] Response times acceptable (<2s per function)

## Future Enhancements

Potential improvements:
- User-specific timezone preferences
- Snooze/pause notifications temporarily
- Custom notification thresholds (e.g., DTE warnings)
- Weekly/monthly summaries
- Notification preferences per notification type
