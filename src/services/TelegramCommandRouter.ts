import { TelegramUserService } from './TelegramUserService'
import { getTelegramService } from './TelegramService'
import { parseCommand } from '@/lib/telegram/validation'
import { formatError } from '@/lib/telegram/formatting'

/**
 * TelegramCommandRouter - Routes incoming messages to appropriate handlers
 *
 * Routing logic:
 * 1. If message starts with '/', route to command handler
 * 2. If user has active conversation state, route to state handler
 * 3. Otherwise, route to AI chat handler
 */
export class TelegramCommandRouter {
  /**
   * Route an incoming message to the appropriate handler
   */
  static async route(
    telegramUserId: string,
    chatId: number,
    messageText: string
  ): Promise<void> {
    const telegramService = getTelegramService()

    try {
      // Parse command
      const parsedCommand = parseCommand(messageText)

      if (parsedCommand) {
        // Route to command handler
        await this.handleCommand(
          telegramUserId,
          chatId,
          parsedCommand.command,
          parsedCommand.rawArgs
        )
        return
      }

      // Check for active conversation state
      const conversationState = await TelegramUserService.getConversationState(
        telegramUserId,
        'active_conversation'
      )

      if (conversationState) {
        // Route to state handler
        await this.handleConversationState(
          telegramUserId,
          chatId,
          messageText,
          conversationState.state_data || {}
        )
        return
      }

      // Route to AI chat handler (Phase 3)
      await this.handleAIChat(telegramUserId, chatId, messageText)
    } catch (error) {
      console.error('Error routing message:', error)

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
  private static async handleCommand(
    telegramUserId: string,
    chatId: number,
    command: string,
    args: string
  ): Promise<void> {
    // Log command
    await TelegramUserService.logMessage(
      telegramUserId,
      'inbound',
      `/${command} ${args}`,
      { command }
    )

    // Import command handlers dynamically to avoid circular dependencies
    const { CRMCommands } = await import('./telegram-commands/CRMCommands')
    const { GeneralCommands } = await import('./telegram-commands/GeneralCommands')

    // Route to appropriate command handler
    switch (command) {
      // CRM commands
      case 'birthdays':
        await CRMCommands.handleBirthdaysCommand(chatId, args)
        break

      case 'contacts':
        await CRMCommands.handleContactsCommand(chatId)
        break

      case 'reminders':
        await CRMCommands.handleRemindersCommand(chatId)
        break

      case 'log':
        await CRMCommands.handleLogCommand(telegramUserId, chatId, args)
        break

      // General commands
      case 'start':
        await GeneralCommands.handleStartCommand(chatId)
        break

      case 'help':
        await GeneralCommands.handleHelpCommand(chatId)
        break

      case 'settings':
        await GeneralCommands.handleSettingsCommand(chatId, telegramUserId)
        break

      default:
        await GeneralCommands.handleUnknownCommand(chatId, command)
    }
  }

  /**
   * Handle conversation state (multi-step conversations)
   */
  private static async handleConversationState(
    telegramUserId: string,
    chatId: number,
    messageText: string,
    stateData: Record<string, any>
  ): Promise<void> {
    const { CRMCommands } = await import('./telegram-commands/CRMCommands')

    // Route based on conversation type
    const conversationType = stateData.type

    switch (conversationType) {
      case 'log_interaction':
        await CRMCommands.handleLogInteractionState(
          telegramUserId,
          chatId,
          messageText,
          stateData
        )
        break

      default:
        // Unknown conversation type, clear state
        await TelegramUserService.clearConversationState(
          telegramUserId,
          'active_conversation'
        )

        const telegramService = getTelegramService()
        await telegramService.sendMessage(
          chatId,
          formatError('Conversation timed out. Please start over.'),
          { parse_mode: 'Markdown' }
        )
    }
  }

  /**
   * Handle AI chat (Phase 3 - placeholder for now)
   */
  private static async handleAIChat(
    telegramUserId: string,
    chatId: number,
    messageText: string
  ): Promise<void> {
    const telegramService = getTelegramService()

    // Log as AI chat context
    await TelegramUserService.logMessage(
      telegramUserId,
      'inbound',
      messageText,
      { contextType: 'ai_chat' }
    )

    // Placeholder response
    await telegramService.sendMessage(
      chatId,
      `You said: ${messageText}\n\n(AI chat integration coming in Phase 3!)`,
      { parse_mode: 'Markdown' }
    )
  }
}
