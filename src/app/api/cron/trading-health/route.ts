import { NextResponse } from 'next/server'
import { TelegramUserService } from '@/services/TelegramUserService'
import { getTelegramService } from '@/services/TelegramService'
import { TradingService } from '@/services/TradingService'
import { formatTradingHealth, calculateDTE, getPositionUrgency } from '@/lib/telegram/notifications'

export async function GET() {
  try {
    const users = await TelegramUserService.getActiveUsers()
    const telegramService = getTelegramService()

    const results = await Promise.allSettled(
      users.map(async (user) => {
        // Get all open trades
        const allTrades = await TradingService.getAllTrades(user.user_id)
        const openTrades = allTrades.filter(trade => trade.status === 'OPEN')

        // Calculate DTE and categorize by urgency
        const tradesWithHealth = openTrades.map(trade => ({
          ...trade,
          dte: calculateDTE(trade.expiration_date),
          urgency: getPositionUrgency(calculateDTE(trade.expiration_date))
        }))

        // Filter for positions needing attention (DTE < 60)
        const positionsNeedingAttention = tradesWithHealth.filter(
          trade => trade.urgency !== 'OK'
        )

        // Skip if all positions healthy
        if (positionsNeedingAttention.length === 0) {
          return
        }

        // Format and send
        const message = formatTradingHealth(positionsNeedingAttention)
        await telegramService.sendMessage(user.telegram_chat_id, message, {
          parse_mode: 'Markdown'
        })
      })
    )

    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return NextResponse.json({ success: true, sent: successful, failed })
  } catch (error) {
    console.error('[Cron] Trading health error:', error)
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
  }
}
