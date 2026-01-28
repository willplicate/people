import { NextRequest, NextResponse } from 'next/server'
import { TelegramUpdate } from '@/lib/telegram/types'
import { verifyWebhookSignature, parseCommand, isPrivateChat } from '@/lib/telegram/validation'
import { getTelegramService } from '@/services/TelegramService'
import { TelegramUserService } from '@/services/TelegramUserService'
import { formatError } from '@/lib/telegram/formatting'

/**
 * Telegram Webhook Handler
 * Receives updates from Telegram and routes them to appropriate handlers
 */
export async function POST(req: NextRequest) {
  try {
    // Verify webhook signature
    const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET
    const receivedToken = req.headers.get('X-Telegram-Bot-Api-Secret-Token')

    if (secretToken && !verifyWebhookSignature(secretToken, receivedToken)) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse update
    const update: TelegramUpdate = await req.json()

    // Handle message
    if (update.message) {
      await handleMessage(update.message)
    }

    // Telegram expects 200 OK response
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Handle incoming message
 */
async function handleMessage(message: TelegramUpdate['message']) {
  if (!message || !message.from || !message.text) {
    return
  }

  const chatId = message.chat.id
  const telegramService = getTelegramService()

  try {
    // Only support private chats for now
    if (!isPrivateChat(message.chat.type)) {
      await telegramService.sendMessage(
        chatId,
        'Sorry, I only work in private chats for now.',
        { parse_mode: 'Markdown' }
      )
      return
    }

    // Get or create user
    const user = await TelegramUserService.getOrCreateUser(
      chatId,
      message.from.username,
      message.from.first_name
    )

    if (!user) {
      await telegramService.sendMessage(
        chatId,
        formatError('Failed to register user. Please try again later.'),
        { parse_mode: 'Markdown' }
      )
      return
    }

    // Log inbound message
    await TelegramUserService.logMessage(
      user.id,
      'inbound',
      message.text,
      {
        telegramMessageId: message.message_id,
      }
    )

    // Parse command
    const parsedCommand = parseCommand(message.text)

    if (parsedCommand) {
      // Handle command
      await handleCommand(user.id, chatId, parsedCommand.command, parsedCommand.rawArgs)
    } else {
      // Handle conversation state or AI chat
      await handleMessageOrAIChat(user.id, chatId, message.text)
    }
  } catch (error) {
    console.error('Error handling message:', error)

    await telegramService.sendMessage(
      chatId,
      formatError('An error occurred processing your message.'),
      { parse_mode: 'Markdown' }
    )
  }
}

/**
 * Handle command
 */
async function handleCommand(
  userId: string,
  chatId: number,
  command: string,
  args: string
) {
  const telegramService = getTelegramService()

  // Log command
  await TelegramUserService.logMessage(
    userId,
    'inbound',
    `/${command} ${args}`,
    {
      command,
    }
  )

  switch (command) {
    case 'start':
      await handleStartCommand(chatId)
      break

    case 'help':
      await handleHelpCommand(chatId)
      break

    case 'settings':
      await handleSettingsCommand(chatId, userId)
      break

    default:
      await telegramService.sendMessage(
        chatId,
        formatError(`Unknown command: /${command}\n\nUse /help to see available commands.`),
        { parse_mode: 'Markdown' }
      )
  }
}

/**
 * Handle /start command
 */
async function handleStartCommand(chatId: number) {
  const telegramService = getTelegramService()

  const welcomeMessage = `Welcome to your Personal CRM & Life Coach! 👋

I can help you with:
• Managing contacts and reminders
• Tracking your trading positions
• Building better habits
• AI-powered life coaching

Use /help to see all available commands.`

  await telegramService.sendMessage(
    chatId,
    welcomeMessage,
    { parse_mode: 'Markdown' }
  )
}

/**
 * Handle /help command
 */
async function handleHelpCommand(chatId: number) {
  const telegramService = getTelegramService()

  const helpMessage = `*Available Commands:*

*CRM & Contacts*
/birthdays \\[days\\] \\- Show upcoming birthdays
/contacts \\- Contacts needing outreach
/reminders \\- Pending reminders
/log \\{name\\} \\- Log an interaction

*Trading*
/positions \\- Show active LEAPS positions
/pl \\[period\\] \\- Profit/loss summary
/health \\- Position health check
/add\\_trade \\- Add a new trade

*Habits*
/habits \\- Today's habits status
/log\\_habit \\{name\\} \\- Log habit completion
/habit\\_stats \\- Habit statistics

*General*
/help \\- Show this help message
/settings \\- Notification preferences

*AI Chat*
Just send me a message and I'll chat with you using Claude\\!`

  await telegramService.sendMessage(
    chatId,
    helpMessage,
    { parse_mode: 'Markdown' }
  )
}

/**
 * Handle /settings command
 */
async function handleSettingsCommand(chatId: number, userId: string) {
  const telegramService = getTelegramService()

  const settingsMessage = `*Settings*

Notification preferences coming soon!

For now, all notifications are enabled by default.`

  await telegramService.sendMessage(
    chatId,
    settingsMessage,
    { parse_mode: 'Markdown' }
  )
}

/**
 * Handle regular message (check for conversation state or route to AI chat)
 */
async function handleMessageOrAIChat(
  userId: string,
  chatId: number,
  messageText: string
) {
  const telegramService = getTelegramService()

  // TODO: Check for active conversation state
  // For now, just echo back (placeholder for AI chat integration)
  await telegramService.sendMessage(
    chatId,
    `You said: ${messageText}\n\n(AI chat integration coming soon!)`,
    { parse_mode: 'Markdown' }
  )

  // Log as AI chat context
  await TelegramUserService.logMessage(
    userId,
    'inbound',
    messageText,
    {
      contextType: 'ai_chat',
    }
  )
}
