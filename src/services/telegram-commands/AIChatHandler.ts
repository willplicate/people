import Anthropic from '@anthropic-ai/sdk'
import { getTelegramService } from '../TelegramService'
import { TelegramUserService } from '../TelegramUserService'
import { ContactService } from '../ContactService'
import { InteractionService } from '../InteractionService'
import { formatError } from '@/lib/telegram/formatting'
import fs from 'fs'
import path from 'path'

/**
 * AI Chat Handler
 * Uses Claude API with tool calling for natural language interactions
 */
export class AIChatHandler {
  private static anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  /**
   * Get system prompt from LIFE_COACH.md
   */
  private static getSystemPrompt(): string {
    try {
      const coachPath = path.join(process.cwd(), 'scripts', 'LIFE_COACH.md')
      const coachContent = fs.readFileSync(coachPath, 'utf-8')

      return `You are William's personal assistant and life coach, integrated into his Telegram bot.

${coachContent}

## Your Role via Telegram
You help William manage his life through natural conversation:
- Check upcoming birthdays and contacts needing outreach
- Log interactions with people
- Provide life coaching based on the framework above
- Be conversational, supportive, and direct when needed

When William asks about contacts, birthdays, or wants to log interactions, use the provided tools.
For life coaching or general chat, respond conversationally based on the framework above.

Keep responses concise for Telegram (2-3 paragraphs max). Use Markdown formatting sparingly.`
    } catch (error) {
      console.error('Error reading LIFE_COACH.md:', error)
      return `You are William's personal assistant. Help him manage contacts, track birthdays, and provide support. Be concise and helpful.`
    }
  }

  /**
   * Define tools for Claude to call
   */
  private static getTools(): Anthropic.Tool[] {
    return [
      {
        name: 'get_upcoming_birthdays',
        description:
          'Get contacts with upcoming birthdays within a specified number of days. Use this when the user asks about birthdays coming up.',
        input_schema: {
          type: 'object',
          properties: {
            days_ahead: {
              type: 'number',
              description: 'Number of days to look ahead (default: 7)',
              default: 7,
            },
          },
          required: [],
        },
      },
      {
        name: 'get_contacts_needing_outreach',
        description:
          'Get contacts that need outreach based on their communication frequency settings. Use this when the user asks about who they should contact or reach out to.',
        input_schema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'search_contacts',
        description:
          'Search for contacts by name. Use this when the user mentions a specific person or wants to find someone.',
        input_schema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name to search for',
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'log_interaction',
        description:
          'Log an interaction with a contact. Use this when the user mentions they talked to someone or wants to record a conversation.',
        input_schema: {
          type: 'object',
          properties: {
            contact_name: {
              type: 'string',
              description: 'Name of the contact',
            },
            interaction_type: {
              type: 'string',
              enum: ['call', 'text', 'email', 'meetup', 'other'],
              description: 'Type of interaction',
            },
            notes: {
              type: 'string',
              description: 'Notes about the interaction',
            },
          },
          required: ['contact_name', 'interaction_type'],
        },
      },
    ]
  }

  /**
   * Handle AI chat message
   */
  static async handleAIChat(
    telegramUserId: string,
    chatId: number,
    messageText: string
  ): Promise<void> {
    const telegramService = getTelegramService()

    try {
      // Send typing indicator
      await telegramService.sendChatAction(chatId, 'typing')

      // Get conversation history from last 10 messages
      const history = await this.getConversationHistory(telegramUserId)

      // Build messages for Claude
      const messages: Anthropic.MessageParam[] = [
        ...history,
        {
          role: 'user',
          content: messageText,
        },
      ]

      // Call Claude API with tools
      let response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: this.getSystemPrompt(),
        messages,
        tools: this.getTools(),
      })

