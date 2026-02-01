import { getTelegramService } from '../TelegramService'
import { TelegramUserService } from '../TelegramUserService'
import { formatError, formatHelpText } from '@/lib/telegram/formatting'

/**
 * General Command Handlers
 * Handles /start, /help, /settings, and unknown commands
 */
export class GeneralCommands {
  /**
   * Handle /start command
   */
  static async handleStartCommand(chatId: number): Promise<void> {
    const telegramService = getTelegramService()

    const welcomeMessage = `Welcome to your Personal CRM & Life Coach! 👋

I can help you with:
• Managing contacts and reminders
• Tracking your trading positions
• Building better habits
• AI\\-powered life coaching

Use /help to see all available commands\\.`

    await telegramService.sendMessage(chatId, welcomeMessage, {
      parse_mode: 'Markdown',
    })
  }

  /**
   * Handle /help command
   */
  static async handleHelpCommand(chatId: number): Promise<void> {
    const telegramService = getTelegramService()
    const helpMessage = formatHelpText()

    await telegramService.sendMessage(chatId, helpMessage, {
      parse_mode: 'Markdown',
    })
  }

  /**
   * Handle /settings command
   */
  static async handleSettingsCommand(
    chatId: number,
    telegramUserId: string
  ): Promise<void> {
    const telegramService = getTelegramService()

    // Get user settings
    const user = await TelegramUserService.getUserByChatId(chatId)

    if (!user) {
      await telegramService.sendMessage(
        chatId,
        formatError('User not found. Please send /start to register.'),
        { parse_mode: 'Markdown' }
      )
      return
    }

    const notificationsStatus = user.notifications_enabled ? 'Enabled ✅' : 'Disabled ❌'

    const settingsMessage = `*Settings*

*Notifications:* ${notificationsStatus}

To change settings, use the web dashboard for now\\.

More settings controls coming soon\\!`

    await telegramService.sendMessage(chatId, settingsMessage, {
      parse_mode: 'Markdown',
    })
  }

  /**
   * Handle unknown command
   */
  static async handleUnknownCommand(
    chatId: number,
    command: string
  ): Promise<void> {
    const telegramService = getTelegramService()

    await telegramService.sendMessage(
      chatId,
      formatError(
        `Unknown command: /${command}\n\nUse /help to see available commands.`
      ),
      { parse_mode: 'Markdown' }
    )
  }
}
