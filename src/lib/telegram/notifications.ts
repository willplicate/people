import { escapeMarkdown } from './validation'
import { formatDate } from './formatting'

/**
 * Calculate days to expiration
 */
export function calculateDTE(expirationDate: string): number {
  const today = new Date()
  const expiry = new Date(expirationDate)
  const diffTime = expiry.getTime() - today.getTime()
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Determine position urgency based on DTE
 */
export function getPositionUrgency(dte: number): 'URGENT' | 'WARNING' | 'WATCH' | 'OK' {
  if (dte < 7) return 'URGENT'
  if (dte < 30) return 'WARNING'
  if (dte < 60) return 'WATCH'
  return 'OK'
}

/**
 * Format morning digest notification
 */
export function formatMorningDigest(
  birthdays: Array<{ first_name: string; last_name?: string; birthday?: string }>,
  contacts: Array<any>
): string {
  let message = '🌅 *Good Morning\\!*\n\n'

  // Birthdays section
  if (birthdays.length > 0) {
    message += '🎂 *Birthdays Today:*\n'
    birthdays.forEach(contact => {
      const name = [contact.first_name, contact.last_name].filter(Boolean).join(' ')
      message += `• ${escapeMarkdown(name)}\n`
    })
    message += '\n'
  } else {
    message += '🎂 No birthdays today\\!\n\n'
  }

  // Contacts section
  if (contacts.length > 0) {
    message += '📞 *Contacts Needing Outreach:*\n'
    const displayContacts = contacts.slice(0, 5)
    displayContacts.forEach(contact => {
      const name = [contact.first_name, contact.last_name].filter(Boolean).join(' ')
      const freq = contact.communication_frequency || 'regularly'
      const lastContact = contact.last_contacted_at
        ? formatDate(contact.last_contacted_at)
        : 'unknown'
      message += `• ${escapeMarkdown(name)} \\(${escapeMarkdown(freq)}, last: ${escapeMarkdown(lastContact)}\\)\n`
    })

    if (contacts.length > 5) {
      message += `\\.\\.\\. and ${contacts.length - 5} more\n`
    }
    message += '\nUse /contacts to see full list'
  } else {
    message += '📞 All caught up on contacts\\!'
  }

  return message
}

/**
 * Format evening habits notification
 */
export function formatEveningHabits(
  incompleteHabits: Array<{ name: string; frequency: string; current_streak: number }>
): string {
  let message = '🌙 *Evening Check\\-in*\n\n'
  message += 'Incomplete habits today:\n'

  incompleteHabits.forEach(habit => {
    const streakEmoji = habit.current_streak >= 7 ? ' 🔥' : ''
    message += `⬜ ${escapeMarkdown(habit.name)} \\(streak: ${habit.current_streak} days${streakEmoji}\\)\n`
  })

  message += '\nSend me a message to log completions'

  return message
}

/**
 * Format trading position health notification
 */
export function formatTradingHealth(
  positions: Array<{
    ticker_symbol: string
    option_type: string
    strike_price: number
    expiration_date: string
    number_of_contracts: number
    premium_per_contract: number
    dte: number
    urgency: 'URGENT' | 'WARNING' | 'WATCH'
  }>
): string {
  let message = '📊 *Trading Position Health*\n\n'

  // Group by urgency
  const urgent = positions.filter(p => p.urgency === 'URGENT')
  const warning = positions.filter(p => p.urgency === 'WARNING')
  const watch = positions.filter(p => p.urgency === 'WATCH')

  // URGENT section
  if (urgent.length > 0) {
    message += '🔴 *URGENT* \\(\\< 7 days\\):\n'
    urgent.forEach(pos => {
      message += `• ${escapeMarkdown(pos.ticker_symbol)} ${escapeMarkdown(pos.option_type)} \\$${pos.strike_price} \\(Exp: ${escapeMarkdown(formatDate(pos.expiration_date))}, DTE: ${pos.dte}\\)\n`
      message += `  ${pos.number_of_contracts} contracts @ \\$${pos.premium_per_contract}\n`
    })
    message += '\n'
  }

  // WARNING section
  if (warning.length > 0) {
    message += '🟡 *WARNING* \\(\\< 30 days\\):\n'
    warning.forEach(pos => {
      message += `• ${escapeMarkdown(pos.ticker_symbol)} ${escapeMarkdown(pos.option_type)} \\$${pos.strike_price} \\(Exp: ${escapeMarkdown(formatDate(pos.expiration_date))}, DTE: ${pos.dte}\\)\n`
      message += `  ${pos.number_of_contracts} contracts @ \\$${pos.premium_per_contract}\n`
    })
    message += '\n'
  }

  // WATCH section (only show count to avoid clutter)
  if (watch.length > 0) {
    message += `🟢 *WATCH* \\(\\< 60 days\\): ${watch.length} positions\n\n`
  }

  message += 'Send me a message for details'

  return message
}
