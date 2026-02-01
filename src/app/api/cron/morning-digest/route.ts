import { NextResponse } from 'next/server'
import { TelegramUserService } from '@/services/TelegramUserService'
import { getTelegramService } from '@/services/TelegramService'
import { ContactService } from '@/services/ContactService'
import { formatMorningDigest } from '@/lib/telegram/notifications'

export async function GET() {
  try {
    const users = await TelegramUserService.getActiveUsers()
    const telegramService = getTelegramService()

    const results = await Promise.allSettled(
      users.map(async (user) => {
        // Get data
        const upcomingBirthdays = await ContactService.getUpcomingBirthdays(1)
        const contactsNeedingOutreach = await ContactService.getContactsNeedingReminders()

        // Filter for today's birthdays only (MM-DD match)
        const today = new Date()
        const todayMMDD = String(today.getMonth() + 1).padStart(2, '0') + '-' +
                          String(today.getDate()).padStart(2, '0')
        const todayBirthdays = upcomingBirthdays.filter(contact => {
          if (!contact.birthday) return false
          // Birthday is stored as MM-DD format
          return contact.birthday === todayMMDD
        })

        // Skip if no data to send
        if (todayBirthdays.length === 0 && contactsNeedingOutreach.length === 0) {
          return
        }

        // Format and send
        const message = formatMorningDigest(todayBirthdays, contactsNeedingOutreach)
        await telegramService.sendMessage(user.telegram_chat_id, message, {
          parse_mode: 'Markdown'
        })
      })
    )

    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return NextResponse.json({ success: true, sent: successful, failed })
  } catch (error) {
    console.error('[Cron] Morning digest error:', error)
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
  }
}
