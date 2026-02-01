import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { TelegramUserService } from '@/services/TelegramUserService'
import { getTelegramService } from '@/services/TelegramService'
import { supabase } from '@/lib/supabase'
import { escapeMarkdown } from '@/lib/telegram/validation'

/**
 * Weekly Reflection Cron Job
 * Runs every Sunday at 8 PM to analyze usage patterns and suggest improvements
 *
 * This implements the "self-improvement" aspect similar to OpenClaw/Moltbot
 */
export async function GET() {
  try {
    const users = await TelegramUserService.getActiveUsers()
    const telegramService = getTelegramService()
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const results = await Promise.allSettled(
      users.map(async (user) => {
        // Get last week's activity
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

        // Fetch message history
        const { data: messages } = await supabase
          .from('telegram_messages')
          .select('*')
          .eq('telegram_user_id', user.id)
          .gte('created_at', oneWeekAgo.toISOString())
          .order('created_at', { ascending: true })

        if (!messages || messages.length === 0) {
          console.log(`[WeeklyReflection] User ${user.user_id} - No activity this week`)
          return { user: user.user_id, status: 'skipped', reason: 'No activity' }
        }

        // Analyze patterns with AI
        const analysisPrompt = `You are James, an AI assistant analyzing your own usage patterns to become more helpful.

Analyze this week's conversation history and identify:
1. **Frequent requests** - What does the user ask about most?
2. **Pain points** - Where do they seem frustrated or repeat requests?
3. **Missing capabilities** - What did they ask for that you couldn't do?
4. **Improvement opportunities** - What new features, commands, or automations would help?

Conversation history (${messages.length} messages from last 7 days):
${messages
  .map((m) => `[${m.direction === 'inbound' ? 'USER' : 'JAMES'}] ${m.message_text}`)
  .slice(-50)
  .join('\n')}

Provide 2-3 concrete, actionable suggestions in this format:
1. **[Feature Name]**: Brief description of why it would help
2. **[Feature Name]**: Brief description of why it would help

Keep it concise and focused on high-impact improvements. Be specific about what you'd add (e.g., "Add /spy_price command" not "better stock tracking").`

        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: analysisPrompt,
            },
          ],
        })

        const textContent = response.content.find(
          (block) => block.type === 'text'
        ) as Anthropic.TextBlock | undefined

        const suggestions = textContent?.text || 'No suggestions this week.'

        // Format message for Telegram
        let message = '💡 *Weekly Reflection*\n\n'
        message += `I analyzed our ${messages.length} conversations this week and have some ideas to make myself more useful:\n\n`
        message += escapeMarkdown(suggestions)
        message += '\n\n_Let me know if any of these would be helpful\\! I can implement them or we can discuss other improvements\\._'

        // Send to user
        await telegramService.sendMessage(user.telegram_chat_id, message, {
          parse_mode: 'Markdown',
        })

        console.log(`[WeeklyReflection] User ${user.user_id} - Sent reflection with suggestions`)

        return {
          user: user.user_id,
          status: 'success',
          messagesAnalyzed: messages.length,
        }
      })
    )

    const successful = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length

    return NextResponse.json({
      success: true,
      sent: successful,
      failed,
    })
  } catch (error) {
    console.error('[Cron] Weekly reflection error:', error)
    return NextResponse.json(
      { error: 'Weekly reflection failed' },
      { status: 500 }
    )
  }
}
