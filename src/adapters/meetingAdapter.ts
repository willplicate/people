import { Meeting } from '@/types/database'
import { SpreadsheetItem, StatusColor } from '@/types/unified'
import { formatDistanceToNow, isPast, isFuture, parseISO } from 'date-fns'

/**
 * Map meeting status to status pill color
 */
function meetingStatusToColor(meeting: Meeting): StatusColor {
  const startTime = parseISO(meeting.start_time)

  if (isPast(startTime)) {
    return 'gray' // Past meeting
  }

  return 'blue' // Upcoming meeting
}

/**
 * Format meeting activity text (time until meeting or time since meeting)
 */
function formatMeetingActivity(meeting: Meeting): string {
  const startTime = parseISO(meeting.start_time)
  const now = new Date()

  if (isFuture(startTime)) {
    return `Starting ${formatDistanceToNow(startTime, { addSuffix: true })}`
  }

  if (isPast(startTime)) {
    return `Held ${formatDistanceToNow(startTime, { addSuffix: true })}`
  }

  return 'Now'
}

/**
 * Format meeting status label
 */
function formatStatusLabel(meeting: Meeting): string {
  const startTime = parseISO(meeting.start_time)

  if (isPast(startTime)) {
    return 'Past'
  }

  return 'Upcoming'
}

/**
 * Transform Meeting to SpreadsheetItem
 */
export function meetingToSpreadsheetItem(meeting: Meeting): SpreadsheetItem {
  return {
    id: meeting.id,
    name: meeting.summary,
    type: 'reminder', // Using 'reminder' type for meetings in the unified view
    isFavorite: false,
    status: {
      label: formatStatusLabel(meeting),
      color: meetingStatusToColor(meeting),
    },
    activity: formatMeetingActivity(meeting),
    dueDate: parseISO(meeting.start_time),
    metadata: meeting,
  }
}

/**
 * Transform multiple meetings to spreadsheet items
 */
export function meetingsToSpreadsheetItems(meetings: Meeting[]): SpreadsheetItem[] {
  return meetings.map(meetingToSpreadsheetItem)
}
