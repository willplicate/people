import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { LifeCoachService } from '@/services/LifeCoachService'
import { readFileSync } from 'fs'
import { join } from 'path'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

// Load the life coach context files
const LIFE_COACH_FRAMEWORK = readFileSync(join(process.cwd(), 'LIFE_COACH.md'), 'utf-8')
const LIFE_NOW = readFileSync(join(process.cwd(), 'LIFE_NOW.md'), 'utf-8')

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

    // Build system prompt with full context
    const systemPrompt = `You are William's life coach. Read his framework carefully and coach him based on these specific patterns and guidelines.

${LIFE_COACH_FRAMEWORK}

---

CURRENT STATE:
--------------
${LIFE_NOW}

---

HABIT STATS (Last 7 Days):
--------------------------
${habitStats}

---

TODAY'S DATE: ${todayStr}

Remember: This is NOT just habit tracking. Your role is to coach William on deep mindset patterns - imposter syndrome, catastrophizing, rumination, trading discipline, and the Starter's Curse. Use the specific coaching styles described in the framework for each pattern type.

When William shares struggles, anxieties, or decisions, reference the patterns in LIFE_COACH.md and recent context from LIFE_NOW.md. Be his right-hand man - question his decisions, point out flaws in logic, and give honest analysis.`

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

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: systemPrompt,
      messages: conversationMessages,
    })

    // Extract assistant response
    const assistantMessage = response.content
      .filter(block => block.type === 'text')
      .map(block => block.type === 'text' ? block.text : '')
      .join('\n')

    // Save both messages to database
    await LifeCoachService.saveChatMessage({
      user_id: userId,
      message_date: todayStr,
      timestamp: new Date().toISOString(),
      role: 'user',
      content: message,
      context_type: contextType || null
    })

    await LifeCoachService.saveChatMessage({
      user_id: userId,
      message_date: todayStr,
      timestamp: new Date().toISOString(),
      role: 'assistant',
      content: assistantMessage,
      context_type: contextType || null
    })

    return NextResponse.json({
      role: 'assistant',
      content: assistantMessage,
      timestamp: new Date().toISOString()
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
