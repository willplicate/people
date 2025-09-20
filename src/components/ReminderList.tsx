'use client'

import { useState, useEffect } from 'react'
import { Reminder } from '@/types/database'

interface ReminderListProps {
  className?: string
  limit?: number
  showDismissed?: boolean
}

export default function ReminderList({ className = '', limit, showDismissed = false }: ReminderListProps) {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchReminders()
  }, [showDismissed])

  const fetchReminders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (!showDismissed) {
        params.append('status', 'pending')
        params.append('status', 'sent')
      }

      const response = await fetch(`/api/reminders?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch reminders')
      }

      const data = await response.json()
      let reminderList = data.reminders || []

      if (limit) {
        reminderList = reminderList.slice(0, limit)
      }

      setReminders(reminderList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reminders')
    } finally {
      setLoading(false)
    }
  }

  const dismissReminder = async (reminderId: string) => {
    try {
      const response = await fetch(`/api/reminders/${reminderId}/dismiss`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to dismiss reminder')
      }

      // Update the reminder status locally
      setReminders(prev =>
        prev.map(reminder =>
          reminder.id === reminderId
            ? { ...reminder, status: 'dismissed' as const }
            : reminder
        ).filter(reminder => showDismissed || reminder.status !== 'dismissed')
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dismiss reminder')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return 'Today'
    } else if (diffDays === 1) {
      return 'Tomorrow'
    } else if (diffDays === -1) {
      return 'Yesterday'
    } else if (diffDays > 1) {
      return `In ${diffDays} days`
    } else {
      return `${Math.abs(diffDays)} days ago`
    }
  }

  const getReminderTypeColor = (type: string) => {
    switch (type) {
      case 'birthday_day':
        return 'bg-purple-100 text-purple-800'
      case 'birthday_week':
        return 'bg-blue-100 text-blue-800'
      case 'communication':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getReminderTypeLabel = (type: string) => {
    switch (type) {
      case 'birthday_day':
        return 'Birthday Today'
      case 'birthday_week':
        return 'Birthday Soon'
      case 'communication':
        return 'Stay in Touch'
      default:
        return type
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'sent':
        return 'bg-blue-100 text-blue-800'
      case 'dismissed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const isPastDue = (scheduledFor: string) => {
    return new Date(scheduledFor) < new Date()
  }

  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-200 h-16 rounded-lg"></div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className={`text-red-600 p-4 bg-red-50 rounded-lg ${className}`}>
        Error: {error}
      </div>
    )
  }

  if (reminders.length === 0) {
    return (
      <div className={`text-gray-500 text-center py-8 ${className}`}>
        {showDismissed ? 'No dismissed reminders' : 'No active reminders'}
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {reminders.map((reminder) => (
        <div
          key={reminder.id}
          className={`p-4 rounded-lg border transition-colors ${
            isPastDue(reminder.scheduled_for) && reminder.status === 'pending'
              ? 'border-red-200 bg-red-50'
              : 'border-gray-200 bg-white'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getReminderTypeColor(reminder.type)}`}>
                  {getReminderTypeLabel(reminder.type)}
                </span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reminder.status)}`}>
                  {reminder.status}
                </span>
                {isPastDue(reminder.scheduled_for) && reminder.status === 'pending' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Overdue
                  </span>
                )}
              </div>

              <p className="text-gray-900 font-medium mb-1">{reminder.message}</p>

              <div className="text-sm text-gray-600">
                <span>{formatDate(reminder.scheduled_for)}</span>
                {reminder.sent_at && (
                  <span className="ml-2">
                    • Sent: {new Date(reminder.sent_at).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {reminder.status !== 'dismissed' && (
              <div className="ml-4">
                <button
                  onClick={() => dismissReminder(reminder.id)}
                  className="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}