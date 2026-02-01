# Telegram Bot Setup Guide

This guide walks you through setting up the Telegram bot for your Personal CRM system.

## Prerequisites

- A Telegram account
- Your app deployed (or running locally with ngrok for testing)
- Database migration completed

## Step 1: Create a Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Start a chat and send `/newbot`
3. Follow the prompts:
   - Choose a name for your bot (e.g., "My Personal CRM")
   - Choose a username (must end in 'bot', e.g., "my_personal_crm_bot")
4. BotFather will give you a bot token. **Save this token** - you'll need it.

Example token: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

## Step 2: Run Database Migration

Run the SQL migration to create the necessary tables:

```bash
# Connect to your Supabase database and run:
psql -h your-db-host -U your-username -d your-database -f scripts/add-telegram-schema.sql

# Or use the Supabase SQL Editor to paste and run the contents of:
# scripts/add-telegram-schema.sql
```

## Step 3: Configure Environment Variables

Add the following to your `.env.local` file:

```bash
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_WEBHOOK_SECRET=any_random_secret_string
```

Generate a random secret for `TELEGRAM_WEBHOOK_SECRET`:

```bash
# On Mac/Linux:
openssl rand -hex 32

# Or use any random string generator
```

## Step 4: Deploy Your App

If testing locally, you'll need ngrok or a similar tunnel:

```bash
# Install ngrok: https://ngrok.com/download
ngrok http 3000
```

For production, deploy to Vercel as usual:

```bash
vercel --prod
```

## Step 5: Register the Webhook

Once your app is deployed and accessible via HTTPS:

1. Visit: `https://your-domain.com/api/telegram/setup`
2. You should see a success response with webhook details
3. Your bot is now ready to receive messages!

Example response:
```json
{
  "success": true,
  "webhook_url": "https://your-domain.com/api/telegram/webhook",
  "bot_info": {
    "id": 1234567890,
    "first_name": "My Personal CRM",
    "username": "my_personal_crm_bot"
  }
}
```

## Step 6: Test Your Bot

1. Open Telegram and search for your bot's username
2. Start a chat and send `/start`
3. You should receive a welcome message
4. Try `/help` to see all available commands

## Troubleshooting

### Bot doesn't respond

1. Check Vercel logs for errors: `vercel logs`
2. Verify environment variables are set: `vercel env ls`
3. Test the webhook URL manually:
   ```bash
   curl https://your-domain.com/api/telegram/webhook
   ```
4. Check webhook status:
   ```bash
   curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
   ```

### "Unauthorized" error

- Check that `TELEGRAM_WEBHOOK_SECRET` matches in both `.env.local` and Vercel environment variables
- Verify the webhook was registered with the secret token

### Database errors

- Ensure the migration script ran successfully
- Check Supabase logs for permission errors
- Verify your Supabase connection string is correct

## Available Commands (Phase 1)

Currently implemented:
- `/start` - Initialize bot and register user
- `/help` - Show all commands
- `/settings` - View settings (placeholder)

Coming soon (Phase 2+):
- CRM commands: `/birthdays`, `/contacts`, `/reminders`, `/log`
- Trading commands: `/positions`, `/pl`, `/health`, `/add_trade`
- Habits commands: `/habits`, `/log_habit`, `/habit_stats`
- AI chat integration (just send a message without a command)

## Security Notes

- Never commit your bot token to Git
- Use different tokens for development and production
- Rotate your webhook secret periodically
- Only your bot token and Telegram servers should know your webhook URL

## Next Steps

After Phase 1 is working:
- Implement CRM command handlers (Phase 2)
- Add AI chat integration (Phase 3)
- Add trading commands (Phase 4)
- Add habits commands (Phase 5)
- Set up scheduled notifications (Phase 6)

## Support

If you encounter issues:
1. Check the Vercel logs
2. Check the Supabase logs
3. Verify all environment variables are set
4. Test each component individually (database, webhook, commands)

For more help, consult the Telegram Bot API documentation:
https://core.telegram.org/bots/api
