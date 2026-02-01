import { NextRequest, NextResponse } from 'next/server'
import { TelegramUpdate } from '@/lib/telegram/types'
import { verifyWebhookSignature, isPrivateChat } from '@/lib/telegram/validation'
import { getTelegramService } from '@/services/TelegramService'
import { TelegramUserService } from '@/services/TelegramUserService'
import { TelegramCommandRouter } from '@/services/TelegramCommandRouter'
import { formatError } from '@/lib/telegram/formatting'

/**
 * Telegram Webhook Handler
 * Receives updates from Telegram and routes them to appropriate handlers
 */
export async function POST(req: NextRequest) {
  try {
    // Verify webhook signature (if secret token is set)
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

    // Route message through command router
    await TelegramCommandRouter.route(user.id, chatId, message.text)
  } catch (error) {
    console.error('Error handling message:', error)

    await telegramService.sendMessage(
      chatId,
      formatError('An error occurred processing your message.'),
      { parse_mode: 'Markdown' }
    )
  }
}
