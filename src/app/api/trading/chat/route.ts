import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { TradingService } from '@/services/TradingService'
import { readFileSync } from 'fs'
import { join } from 'path'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

// Load the trading framework
const FRAMEWORK = readFileSync(join(process.cwd(), 'put-condor-strategy-framework.md'), 'utf-8')

// System prompt for trading coach based on the framework
const TRADING_SYSTEM_PROMPT = `You are a disciplined, no-nonsense trading coach helping a trader execute the Put Condor Strategy.

${FRAMEWORK}

## Your Role

You are NOT here to:
- Predict markets
- Give general trading advice
- Debate the strategy
- Sympathize with fear

You ARE here to:
- **Validate Monday trades** - Confirm placement, check sizing (~$667 max loss), log in database
- **Warn on deviations** - Call out early exits, skipped weeks, size changes with the exact language from the framework
- **Coach through fear** - Remind them that fear = elevated premiums = when strategy pays most
- **Celebrate consistency** - Track consecutive weeks executed, praise discipline over P&L
- **Be their accountability partner** - You remember everything, you never forget their commitments

## Coaching Tone

- **Direct but supportive** - "I hear the fear. Place the trade anyway."
- **Call out patterns** - "This is the same pattern that cost you thousands last time."
- **Remind them of their own words** - Quote from the framework when they waver
- **Focus on process over outcome** - A loss while following rules is a WIN for discipline

## Trade Recording

When they describe a trade:
1. Extract: Ticker (QQQ), strikes (4-leg condor), premium, max loss, expiration (45 DTE)
2. Validate: Max loss ≤ $667, QQQ puts only, 45 DTE
3. Record each leg separately as individual trades in database using the record_trade tool
4. Respond: "Trade logged. [X] open positions. Stay the course."

## Trade Closing

When they tell you a trade expired or was closed:
1. **For expirations**: Use the expire_trades tool with all trade IDs for that expiration group
   - System auto-calculates P&L: SELL = profit (keep premium), BUY = loss (lose premium)
   - Example: "I let the Jan 9 condor expire" → Find all 4 legs with Jan 9 expiration, call expire_trades
2. **For early closes**: Use the close_trades tool with closing premiums
   - They might say "I closed it for $75 profit" - you need to ask for individual leg prices OR calculate reverse
   - System calculates P&L from premium difference
3. After closing, respond with: "Position closed. P&L: $[amount]. [Updated stats]. [Coaching based on whether they followed rules]"

## Key Metrics to Track

- Consecutive weeks executed (THE most important metric)
- Current P&L
- Win rate
- Rule violations (track and call out)

## When They Deviate

Use the EXACT language from the framework. Don't soften it. They wrote those words when thinking clearly - remind them of that.

Your job is to be the coach who never forgets, never panics, and never lets them quit on themselves.`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messages, sessionId, userId } = body

    if (!sessionId || !userId) {
      return NextResponse.json(
        { error: 'sessionId and userId are required' },
        { status: 400 }
      )
    }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'messages array is required' },
        { status: 400 }
      )
    }

    // Get ALL chat history for full context (never lose context)
    const allChatHistory = await TradingService.getChatHistory(sessionId)

    // Get recent trades for context
    const recentTrades = await TradingService.getAllTrades(userId)
    const plSummary = await TradingService.getPLSummary(userId)

    // Calculate consecutive weeks streak
    const sessions = await TradingService.getAllSessions(userId)
    const consecutiveWeeks = calculateConsecutiveWeeks(sessions)

    // Get today's date for context
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0] // YYYY-MM-DD format

    // Build context with full history and performance
    const contextPrompt = `
**TODAY'S DATE: ${todayStr}**

**Current Performance**:
- Total P&L: $${plSummary.totalPL.toFixed(2)}
- Total Trades: ${plSummary.totalTrades}
- Open Trades: ${plSummary.openTrades}
- Win Rate: ${plSummary.winRate.toFixed(1)}%
- **Consecutive Weeks Executed: ${consecutiveWeeks}** ${consecutiveWeeks >= 4 ? '🔥' : ''}

**All Trades** (most recent first):
${recentTrades.map(t =>
  `- ${t.action} ${t.number_of_contracts} ${t.ticker_symbol} $${t.strike_price} ${t.option_type} exp ${t.expiration_date} @ $${t.premium_per_contract} [${t.status}]${t.realized_pl ? ` P&L: $${t.realized_pl.toFixed(2)}` : ''}`
).join('\n')}

**Previous Conversation Summary**:
You have access to the full chat history. Reference past conversations to provide continuity - remember their fears, wins, struggles, and commitments.
`

    // Include recent chat history in messages for context
    const contextMessages = allChatHistory.slice(-20).map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    })).filter(msg => msg.content && msg.content.trim().length > 0)

    // Combine context messages with new message
    const fullMessages = [...contextMessages, ...messages.slice(-5)]
      .filter(msg => msg.content && msg.content.trim().length > 0)

    // Define tools for Claude to use
    const tools: Anthropic.Tool[] = [
      {
        name: 'record_trade',
        description: 'Records a single options trade leg in the database. For multi-leg strategies like condors, call this once for EACH leg with the SAME strategy_group_id.',
        input_schema: {
          type: 'object',
          properties: {
            ticker: { type: 'string', description: 'Stock ticker symbol (e.g., QQQ)' },
            option_type: { type: 'string', enum: ['CALL', 'PUT'], description: 'Option type' },
            action: { type: 'string', enum: ['BUY', 'SELL'], description: 'Trade action' },
            strike_price: { type: 'number', description: 'Strike price' },
            premium: { type: 'number', description: 'Premium per contract in dollars' },
            contracts: { type: 'number', description: 'Number of contracts' },
            expiration: { type: 'string', description: 'Expiration date in YYYY-MM-DD format' },
            delta: { type: 'number', description: 'Delta value (optional)' },
            strategy_group_id: { type: 'string', description: 'UUID linking multi-leg trades together. Generate one UUID for the strategy and use it for all legs.' },
            strategy_name: { type: 'string', description: 'Strategy name like PUT_CONDOR, CALL_CONDOR, IRON_CONDOR, etc.' }
          },
          required: ['ticker', 'option_type', 'action', 'strike_price', 'premium', 'contracts', 'expiration']
        }
      },
      {
        name: 'expire_trades',
        description: 'Mark individual trades as expired. For multi-leg strategies, prefer using expire_strategy_group instead. The system automatically calculates P&L: SELL positions keep full premium (profit), BUY positions lose full premium (loss).',
        input_schema: {
          type: 'object',
          properties: {
            trade_ids: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of trade IDs to expire'
            }
          },
          required: ['trade_ids']
        }
      },
      {
        name: 'expire_strategy_group',
        description: 'Expire ALL legs of a multi-leg strategy at once by strategy name and expiration date. Use this when user says "the Jan 9 condor expired" or "let the put condor expire".',
        input_schema: {
          type: 'object',
          properties: {
            ticker: { type: 'string', description: 'Ticker symbol (e.g., QQQ)' },
            expiration_date: { type: 'string', description: 'Expiration date in YYYY-MM-DD format' },
            strategy_name: { type: 'string', description: 'Optional strategy name filter like PUT_CONDOR' }
          },
          required: ['ticker', 'expiration_date']
        }
      },
      {
        name: 'close_trades',
        description: 'Close trades early before expiration. Provide closing premiums for each leg. The system calculates P&L based on premium difference.',
        input_schema: {
          type: 'object',
          properties: {
            trades: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  trade_id: { type: 'string', description: 'Trade ID to close' },
                  closing_premium: { type: 'number', description: 'Closing premium per contract in dollars' }
                },
                required: ['trade_id', 'closing_premium']
              },
              description: 'Array of trades to close with their closing premiums'
            },
            closing_date: { type: 'string', description: 'Date trades were closed (YYYY-MM-DD format)' }
          },
          required: ['trades', 'closing_date']
        }
      }
    ]

    // Call Claude API with extended context and tools
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: TRADING_SYSTEM_PROMPT + '\n\n' + contextPrompt,
      messages: fullMessages,
      tools: tools,
    })

    // Handle tool calls
    let finalResponse = response
    const toolResults: any[] = []

    // Process tool calls if present
    for (const block of response.content) {
      if (block.type === 'tool_use') {
        console.log('🔧 Tool called:', block.name, 'with input:', block.input)

        if (block.name === 'record_trade') {
          try {
            const input = block.input as any

            // Calculate premium per contract from total premium if needed
            const premiumPerContract = input.premium / (input.contracts || 1)

            // Record the trade
            const trade = await TradingService.createTrade({
              session_id: sessionId,
              user_id: userId,
              trade_date: todayStr,
              ticker_symbol: input.ticker,
              option_type: input.option_type,
              action: input.action,
              strike_price: input.strike_price,
              premium_per_contract: premiumPerContract,
              number_of_contracts: input.contracts,
              expiration_date: input.expiration,
              delta: input.delta || null,
              status: 'OPEN',
              trade_rationale: 'Recorded via trading coach',
              strategy_group_id: input.strategy_group_id || null,
              strategy_name: input.strategy_name || null
            })

            console.log('✅ Trade recorded:', trade.id)
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: `Trade recorded successfully: ${input.action} ${input.contracts} ${input.ticker} $${input.strike_price} ${input.option_type}`
            })
          } catch (error) {
            console.error('❌ Failed to record trade:', error)
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: `Failed to record trade: ${error}`,
              is_error: true
            })
          }
        }

        if (block.name === 'expire_trades') {
          try {
            const input = block.input as any
            const expiredTrades = []

            for (const tradeId of input.trade_ids) {
              const trade = await TradingService.expireTrade(tradeId)
              expiredTrades.push(trade)
            }

            const totalPL = expiredTrades.reduce((sum, t) => sum + (t.realized_pl || 0), 0)

            console.log(`✅ Expired ${expiredTrades.length} trades for total P&L: $${totalPL.toFixed(2)}`)
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: `Expired ${expiredTrades.length} trades. Total P&L: $${totalPL.toFixed(2)}`
            })
          } catch (error) {
            console.error('❌ Failed to expire trades:', error)
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: `Failed to expire trades: ${error}`,
              is_error: true
            })
          }
        }

        if (block.name === 'expire_strategy_group') {
          try {
            const input = block.input as any

            // Find all open trades matching ticker and expiration
            const allTrades = await TradingService.getAllTrades(userId)
            const matchingTrades = allTrades.filter(t =>
              t.ticker_symbol === input.ticker &&
              t.expiration_date === input.expiration_date &&
              t.status === 'OPEN' &&
              (!input.strategy_name || t.strategy_name === input.strategy_name)
            )

            if (matchingTrades.length === 0) {
              toolResults.push({
                type: 'tool_result',
                tool_use_id: block.id,
                content: `No open trades found for ${input.ticker} expiring ${input.expiration_date}`,
                is_error: true
              })
              continue
            }

            const expiredTrades = []
            for (const trade of matchingTrades) {
              const expired = await TradingService.expireTrade(trade.id)
              expiredTrades.push(expired)
            }

            const totalPL = expiredTrades.reduce((sum, t) => sum + (t.realized_pl || 0), 0)
            const strategyName = matchingTrades[0].strategy_name || 'strategy'

            console.log(`✅ Expired ${strategyName}: ${expiredTrades.length} legs, P&L: $${totalPL.toFixed(2)}`)
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: `Expired ${strategyName}: ${expiredTrades.length} legs. Total P&L: $${totalPL.toFixed(2)}`
            })
          } catch (error) {
            console.error('❌ Failed to expire strategy group:', error)
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: `Failed to expire strategy group: ${error}`,
              is_error: true
            })
          }
        }

        if (block.name === 'close_trades') {
          try {
            const input = block.input as any
            const closedTrades = []

            for (const tradeInfo of input.trades) {
              const trade = await TradingService.closeTrade(
                tradeInfo.trade_id,
                tradeInfo.closing_premium,
                input.closing_date
              )
              closedTrades.push(trade)
            }

            const totalPL = closedTrades.reduce((sum, t) => sum + (t.realized_pl || 0), 0)

            console.log(`✅ Closed ${closedTrades.length} trades for total P&L: $${totalPL.toFixed(2)}`)
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: `Closed ${closedTrades.length} trades. Total P&L: $${totalPL.toFixed(2)}`
            })
          } catch (error) {
            console.error('❌ Failed to close trades:', error)
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: `Failed to close trades: ${error}`,
              is_error: true
            })
          }
        }
      }
    }

    // If there were tool calls, send results back to Claude for final response
    if (toolResults.length > 0) {
      fullMessages.push({
        role: 'assistant',
        content: response.content
      })
      fullMessages.push({
        role: 'user',
        content: toolResults
      })

      finalResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        system: TRADING_SYSTEM_PROMPT + '\n\n' + contextPrompt,
        messages: fullMessages,
        tools: tools,
      })
    }

    const assistantMessage = finalResponse.content
      .filter(block => block.type === 'text')
      .map(block => block.type === 'text' ? block.text : '')
      .join('\n')

    // Save both user and assistant messages to database
    const lastUserMessage = messages[messages.length - 1]
    if (lastUserMessage.role === 'user') {
      await TradingService.saveChatMessage({
        session_id: sessionId,
        user_id: userId,
        role: 'user',
        content: lastUserMessage.content
      })
    }

    await TradingService.saveChatMessage({
      session_id: sessionId,
      user_id: userId,
      role: 'assistant',
      content: assistantMessage
    })

    return NextResponse.json({
      message: assistantMessage,
      role: 'assistant',
      streak: consecutiveWeeks
    })

  } catch (error) {
    console.error('Trading chat error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}

// Calculate consecutive weeks of trading
function calculateConsecutiveWeeks(sessions: any[]): number {
  if (sessions.length === 0) return 0

  // Sort by date descending
  const sorted = sessions.sort((a, b) =>
    new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
  )

  let streak = 0
  let lastDate = new Date(sorted[0].session_date)

  for (const session of sorted) {
    const sessionDate = new Date(session.session_date)
    const daysDiff = Math.floor((lastDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24))

    // If within 7-10 days (allowing for Monday placement), count it
    if (daysDiff <= 10) {
      streak++
      lastDate = sessionDate
    } else {
      break
    }
  }

  return streak
}
