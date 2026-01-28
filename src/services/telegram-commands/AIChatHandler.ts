import Anthropic from '@anthropic-ai/sdk'
import { getTelegramService } from '../TelegramService'
import { TelegramUserService } from '../TelegramUserService'
import { ContactService } from '../ContactService'
import { InteractionService } from '../InteractionService'
import { TaskService } from '../TaskService'
import { TradingService } from '../TradingService'
import { formatError } from '@/lib/telegram/formatting'
import { supabase } from '@/lib/supabase'

/**
 * AI Chat Handler
 * Uses Claude API with tool calling for natural language interactions
 */
export class AIChatHandler {
  private static anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  /**
   * Get system prompt with James's personality
   */
  private static getSystemPrompt(): string {
    return `You are James, William's helpful best friend who happens to be an AI. You're intelligent, funny, and genuinely care about helping him stay on track.

## Your Personality
- **Tone**: Like a smart, witty best friend - not a formal assistant
- **Humor**: Use it naturally, especially when William is being hard on himself
- **Directness**: Call him out lovingly when he's drifting from his goals
- **Support**: Celebrate wins, encourage during struggles
- **Never**: Use corporate speak, be overly formal, or patronizing

## About William (Your Context)
- Living in Barcelona with partner Jucas, getting married in 4 months
- Learning Spanish for B2 exam
- Working on systematic trading (Turtle strategy LEAPS)
- Year of Following Through - finish what you start
- Struggles with imposter syndrome despite positive feedback
- Tends to drift from trading system when it gets boring
- Uses substances as social lubricant but trying to prove he's interesting sober
- Has Monday trading execution habit, Admin Friday, swimming 3x/week

## Key Habits He's Building
- Monday trading execution (systematic, no deviations)
- Social sobriety (one sober event per month)
- Daily Spanish practice (15 min for B2 exam)
- Finish one thing before starting another
- Admin Friday (60 min for wedding/tax/bureaucracy)
- Swimming consistency

## Patterns to Coach On
- **Imposter syndrome**: Remind him his improvements (hair system, filler) are problem-solving, not fraud
- **Trading drift**: Call him out when seeking "sophisticated" alternatives to Turtle
- **Catastrophizing**: Challenge negative narratives during waiting periods
- **Project hopping**: Acknowledge urge to start new things but encourage finishing current ones
- **Not speaking up at work**: Remind him his opinion IS valid

## What You Help With
Via natural conversation and tools:
- Manage contacts and remember to reach out to people
- Track birthdays and life events
- Log tasks and keep him accountable
- Record trading activity (his Turtle LEAPS strategy)
- Provide coaching based on his goals and patterns above

When he asks about contacts, tasks, trades, or life stuff, use the available tools.
For coaching or chat, respond like a supportive best friend would.

Keep responses concise for Telegram (2-3 paragraphs max). Be real, be helpful, be James.`
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
      {
        name: 'create_task',
        description:
          'Create a new task/todo item. Use this when the user wants to add a task, create a reminder, or remember to do something.',
        input_schema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Short title for the task',
            },
            description: {
              type: 'string',
              description: 'Optional detailed description',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
              description: 'Task priority (default: medium)',
              default: 'medium',
            },
            category: {
              type: 'string',
              enum: ['work', 'personal'],
              description: 'Task category (default: personal)',
              default: 'personal',
            },
            due_date: {
              type: 'string',
              description: 'Optional due date in YYYY-MM-DD format',
            },
          },
          required: ['title'],
        },
      },
      {
        name: 'get_tasks',
        description:
          'Get tasks/todo items. Use this when the user asks to see their tasks, what they need to do, or their todo list.',
        input_schema: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['todo', 'in_progress', 'completed', 'cancelled'],
              description: 'Filter by status (default: show all)',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
              description: 'Filter by priority',
            },
            category: {
              type: 'string',
              enum: ['work', 'personal'],
              description: 'Filter by category',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of tasks to return (default: 10)',
              default: 10,
            },
          },
          required: [],
        },
      },
      {
        name: 'log_trade',
        description:
          'Log an options trade (LEAPS strategy). Use when William mentions buying/selling calls or puts. Extract ticker, action (BUY/SELL), option type, strike price, premium, expiration, and number of contracts from natural language.',
        input_schema: {
          type: 'object',
          properties: {
            ticker_symbol: {
              type: 'string',
              description: 'Stock ticker symbol (e.g., SPY, AAPL)',
            },
            action: {
              type: 'string',
              enum: ['BUY', 'SELL'],
              description: 'Whether buying or selling',
            },
            option_type: {
              type: 'string',
              enum: ['CALL', 'PUT'],
              description: 'Call or Put option',
            },
            strike_price: {
              type: 'number',
              description: 'Strike price of the option',
            },
            premium_per_contract: {
              type: 'number',
              description: 'Premium price per contract in dollars',
            },
            number_of_contracts: {
              type: 'number',
              description: 'Number of contracts (default: 1)',
              default: 1,
            },
            expiration_date: {
              type: 'string',
              description: 'Expiration date - can be relative like "next Friday" or absolute like "2026-03-21"',
            },
            notes: {
              type: 'string',
              description: 'Optional notes about the trade rationale',
            },
          },
          required: ['action', 'option_type', 'strike_price', 'premium_per_contract', 'expiration_date'],
        },
      },
    ]
  }

  /**
   * Parse relative date expressions like "next Friday", "this Friday", "Jan 15"
   */
  private static parseRelativeDate(dateStr: string): string {
    const lower = dateStr.toLowerCase().trim()
    const today = new Date()

    // Handle "next Friday", "this Friday", etc.
    const dayMatch = lower.match(/(next|this)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i)
    if (dayMatch) {
      const isNext = dayMatch[1] === 'next'
      const targetDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(
        dayMatch[2].toLowerCase()
      )

      let daysAhead = (targetDay - today.getDay() + 7) % 7
      if (daysAhead === 0) daysAhead = 7 // If today, go to next week
      if (isNext) daysAhead += 7

      const targetDate = new Date(today)
      targetDate.setDate(today.getDate() + daysAhead)
      return targetDate.toISOString().split('T')[0]
    }

    // Handle "tomorrow"
    if (lower === 'tomorrow') {
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)
      return tomorrow.toISOString().split('T')[0]
    }

    // Handle "in X days"
    const daysMatch = lower.match(/in\s+(\d+)\s+days?/i)
    if (daysMatch) {
      const days = parseInt(daysMatch[1])
      const targetDate = new Date(today)
      targetDate.setDate(today.getDate() + days)
      return targetDate.toISOString().split('T')[0]
    }

    // Try to parse as date (YYYY-MM-DD, Jan 15, etc.)
    try {
      const parsed = new Date(dateStr)
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0]
      }
    } catch (e) {
      // Ignore parse errors
    }

    // Return as-is if we can't parse
    return dateStr
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
        model: 'claude-sonnet-4-5-20250929',
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
          model: 'claude-sonnet-4-5-20250929',
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

        case 'create_task': {
          const task = await TaskService.create({
            title: input.title,
            description: input.description || undefined,
            priority: input.priority || 'medium',
            status: 'todo',
            category: input.category || 'personal',
            due_date: input.due_date || undefined,
            tags: [],
          })

          return {
            success: true,
            message: `Created task: ${task.title}`,
            task_id: task.id,
          }
        }

        case 'get_tasks': {
          const tasks = await TaskService.getAll({
            status: input.status || undefined,
            priority: input.priority || undefined,
            category: input.category || undefined,
            limit: input.limit || 10,
          })

          return {
            success: true,
            count: tasks.length,
            tasks: tasks.map((t) => ({
              id: t.id,
              title: t.title,
              description: t.description,
              priority: t.priority,
              status: t.status,
              category: t.category,
              due_date: t.due_date,
            })),
          }
        }

        case 'log_trade': {
          // Parse expiration date
          const expirationDate = this.parseRelativeDate(input.expiration_date)

          // Get or create today's trading session
          const session = await TradingService.getOrCreateTodaySession('default-user')

          // Determine status (OPEN if buying, CLOSED if selling existing position)
          const status = input.action === 'BUY' ? 'OPEN' : 'CLOSED'

          // Create the trade
          const trade = await TradingService.createTrade({
            session_id: session.id,
            user_id: 'default-user',
            trade_date: new Date().toISOString().split('T')[0],
            ticker_symbol: input.ticker_symbol?.toUpperCase() || 'UNKNOWN',
            option_type: input.option_type,
            action: input.action,
            strike_price: input.strike_price,
            premium_per_contract: input.premium_per_contract,
            number_of_contracts: input.number_of_contracts || 1,
            expiration_date: expirationDate,
            status: status,
            trade_rationale: input.notes,
          })

          const actionText = input.action === 'BUY' ? 'Bought' : 'Sold'
          const contractText = (input.number_of_contracts || 1) === 1 ? 'contract' : 'contracts'

          return {
            success: true,
            message: `${actionText} ${input.number_of_contracts || 1} ${input.ticker_symbol || ''} ${input.option_type} ${contractText} @ $${input.strike_price} strike for $${input.premium_per_contract}, exp ${expirationDate}`,
            trade_id: trade.id,
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