      // Handle tool calls
      while (response.stop_reason === 'tool_use') {
        const toolUse = response.content.find(
          (block) => block.type === 'tool_use'
        ) as Anthropic.ToolUseBlock | undefined

        if (!toolUse) break

        // Execute tool
        const toolResult = await this.executeTool(toolUse.name, toolUse.input)

        // Continue conversation with tool result
        messages.push({
          role: 'assistant',
          content: response.content,
        })

        messages.push({
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: JSON.stringify(toolResult),
            },
          ],
        })

        response = await this.anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: this.getSystemPrompt(),
          messages,
          tools: this.getTools(),
        })
      }

      // Extract text response
      const textContent = response.content.find(
        (block) => block.type === 'text'
      ) as Anthropic.TextBlock | undefined

      const responseText =
        textContent?.text || "I'm sorry, I couldn't process that request."

      // Send response
      await telegramService.sendMessage(chatId, responseText, {
        parse_mode: 'Markdown',
      })

      // Log messages
      await TelegramUserService.logMessage(
        telegramUserId,
        'inbound',
        messageText,
        { contextType: 'ai_chat' }
      )

      await TelegramUserService.logMessage(
        telegramUserId,
        'outbound',
        responseText,
        { contextType: 'ai_chat' }
      )
    } catch (error) {
      console.error('Error handling AI chat:', error)

      await telegramService.sendMessage(
        chatId,
        formatError('Sorry, I encountered an error processing your message.'),
        { parse_mode: 'Markdown' }
      )
    }
  }

  /**
   * Execute a tool call
   */
  private static async executeTool(
    toolName: string,
    input: any
  ): Promise<any> {
    try {
      switch (toolName) {
        case 'get_upcoming_birthdays': {
          const daysAhead = input.days_ahead || 7
          const contacts = await ContactService.getUpcomingBirthdays(daysAhead)

          return {
            success: true,
            count: contacts.length,
            contacts: contacts.map((c) => ({
              name: [c.first_name, c.last_name].filter(Boolean).join(' '),
              birthday: c.birthday,
            })),
          }
        }

        case 'get_contacts_needing_outreach': {
          const contacts = await ContactService.getContactsNeedingReminders()

          return {
            success: true,
            count: contacts.length,
            contacts: contacts.slice(0, 10).map((c) => ({
              name: [c.first_name, c.last_name].filter(Boolean).join(' '),
              frequency: c.communication_frequency,
              last_contacted: c.last_contacted_at,
            })),
          }
        }

        case 'search_contacts': {
          const contacts = await ContactService.getAll({
            search: input.name,
            limit: 5,
          })

          return {
            success: true,
            count: contacts.length,
            contacts: contacts.map((c) => ({
              id: c.id,
              name: [c.first_name, c.last_name].filter(Boolean).join(' '),
              birthday: c.birthday,
              last_contacted: c.last_contacted_at,
            })),
          }
        }

        case 'log_interaction': {
          // Search for contact
          const contacts = await ContactService.getAll({
            search: input.contact_name,
            limit: 1,
          })

          if (contacts.length === 0) {
            return {
              success: false,
              error: `Contact "${input.contact_name}" not found`,
            }
          }

          const contact = contacts[0]

          // Log interaction
          await InteractionService.create({
            contact_id: contact.id,
            type: input.interaction_type,
            notes: input.notes || '',
            interaction_date: new Date().toISOString().split('T')[0],
          })

          return {
            success: true,
            message: `Logged ${input.interaction_type} with ${contact.first_name}`,
          }
        }

        default:
          return {
            success: false,
            error: `Unknown tool: ${toolName}`,
          }
      }
    } catch (error) {
      console.error(`Error executing tool ${toolName}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Get conversation history for context
   */
  private static async getConversationHistory(
    telegramUserId: string
  ): Promise<Anthropic.MessageParam[]> {
    try {
      const { supabase } = await import('@/lib/supabase')

      const { data: messages } = await supabase
        .from('telegram_messages')
        .select('*')
        .eq('telegram_user_id', telegramUserId)
        .eq('context_type', 'ai_chat')
        .order('created_at', { ascending: false })
        .limit(10)

      if (!messages || messages.length === 0) {
        return []
      }

      // Reverse to chronological order and convert to Claude format
      const history: Anthropic.MessageParam[] = []
      messages.reverse().forEach((msg) => {
        history.push({
          role: msg.direction === 'inbound' ? 'user' : 'assistant',
          content: msg.message_text,
        })
      })

      return history
    } catch (error) {
      console.error('Error fetching conversation history:', error)
      return []
    }
  }
}
