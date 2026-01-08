import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { LifeCoachService } from '@/services/LifeCoachService'
import { supabase } from '@/lib/supabase'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

// Load context from Supabase
async function getContext() {
  const { data, error } = await supabase
    .from('life_coach_context')
    .select('*')

  if (error) {
    console.error('Error loading context:', error)
    return { LIFE_COACH_FRAMEWORK: '', LIFE_NOW: '', TRADING_RULES: '' }
  }

  const context: Record<string, string> = {}
  data?.forEach(row => {
    context[row.key] = row.content
  })

  return {
    LIFE_COACH_FRAMEWORK: context.LIFE_COACH_FRAMEWORK || '',
    LIFE_NOW: context.LIFE_NOW || '',
    TRADING_RULES: context.TRADING_RULES || ''
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message, userId, contextType } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'message string is required' },
        { status: 400 }
      )
    }

    // Get today's date
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0] // YYYY-MM-DD format

    // Get today's chat history for context
    const todayMessages = await LifeCoachService.getChatMessagesByDate(userId, todayStr)

    // Get habit stats for last 7 days
    const habitStats = await getHabitStats(userId)

    // Load context from Supabase
    const { LIFE_COACH_FRAMEWORK, LIFE_NOW, TRADING_RULES } = await getContext()

    // Build system prompt with full context
    const systemPrompt = `You are William's life coach. Read his framework carefully and coach him based on these specific patterns and guidelines.

${LIFE_COACH_FRAMEWORK}

---

CURRENT STATE:
--------------
${LIFE_NOW}

---

TRADING RULES:
--------------
${TRADING_RULES}

---

HABIT STATS (Last 7 Days):
--------------------------
${habitStats}

---

TODAY'S DATE: ${todayStr}

Remember: This is NOT just habit tracking. Your role is to coach William on deep mindset patterns - imposter syndrome, catastrophizing, rumination, trading discipline, and the Starter's Curse. Use the specific coaching styles described in the framework for each pattern type.

When William shares struggles, anxieties, or decisions, reference the patterns in the framework, recent context from LIFE_NOW, and his trading rules. Be his right-hand man - question his decisions, point out flaws in logic, and give honest analysis.

CRITICAL RESPONSE LENGTH RULE: You MUST keep responses to 4-5 sentences MAXIMUM. No exceptions unless William explicitly asks for more detail. If you have more to say, pick the most important points only. Be ruthlessly concise - one paragraph max.`

    // Build conversation messages
    const conversationMessages: Anthropic.MessageParam[] = []

    // Add today's chat history for context
    if (todayMessages.length > 0) {
      for (const msg of todayMessages) {
        conversationMessages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })
      }
    }

    // Add the new user message
    conversationMessages.push({
      role: 'user',
      content: message
    })

    // Save user message to database
    await LifeCoachService.saveChatMessage({
      user_id: userId,
      message_date: todayStr,
      timestamp: new Date().toISOString(),
      role: 'user',
      content: message,
      context_type: contextType || null
    })

    // Stream Claude API response
    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: systemPrompt,
      messages: conversationMessages,
    })

    // Create a ReadableStream for SSE
    const encoder = new TextEncoder()
    let fullResponse = ''

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              const text = chunk.delta.text
              fullResponse += text

              // Send as Server-Sent Event
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
            }
          }

          // Save complete assistant message to database
          await LifeCoachService.saveChatMessage({
            user_id: userId,
            message_date: todayStr,
            timestamp: new Date().toISOString(),
            role: 'assistant',
            content: fullResponse,
            context_type: contextType || null
          })

          // Send done signal
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      }
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Life coach chat error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}

/**
 * Get habit completion stats for the last 7 days
 */
async function getHabitStats(userId: string): Promise<string> {
  try {
    const habits = await LifeCoachService.getHabitsByUserId(userId)

    if (habits.length === 0) {
      return 'No habits tracked yet.'
    }

    const today = new Date()
    const last7Days = new Date(today)
    last7Days.setDate(last7Days.getDate() - 7)

    const stats: string[] = []

    for (const habit of habits) {
      const logs = await LifeCoachService.getHabitLogs(
        habit.id,
        last7Days.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      )

      const completed = logs.filter(log => log.completed).length
      const total = logs.length
      const streak = habit.current_streak

      let frequencyDisplay = ''
      if (habit.frequency === 'daily') {
        frequencyDisplay = `(${completed}/${total} days)`
      } else if (habit.frequency === 'weekly') {
        frequencyDisplay = `(${completed}/1 this week)`
      } else if (habit.frequency === 'monthly') {
        frequencyDisplay = `(${completed} this month)`
      }

      const streakDisplay = streak > 0 ? ` - ${streak} day streak 🔥` : ''

      stats.push(`${habit.name}: ${frequencyDisplay}${streakDisplay}`)
    }

    return stats.join('\n')
  } catch (error) {
    console.error('Failed to get habit stats:', error)
    return 'Error loading habit stats.'
  }
}
