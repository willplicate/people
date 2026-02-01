import { NextResponse } from 'next/server'
import { TelegramUserService } from '@/services/TelegramUserService'
import { getTelegramService } from '@/services/TelegramService'
import { LifeCoachService } from '@/services/LifeCoachService'
import { formatEveningHabits } from '@/lib/telegram/notifications'

export async function GET() {
  try {
    const users = await TelegramUserService.getActiveUsers()
    const telegramService = getTelegramService()

    const results = await Promise.allSettled(
      users.map(async (user) => {
        // Get habits and today's logs
        const habits = await LifeCoachService.getHabitsByUserId(user.user_id)
        const todayLogs = await LifeCoachService.getTodayHabitLogs(user.user_id)

        // Find incomplete habits
        const incompleteHabits = habits
          .filter(habit => {
            const todayLog = todayLogs.find(log => log.habit_id === habit.id)
            return !todayLog?.completed
          })
          .map(habit => ({
            ...habit,
            todayLog: todayLogs.find(log => log.habit_id === habit.id)
          }))

        // Skip if all complete or no habits
        if (incompleteHabits.length === 0) {
          return
        }

        // Format and send
        const message = formatEveningHabits(incompleteHabits)
        await telegramService.sendMessage(user.telegram_chat_id, message, {
          parse_mode: 'Markdown'
        })
      })
    )

    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return NextResponse.json({ success: true, sent: successful, failed })
  } catch (error) {
    console.error('[Cron] Evening habits error:', error)
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
  }
}
