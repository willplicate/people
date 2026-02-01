import { Contact } from '@/types/database'
import { SpreadsheetItem, StatusColor } from '@/types/unified'
import { formatDistanceToNow, differenceInDays, parseISO, setYear, addYears, isBefore } from 'date-fns'

/**
 * Get the next birthday date for a contact
 */
function getNextBirthday(birthdayStr: string): Date {
  // Handle MM-DD format (e.g., "02-09")
  const today = new Date()
  let birthday: Date

  if (birthdayStr.includes('T') || birthdayStr.length > 10) {
    // Full ISO format
    birthday = parseISO(birthdayStr)
  } else if (birthdayStr.length === 5 || birthdayStr.length === 4) {
    // MM-DD format (e.g., "02-09" or "2-9")
    const [month, day] = birthdayStr.split('-').map(Number)
    birthday = new Date(today.getFullYear(), month - 1, day)
  } else {
    // YYYY-MM-DD format
    birthday = parseISO(birthdayStr)
  }

  const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate())

  // If birthday already passed this year, get next year's
  if (isBefore(thisYearBirthday, today)) {
    return new Date(today.getFullYear() + 1, birthday.getMonth(), birthday.getDate())
  }

  return thisYearBirthday
}

/**
 * Determine status color based on days until birthday
 */
function birthdayStatusColor(daysUntil: number): StatusColor {
  if (daysUntil === 0) return 'red'       // Today
  if (daysUntil <= 7) return 'orange'     // This week
  if (daysUntil <= 30) return 'yellow'    // This month
  return 'blue'                            // Later
}

/**
 * Format birthday status label
 */
function formatBirthdayStatus(daysUntil: number): string {
  if (daysUntil === 0) return 'Today!'
  if (daysUntil === 1) return 'Tomorrow'
  if (daysUntil <= 7) return 'This Week'
  if (daysUntil <= 30) return 'This Month'
  return 'Upcoming'
}

/**
 * Format birthday activity text
 */
function formatBirthdayActivity(daysUntil: number, nextBirthday: Date): string {
  if (daysUntil === 0) return 'Birthday is today!'
  if (daysUntil === 1) return 'Birthday tomorrow'
  return `Birthday in ${daysUntil} days`
}

/**
 * Transform Contact with birthday to SpreadsheetItem
 */
export function birthdayToSpreadsheetItem(contact: Contact): SpreadsheetItem | null {
  if (!contact.birthday) return null

  const nextBirthday = getNextBirthday(contact.birthday)
  const daysUntil = differenceInDays(nextBirthday, new Date())

  return {
    id: `birthday-${contact.id}`,
    name: `${contact.first_name} ${contact.last_name}`,
    type: 'birthday',
    isFavorite: contact.is_emergency || false,
    status: {
      label: formatBirthdayStatus(daysUntil),
      color: birthdayStatusColor(daysUntil),
    },
    activity: formatBirthdayActivity(daysUntil, nextBirthday),
    dueDate: nextBirthday,
    metadata: contact,
  }
}

/**
 * Transform contacts with birthdays to spreadsheet items
 * @param contacts - Contacts to check for birthdays
 * @param maxDays - Only include birthdays within this many days (default: 10)
 */
export function birthdaysToSpreadsheetItems(contacts: Contact[], maxDays: number = 10): SpreadsheetItem[] {
  return contacts
    .map(birthdayToSpreadsheetItem)
    .filter((item): item is SpreadsheetItem => {
      if (!item) return false

      // Calculate days until birthday
      const daysUntil = differenceInDays(item.dueDate!, new Date())
      return daysUntil >= 0 && daysUntil <= maxDays
    })
}
