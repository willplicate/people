import { NextRequest, NextResponse } from 'next/server'
import { TelegramUserService } from '@/services/TelegramUserService'
import { ContactService } from '@/services/ContactService'
import { LifeCoachService } from '@/services/LifeCoachService'
import { TradingService } from '@/services/TradingService'
import {
  formatMorningDigest,
  formatEveningHabits,
  formatTradingHealth,
  calculateDTE,
  getPositionUrgency
} from '@/lib/telegram/notifications'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') // 'morning' | 'evening' | 'trading'

    if (!type) {
      return NextResponse.json(
        { error: 'Missing type parameter. Use ?type=morning|evening|trading' },
        { status: 400 }
      )
    }

    // Get the first active user for testing
    const users = await TelegramUserService.getActiveUsers()
    if (users.length === 0) {
      return NextResponse.json(
        { error: 'No active users found' },
        { status: 404 }
      )
    }

    const user = users[0]
    let message = ''
    let shouldSend = false

    switch (type) {
      case 'morning': {
        const upcomingBirthdays = await ContactService.getUpcomingBirthdays(1)
        const contactsNeedingOutreach = await ContactService.getContactsNeedingReminders()

        // Filter for today's birthdays
        const today = new Date()
        const todayMMDD = String(today.getMonth() + 1).padStart(2, '0') + '-' +
                          String(today.getDate()).padStart(2, '0')
        const todayBirthdays = upcomingBirthdays.filter(contact => {
          if (!contact.birthday) return false
          // Birthday is stored as MM-DD format
          return contact.birthday === todayMMDD
        })

        shouldSend = todayBirthdays.length > 0 || contactsNeedingOutreach.length > 0
        message = formatMorningDigest(todayBirthdays, contactsNeedingOutreach)
        break
      }

      case 'evening': {
        const habits = await LifeCoachService.getHabitsByUserId(user.user_id)
        const todayLogs = await LifeCoachService.getTodayHabitLogs(user.user_id)

        const incompleteHabits = habits
          .filter(habit => {
            const todayLog = todayLogs.find(log => log.habit_id === habit.id)
            return !todayLog?.completed
          })
          .map(habit => ({
            ...habit,
            todayLog: todayLogs.find(log => log.habit_id === habit.id)
          }))

        shouldSend = incompleteHabits.length > 0
        message = shouldSend ? formatEveningHabits(incompleteHabits) : 'All habits completed!'
        break
      }

      case 'trading': {
        const allTrades = await TradingService.getAllTrades(user.user_id)
        const openTrades = allTrades.filter(trade => trade.status === 'OPEN')

        const tradesWithHealth = openTrades.map(trade => ({
          ...trade,
          dte: calculateDTE(trade.expiration_date),
          urgency: getPositionUrgency(calculateDTE(trade.expiration_date))
        }))

        const positionsNeedingAttention = tradesWithHealth.filter(
          trade => trade.urgency !== 'OK'
        )

        shouldSend = positionsNeedingAttention.length > 0
        message = shouldSend ? formatTradingHealth(positionsNeedingAttention) : 'All positions healthy!'
        break
      }

      default:
        return NextResponse.json(
          { error: 'Invalid type. Use: morning, evening, or trading' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      type,
      userId: user.user_id,
      chatId: user.telegram_chat_id,
      shouldSend,
      message,
      note: 'This is a preview. Use /api/cron/<type> to actually send the notification.'
    })
  } catch (error) {
    console.error('[Test] Notification preview error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
