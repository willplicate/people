import { NextResponse } from 'next/server'
import { TelegramUserService } from '@/services/TelegramUserService'
import { getTelegramService } from '@/services/TelegramService'
import { GmailService } from '@/services/GmailService'
import { EmailFilteringService } from '@/services/EmailFilteringService'
import { supabase } from '@/lib/supabase'
import { escapeMarkdown } from '@/lib/telegram/validation'

/**
 * Email Monitor Cron Job
 * Runs every 30 minutes to check for important emails
 *
 * Strategy:
 * 1. Get unread emails from Gmail
 * 2. Filter out emails we've already processed
 * 3. Use hybrid filtering (rules + AI) to classify
 * 4. Send Telegram notification for important ones
 * 5. Log processed emails to prevent duplicates
 */
export async function GET() {
  try {
    const users = await TelegramUserService.getActiveUsers()
    const telegramService = getTelegramService()

    const results = await Promise.allSettled(
      users.map(async (user) => {
        // Check if user has Gmail connected
        const isConnected = await GmailService.isConnected(user.user_id)
        if (!isConnected) {
          console.log(`[EmailMonitor] User ${user.user_id} - Gmail not connected`)
          return { user: user.user_id, status: 'skipped', reason: 'Gmail not connected' }
        }

        // Check if email monitoring is enabled
        const { data: settings } = await supabase
          .from('user_settings')
          .select('email_monitoring_enabled')
          .eq('user_id', user.user_id)
          .single()

        if (!settings?.email_monitoring_enabled) {
          console.log(`[EmailMonitor] User ${user.user_id} - Monitoring disabled`)
          return { user: user.user_id, status: 'skipped', reason: 'Monitoring disabled' }
        }

        // Get unread emails
        let unreadEmails
        try {
          unreadEmails = await GmailService.getUnreadEmails(user.user_id, 50)
        } catch (error) {
          console.error(`[EmailMonitor] User ${user.user_id} - Error fetching emails:`, error)
          return { user: user.user_id, status: 'error', reason: 'Failed to fetch emails' }
        }

        if (unreadEmails.length === 0) {
          console.log(`[EmailMonitor] User ${user.user_id} - No unread emails`)
          return { user: user.user_id, status: 'success', processed: 0 }
        }

        // Filter out emails we've already processed
        const { data: processedEmails } = await supabase
          .from('email_log')
          .select('message_id')
          .eq('user_id', user.user_id)
          .in('message_id', unreadEmails.map(e => e.id))

        const processedIds = new Set(processedEmails?.map(e => e.message_id) || [])
        const newEmails = unreadEmails.filter(e => !processedIds.has(e.id))

        if (newEmails.length === 0) {
          console.log(`[EmailMonitor] User ${user.user_id} - No new emails to process`)
          return { user: user.user_id, status: 'success', processed: 0 }
        }

        console.log(`[EmailMonitor] User ${user.user_id} - Processing ${newEmails.length} new emails`)

        // Classify emails using hybrid approach
        const classifications = await EmailFilteringService.classifyEmails(
          newEmails.map(e => ({
            id: e.id,
            from: e.from,
            subject: e.subject,
            snippet: e.snippet,
          })),
          user.user_id
        )

        // Log all emails to database
        const emailLogs = newEmails.map((email, idx) => {
          const classification = classifications.find(c => c.id === email.id)
          return {
            user_id: user.user_id,
            message_id: email.id,
            thread_id: email.threadId,
            from_address: email.from,
            subject: email.subject,
            snippet: email.snippet,
            received_at: email.date || new Date().toISOString(),
            is_important: classification?.isImportant || false,
            classification_reason: classification?.reason || 'Unknown',
            classification_method: classification?.method || 'unknown',
          }
        })

        await supabase.from('email_log').insert(emailLogs)

        // Send Telegram notifications for important emails
        const importantEmails = newEmails.filter((email) => {
          const classification = classifications.find(c => c.id === email.id)
          return classification?.isImportant
        })

        if (importantEmails.length > 0) {
          // Group by sender if more than 3 from same person
          let message = '📧 *Important Email Alert*\n\n'

          if (importantEmails.length <= 5) {
            // Show individual emails
            importantEmails.forEach((email, idx) => {
              const classification = classifications.find(c => c.id === email.id)
              const fromMatch = email.from.match(/<(.+?)>/) || [null, email.from]
              const senderEmail = fromMatch[1]?.trim() || email.from

              message += `*${idx + 1}\\. ${escapeMarkdown(email.subject)}*\n`
              message += `From: ${escapeMarkdown(senderEmail)}\n`
              message += `${escapeMarkdown(email.snippet.slice(0, 100))}\\.\\.\\.\n`
              message += `_${escapeMarkdown(classification?.reason || '')}_\n\n`
            })
          } else {
            // Summarize if too many
            message += `You have ${importantEmails.length} important unread emails:\n\n`
            importantEmails.slice(0, 3).forEach((email, idx) => {
              const fromMatch = email.from.match(/<(.+?)>/) || [null, email.from]
              const senderEmail = fromMatch[1]?.trim() || email.from
              message += `• ${escapeMarkdown(email.subject)} \\(${escapeMarkdown(senderEmail)}\\)\n`
            })
            if (importantEmails.length > 3) {
              message += `\\.\\.\\. and ${importantEmails.length - 3} more\n\n`
            }
          }

          message += `Use /email to check your inbox`

          await telegramService.sendMessage(user.telegram_chat_id, message, {
            parse_mode: 'Markdown',
          })

          // Update notified_at timestamp
          await supabase
            .from('email_log')
            .update({ notified_at: new Date().toISOString() })
            .in('message_id', importantEmails.map(e => e.id))
            .eq('user_id', user.user_id)

          console.log(`[EmailMonitor] User ${user.user_id} - Sent notification for ${importantEmails.length} important emails`)
        }

        return {
          user: user.user_id,
          status: 'success',
          processed: newEmails.length,
          important: importantEmails.length,
        }
      })
    )

    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return NextResponse.json({
      success: true,
      processed: successful,
      failed,
      results: results.map(r => r.status === 'fulfilled' ? r.value : { status: 'rejected' }),
    })
  } catch (error) {
    console.error('[Cron] Email monitor error:', error)
    return NextResponse.json(
      { error: 'Email monitoring failed' },
      { status: 500 }
    )
  }
}
