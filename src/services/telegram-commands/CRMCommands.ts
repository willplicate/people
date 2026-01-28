import { getTelegramService } from '../TelegramService'
import { TelegramUserService } from '../TelegramUserService'
import { ContactService } from '../ContactService'
import { InteractionService } from '../InteractionService'
import {
  formatError,
  formatSuccess,
  formatBirthdayReminder,
  formatContactReminder,
  formatList,
  formatDate,
} from '@/lib/telegram/formatting'

/**
 * CRM Command Handlers
 * Integrates with ContactService and InteractionService
 */
export class CRMCommands {
  /**
   * Handle /birthdays [days] command
   * Shows upcoming birthdays (default: 7 days)
   */
  static async handleBirthdaysCommand(
    chatId: number,
    args: string
  ): Promise<void> {
    const telegramService = getTelegramService()

    try {
      // Parse days argument (default: 7)
      const daysAhead = args ? parseInt(args.trim()) : 7

      if (isNaN(daysAhead) || daysAhead < 1 || daysAhead > 365) {
        await telegramService.sendMessage(
          chatId,
          formatError('Please provide a valid number of days (1-365).'),
          { parse_mode: 'Markdown' }
        )
        return
      }

      // Send typing indicator
      await telegramService.sendChatAction(chatId, 'typing')

      // Get upcoming birthdays
      const contacts = await ContactService.getUpcomingBirthdays(daysAhead)

      if (contacts.length === 0) {
        await telegramService.sendMessage(
          chatId,
          `No upcoming birthdays in the next ${daysAhead} day${daysAhead > 1 ? 's' : ''}.`,
          { parse_mode: 'Markdown' }
        )
        return
      }

      // Sort by days until birthday
      const today = new Date()
      const contactsWithDays = contacts.map(contact => {
        if (!contact.birthday) return { contact, daysUntil: 999 }

        const [month, day] = contact.birthday.split('-').map(Number)
        let birthdayThisYear = new Date(today.getFullYear(), month - 1, day)

        // If birthday already passed this year, check next year
        if (birthdayThisYear < today) {
          birthdayThisYear = new Date(today.getFullYear() + 1, month - 1, day)
        }

        const diffTime = birthdayThisYear.getTime() - today.getTime()
        const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        return { contact, daysUntil }
      })

      contactsWithDays.sort((a, b) => a.daysUntil - b.daysUntil)

      // Format message
      const birthdayList = contactsWithDays
        .map(({ contact, daysUntil }) =>
          formatBirthdayReminder(contact, daysUntil)
        )
        .join('\n\n')

      const message = `*Upcoming Birthdays* \\(next ${daysAhead} days\\)\n\n${birthdayList}`

      await telegramService.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
      })
    } catch (error) {
      console.error('Error handling birthdays command:', error)
      await telegramService.sendMessage(
        chatId,
        formatError('Failed to fetch birthdays. Please try again.'),
        { parse_mode: 'Markdown' }
      )
    }
  }

  /**
   * Handle /contacts command
   * Shows contacts needing outreach based on communication frequency
   */
  static async handleContactsCommand(chatId: number): Promise<void> {
    const telegramService = getTelegramService()

    try {
      // Send typing indicator
      await telegramService.sendChatAction(chatId, 'typing')

      // Get contacts needing reminders
      const contacts = await ContactService.getContactsNeedingReminders()

      if (contacts.length === 0) {
        await telegramService.sendMessage(
          chatId,
          'All caught up! No contacts need outreach right now. 🎉',
          { parse_mode: 'Markdown' }
        )
        return
      }

      // Format message
      const contactList = contacts
        .slice(0, 10) // Limit to first 10 to avoid message too long
        .map(contact => formatContactReminder(contact))
        .join('\n\n')

      const moreText =
        contacts.length > 10
          ? `\n\n\\.\\.\\. and ${contacts.length - 10} more`
          : ''

      const message = `*Contacts Needing Outreach*\n\n${contactList}${moreText}`

      await telegramService.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
      })
    } catch (error) {
      console.error('Error handling contacts command:', error)
      await telegramService.sendMessage(
        chatId,
        formatError('Failed to fetch contacts. Please try again.'),
        { parse_mode: 'Markdown' }
      )
    }
  }

  /**
   * Handle /reminders command
   * Shows pending reminders from the database
   */
  static async handleRemindersCommand(chatId: number): Promise<void> {
    const telegramService = getTelegramService()

    try {
      // Send typing indicator
      await telegramService.sendChatAction(chatId, 'typing')

      // TODO: Implement ReminderService integration
      // For now, show placeholder
      await telegramService.sendMessage(
        chatId,
        '*Pending Reminders*\n\nReminder integration coming soon!',
        { parse_mode: 'Markdown' }
      )
    } catch (error) {
      console.error('Error handling reminders command:', error)
      await telegramService.sendMessage(
        chatId,
        formatError('Failed to fetch reminders. Please try again.'),
        { parse_mode: 'Markdown' }
      )
    }
  }

  /**
   * Handle /log {contact_name} command
   * Starts multi-step conversation to log an interaction
   */
  static async handleLogCommand(
    telegramUserId: string,
    chatId: number,
    args: string
  ): Promise<void> {
    const telegramService = getTelegramService()

    try {
      const contactName = args.trim()

      if (!contactName) {
        await telegramService.sendMessage(
          chatId,
          formatError('Please provide a contact name.\n\nExample: `/log John Smith`'),
          { parse_mode: 'Markdown' }
        )
        return
      }

      // Search for contact
      const contacts = await ContactService.getAll({ search: contactName })

      if (contacts.length === 0) {
        await telegramService.sendMessage(
          chatId,
          formatError(`No contact found matching "${contactName}".`),
          { parse_mode: 'Markdown' }
        )
        return
      }

      if (contacts.length > 1) {
        // Multiple matches - show options
        const contactList = contacts
          .slice(0, 5)
          .map((c, i) => {
            const name = [c.first_name, c.last_name].filter(Boolean).join(' ')
            return `${i + 1}\\. ${name}`
          })
          .join('\n')

        await telegramService.sendMessage(
          chatId,
          `Multiple contacts found:\n\n${contactList}\n\nPlease be more specific.`,
          { parse_mode: 'Markdown' }
        )
        return
      }

      // Single match - start conversation
      const contact = contacts[0]
      const fullName = [contact.first_name, contact.last_name]
        .filter(Boolean)
        .join(' ')

      // Set conversation state
      await TelegramUserService.setConversationState(
        telegramUserId,
        'active_conversation',
        {
          type: 'log_interaction',
          contact_id: contact.id,
          contact_name: fullName,
          step: 'type',
        },
        10 // Expires in 10 minutes
      )

      await telegramService.sendMessage(
        chatId,
        `Logging interaction with *${fullName}*\n\nWhat type of interaction was it?\n\n1\\. Call\n2\\. Text\n3\\. Email\n4\\. Meetup\n5\\. Other\n\nReply with a number or type name\\.`,
        { parse_mode: 'Markdown' }
      )
    } catch (error) {
      console.error('Error handling log command:', error)
      await telegramService.sendMessage(
        chatId,
        formatError('Failed to start logging interaction. Please try again.'),
        { parse_mode: 'Markdown' }
      )
    }
  }

  /**
   * Handle conversation state for logging interaction
   */
  static async handleLogInteractionState(
    telegramUserId: string,
    chatId: number,
    messageText: string,
    stateData: Record<string, any>
  ): Promise<void> {
    const telegramService = getTelegramService()

    try {
      const step = stateData.step

      if (step === 'type') {
        // Parse interaction type
        let type: 'call' | 'text' | 'email' | 'meetup' | 'other' = 'other'

        const lowerText = messageText.toLowerCase().trim()
        if (lowerText === '1' || lowerText === 'call') type = 'call'
        else if (lowerText === '2' || lowerText === 'text') type = 'text'
        else if (lowerText === '3' || lowerText === 'email') type = 'email'
        else if (lowerText === '4' || lowerText === 'meetup') type = 'meetup'
        else if (lowerText === '5' || lowerText === 'other') type = 'other'

        // Update state
        await TelegramUserService.setConversationState(
          telegramUserId,
          'active_conversation',
          {
            ...stateData,
            type: 'log_interaction',
            interaction_type: type,
            step: 'notes',
          },
          10
        )

        await telegramService.sendMessage(
          chatId,
          `Great! Now, what notes would you like to add about this interaction?\n\n\\(Or type "skip" to save without notes\\)`,
          { parse_mode: 'Markdown' }
        )
      } else if (step === 'notes') {
        // Save interaction
        const notes = messageText.toLowerCase().trim() === 'skip' ? '' : messageText

        await InteractionService.create({
          contact_id: stateData.contact_id,
          type: stateData.interaction_type,
          notes,
          interaction_date: new Date().toISOString().split('T')[0],
        })

        // Clear conversation state
        await TelegramUserService.clearConversationState(
          telegramUserId,
          'active_conversation'
        )

        await telegramService.sendMessage(
          chatId,
          formatSuccess(
            `Interaction with ${stateData.contact_name} logged successfully!`
          ),
          { parse_mode: 'Markdown' }
        )
      }
    } catch (error) {
      console.error('Error handling log interaction state:', error)

      // Clear state on error
      await TelegramUserService.clearConversationState(
        telegramUserId,
        'active_conversation'
      )

      await telegramService.sendMessage(
        chatId,
        formatError('Failed to log interaction. Please try again with /log.'),
        { parse_mode: 'Markdown' }
      )
    }
  }
}
