import { escapeMarkdown } from './validation'

/**
 * Format a list of items with bullet points
 */
export function formatList(items: string[]): string {
  return items.map(item => `• ${item}`).join('\n')
}

/**
 * Format a date string to a more readable format
 * Input: "2025-01-27" or ISO string
 * Output: "Jan 27, 2025"
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  } catch {
    return dateString
  }
}

/**
 * Format currency values
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

/**
 * Format a contact reminder message
 */
export function formatContactReminder(contact: {
  first_name: string
  last_name?: string
  communication_frequency?: string
  last_contacted_at?: string
}): string {
  const name = [contact.first_name, contact.last_name].filter(Boolean).join(' ')
  const frequency = contact.communication_frequency || 'regularly'
  const lastContact = contact.last_contacted_at
    ? formatDate(contact.last_contacted_at)
    : 'unknown'

  return `*${escapeMarkdown(name)}*\n` +
         `Frequency: ${escapeMarkdown(frequency)}\n` +
         `Last contact: ${escapeMarkdown(lastContact)}`
}

/**
 * Format a birthday reminder message
 */
export function formatBirthdayReminder(contact: {
  first_name: string
  last_name?: string
  birthday?: string
}, daysUntil: number): string {
  const name = [contact.first_name, contact.last_name].filter(Boolean).join(' ')
  const daysText = daysUntil === 0
    ? 'Today!'
    : daysUntil === 1
      ? 'Tomorrow'
      : `In ${daysUntil} days`

  return `🎂 *${escapeMarkdown(name)}*\n${escapeMarkdown(daysText)}`
}

/**
 * Format a trading position summary
 */
export function formatPosition(position: {
  ticker_symbol: string
  option_type: string
  strike_price: number
  expiration_date: string
  number_of_contracts: number
  premium_per_contract: number
  status: string
}): string {
  const pl = position.number_of_contracts * position.premium_per_contract * 100
  const plText = pl >= 0 ? `+${formatCurrency(pl)}` : formatCurrency(pl)

  return `*${escapeMarkdown(position.ticker_symbol)}* ${position.option_type} $${position.strike_price}\n` +
         `Exp: ${formatDate(position.expiration_date)}\n` +
         `${position.number_of_contracts} contracts @ $${position.premium_per_contract}\n` +
         `Status: ${escapeMarkdown(position.status)} | P&L: ${escapeMarkdown(plText)}`
}

/**
 * Format a habit summary
 */
export function formatHabit(habit: {
  name: string
  frequency: string
  current_streak: number
}, completedToday: boolean): string {
  const emoji = completedToday ? '✅' : '⬜'
  const streakEmoji = habit.current_streak >= 7 ? '🔥' : ''

  return `${emoji} *${escapeMarkdown(habit.name)}* ${streakEmoji}\n` +
         `Frequency: ${escapeMarkdown(habit.frequency)} | Streak: ${habit.current_streak} days`
}

/**
 * Format help text for commands
 */
export function formatHelpText(): string {
  return `*Available Commands:*

*CRM & Contacts*
/birthdays \\[days\\] \\- Show upcoming birthdays
/contacts \\- Contacts needing outreach
/reminders \\- Pending reminders
/log \\{name\\} \\- Log an interaction

*Trading*
/positions \\- Show active LEAPS positions
/pl \\[period\\] \\- Profit/loss summary
/health \\- Position health check
/add\\_trade \\- Add a new trade

*Habits*
/habits \\- Today's habits status
/log\\_habit \\{name\\} \\- Log habit completion
/habit\\_stats \\- Habit statistics

*General*
/help \\- Show this help message
/settings \\- Notification preferences

*AI Chat*
Just send me a message and I'll chat with you using Claude\\!`
}

/**
 * Format error message for users
 */
export function formatError(message: string): string {
  return `❌ *Error:* ${escapeMarkdown(message)}`
}

/**
 * Format success message
 */
export function formatSuccess(message: string): string {
  return `✅ ${escapeMarkdown(message)}`
}

/**
 * Truncate text to a maximum length
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}
