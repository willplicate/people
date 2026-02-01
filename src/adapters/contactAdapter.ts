import { Contact } from '@/types/database'
import { SpreadsheetItem, StatusColor } from '@/types/unified'
import { formatDistanceToNow, differenceInDays, parseISO } from 'date-fns'

/**
 * Get frequency in days
 */
function getFrequencyDays(frequency: Contact['communication_frequency']): number | null {
  const frequencyMap: Record<NonNullable<Contact['communication_frequency']>, number> = {
    weekly: 7,
    monthly: 30,
    quarterly: 90,
    biannually: 180,
    annually: 365,
  }
  return frequency ? frequencyMap[frequency] : null
}

/**
 * Map frequency to status color
 */
function frequencyToColor(frequency: Contact['communication_frequency']): StatusColor {
  const colorMap: Record<NonNullable<Contact['communication_frequency']>, StatusColor> = {
    weekly: 'green',
    monthly: 'blue',
    quarterly: 'yellow',
    biannually: 'orange',
    annually: 'purple',
  }
  return frequency ? colorMap[frequency] : 'gray'
}

/**
 * Format frequency label
 */
function formatFrequencyLabel(frequency: Contact['communication_frequency']): string {
  if (!frequency) return 'No Frequency'
  return frequency.charAt(0).toUpperCase() + frequency.slice(1)
}

/**
 * Calculate if contact needs outreach
 */
function needsOutreach(contact: Contact): boolean {
  if (!contact.communication_frequency) return false
  if (!contact.last_contacted_at) return true

  const frequencyDays = getFrequencyDays(contact.communication_frequency)
  if (!frequencyDays) return false

  const daysSinceContact = differenceInDays(
    new Date(),
    parseISO(contact.last_contacted_at)
  )

  return daysSinceContact >= frequencyDays
}

/**
 * Calculate days overdue for contact
 */
function getDaysOverdue(contact: Contact): number {
  if (!contact.communication_frequency || !contact.last_contacted_at) return 0

  const frequencyDays = getFrequencyDays(contact.communication_frequency)
  if (!frequencyDays) return 0

  const daysSinceContact = differenceInDays(
    new Date(),
    parseISO(contact.last_contacted_at)
  )

  return Math.max(0, daysSinceContact - frequencyDays)
}

/**
 * Format contact activity text
 */
function formatContactActivity(contact: Contact): string {
  if (!contact.last_contacted_at) {
    return 'Never contacted'
  }

  const daysOverdue = getDaysOverdue(contact)
  if (daysOverdue > 0) {
    return `Overdue by ${daysOverdue} days`
  }

  return `Last: ${formatDistanceToNow(parseISO(contact.last_contacted_at), { addSuffix: true })}`
}

/**
 * Get due date for contact (when next contact is due)
 */
function getContactDueDate(contact: Contact): Date | undefined {
  if (!contact.communication_frequency || !contact.last_contacted_at) return undefined

  const frequencyDays = getFrequencyDays(contact.communication_frequency)
  if (!frequencyDays) return undefined

  const lastContact = parseISO(contact.last_contacted_at)
  const dueDate = new Date(lastContact)
  dueDate.setDate(dueDate.getDate() + frequencyDays)

  return dueDate
}

/**
 * Transform Contact to SpreadsheetItem (only if needs outreach)
 */
export function contactToSpreadsheetItem(contact: Contact): SpreadsheetItem | null {
  if (!needsOutreach(contact)) return null

  const daysOverdue = getDaysOverdue(contact)

  return {
    id: `contact-${contact.id}`,
    name: `${contact.first_name} ${contact.last_name}`,
    type: 'contact',
    isFavorite: contact.is_emergency || false,
    status: {
      label: formatFrequencyLabel(contact.communication_frequency),
      color: daysOverdue > 7 ? 'red' : frequencyToColor(contact.communication_frequency),
    },
    activity: formatContactActivity(contact),
    dueDate: getContactDueDate(contact),
    metadata: contact,
  }
}

/**
 * Transform contacts needing outreach to spreadsheet items
 */
export function contactsToSpreadsheetItems(contacts: Contact[]): SpreadsheetItem[] {
  return contacts
    .map(contactToSpreadsheetItem)
    .filter((item): item is SpreadsheetItem => item !== null)
}
