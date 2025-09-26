'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Contact, Reminder, Interaction, PersonalTask } from '@/types/database'

interface DashboardData {
  stats: {
    totalContacts: number
    contactsWithReminders: number
    overdueReminders: number
    upcomingBirthdays: number
  }
  upcomingReminders: Reminder[]
  recentInteractions: (Interaction & { contact?: { first_name: string; last_name?: string; nickname?: string } })[]
  upcomingBirthdays: Contact[]
  overdueContacts: Contact[]
  importantTasks: {
    work: PersonalTask[]
    personal: PersonalTask[]
  }
}

export default function Dashboard() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [markingContacted, setMarkingContacted] = useState<Set<string>>(new Set())
  const [dismissingReminder, setDismissingReminder] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard')
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }
      const dashboardData = await response.json()
      setData(dashboardData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getContactDisplayName = (contact: Contact) => {
    if (contact.nickname) {
      return `${contact.first_name} "${contact.nickname}" ${contact.last_name || ''}`
    }
    return `${contact.first_name} ${contact.last_name || ''}`.trim()
  }

  const getDaysUntilBirthday = (birthday: string) => {
    const today = new Date()
    const currentYear = today.getFullYear()
    const [month, day] = birthday.split('-').map(Number)
    let birthdayThisYear = new Date(currentYear, month - 1, day)

    if (birthdayThisYear < today) {
      birthdayThisYear = new Date(currentYear + 1, month - 1, day)
    }

    const diffTime = birthdayThisYear.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleMarkAsContacted = async (contactId: string) => {
    if (markingContacted.has(contactId)) return

    setMarkingContacted(prev => new Set(prev).add(contactId))

    try {
      // Create a new interaction for today
      const response = await fetch(`/api/contacts/${contactId}/interactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'other',
          notes: 'Marked as contacted from dashboard',
          interaction_date: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to mark as contacted')
      }

      // Refresh dashboard data to update the list
      await fetchDashboardData()
    } catch (err) {
      console.error('Error marking contact as contacted:', err)
      setError('Failed to mark contact as contacted')
    } finally {
      setMarkingContacted(prev => {
        const newSet = new Set(prev)
        newSet.delete(contactId)
        return newSet
      })
    }
  }

  const handleDismissReminder = async (reminderId: string) => {
    if (dismissingReminder.has(reminderId)) return

    setDismissingReminder(prev => new Set(prev).add(reminderId))

    try {
      const response = await fetch(`/api/reminders/${reminderId}/dismiss`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to dismiss reminder')
      }

      // Small delay to ensure database update completes, then refresh
      await new Promise(resolve => setTimeout(resolve, 100))
      await fetchDashboardData()
    } catch (err) {
      console.error('Error dismissing reminder:', err)
      setError('Failed to dismiss reminder')
    } finally {
      setDismissingReminder(prev => {
        const newSet = new Set(prev)
        newSet.delete(reminderId)
        return newSet
      })
    }
  }

  const handleToggleTaskStatus = async (task: PersonalTask) => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed'

    // Optimistic update: immediately update local state
    setData(prevData => {
      if (!prevData) return prevData

      const updatedTask = {
        ...task,
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null
      }

      // Remove completed tasks from the display (they disappear immediately)
      const filterActiveTasks = (tasks: PersonalTask[]) =>
        tasks.map(t => t.id === task.id ? updatedTask : t)
               .filter(t => t.status !== 'completed')

      return {
        ...prevData,
        importantTasks: {
          work: filterActiveTasks(prevData.importantTasks?.work || []),
          personal: filterActiveTasks(prevData.importantTasks?.personal || [])
        }
      }
    })

    // Background API call (no await to avoid blocking UI)
    fetch(`/api/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : undefined
      })
    }).catch(err => {
      console.error('Error updating task:', err)
      // Rollback on error: revert the optimistic update
      setData(prevData => {
        if (!prevData) return prevData
        const revertedTask = { ...task }
        const revertTasks = (tasks: PersonalTask[]) =>
          tasks.map(t => t.id === task.id ? revertedTask : t)

        return {
          ...prevData,
          importantTasks: {
            work: task.category === 'work' ? [...(prevData.importantTasks?.work || []), revertedTask] : prevData.importantTasks?.work || [],
            personal: task.category === 'personal' ? [...(prevData.importantTasks?.personal || []), revertedTask] : prevData.importantTasks?.personal || []
          }
        }
      })
      setError('Failed to update task')
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse bg-muted h-32 rounded-lg"></div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-destructive p-4 bg-destructive/10 rounded-lg">
        Error: {error}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-muted-foreground text-center py-8">
        No dashboard data available
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-card-gap">
        <div
          onClick={() => router.push('/contacts')}
          className="bg-card p-6 rounded-card shadow-card hover:shadow-card-hover transition-shadow duration-200 cursor-pointer"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground text-lg">👥</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Total Contacts</p>
              <p className="text-metric text-foreground">{data.stats.totalContacts}</p>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-card shadow-card hover:shadow-card-hover transition-shadow duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                <span className="text-secondary-foreground text-lg">⏰</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Active Reminders</p>
              <p className="text-metric text-foreground">{data.stats.contactsWithReminders}</p>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-card shadow-card hover:shadow-card-hover transition-shadow duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-destructive rounded-full flex items-center justify-center">
                <span className="text-destructive-foreground text-lg">🚨</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Overdue</p>
              <p className="text-metric text-foreground">{data.stats.overdueReminders}</p>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-card shadow-card hover:shadow-card-hover transition-shadow duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground text-lg">🎂</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Upcoming Birthdays</p>
              <p className="text-metric text-foreground">{data.stats.upcomingBirthdays}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Split Section: Contact Reminders & Today's Important Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-card-gap">
        {/* Left: Contact Reminders */}
        <div className="bg-card p-6 rounded-card shadow-card hover:shadow-card-hover transition-shadow duration-200">
          <h2 className="text-lg font-semibold text-foreground mb-4">📞 Upcoming Contact Reminders</h2>
          {data.upcomingReminders.length === 0 ? (
            <p className="text-muted-foreground">No upcoming reminders</p>
          ) : (
            <div className="space-y-3">
              {data.upcomingReminders.slice(0, 3).map((reminder) => (
                <div key={reminder.id} className="flex items-center p-3 bg-muted rounded-card hover:bg-muted/80 transition-colors">
                  <input
                    type="checkbox"
                    className="mr-3 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    onChange={() => handleDismissReminder(reminder.id)}
                    disabled={dismissingReminder.has(reminder.id)}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-foreground text-sm">{reminder.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(reminder.scheduled_for)}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    reminder.type === 'birthday_day' ? 'bg-primary-100 text-primary-700' :
                    reminder.type === 'birthday_week' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {reminder.type.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Today's Important Tasks */}
        <div className="bg-card p-6 rounded-card shadow-card hover:shadow-card-hover transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">📋 Today&apos;s Important Tasks</h2>
            <button
              onClick={() => router.push('/tasks')}
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              View All
            </button>
          </div>

          {/* Work Tasks */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">💼 Work</h3>
            {data.importantTasks?.work?.length === 0 || !data.importantTasks?.work ? (
              <p className="text-xs text-muted-foreground mb-3">No work tasks</p>
            ) : (
              <div className="space-y-2 mb-3">
                {data.importantTasks.work.slice(0, 3).map((task) => (
                  <div key={task.id} className="flex items-center p-2 bg-blue-50 dark:bg-blue-950 rounded border border-blue-200 dark:border-blue-800">
                    <input
                      type="checkbox"
                      checked={task.status === 'completed'}
                      onChange={() => handleToggleTaskStatus(task)}
                      className="mr-3 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {task.title}
                      </p>
                      {task.due_date && (
                        <p className="text-xs text-muted-foreground">
                          Due: {formatDate(task.due_date)}
                        </p>
                      )}
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Personal Tasks */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">🏠 Personal</h3>
            {data.importantTasks?.personal?.length === 0 || !data.importantTasks?.personal ? (
              <p className="text-xs text-muted-foreground">No personal tasks</p>
            ) : (
              <div className="space-y-2">
                {data.importantTasks.personal.slice(0, 3).map((task) => (
                  <div key={task.id} className="flex items-center p-2 bg-green-50 dark:bg-green-950 rounded border border-green-200 dark:border-green-800">
                    <input
                      type="checkbox"
                      checked={task.status === 'completed'}
                      onChange={() => handleToggleTaskStatus(task)}
                      className="mr-3 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {task.title}
                      </p>
                      {task.due_date && (
                        <p className="text-xs text-muted-foreground">
                          Due: {formatDate(task.due_date)}
                        </p>
                      )}
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-card-gap">
        {/* Upcoming Birthdays */}
        <div className="bg-card p-6 rounded-card shadow-card hover:shadow-card-hover transition-shadow duration-200">
          <h2 className="text-lg font-semibold text-foreground mb-4">Upcoming Birthdays</h2>
          {data.upcomingBirthdays.length === 0 ? (
            <p className="text-muted-foreground">No upcoming birthdays</p>
          ) : (
            <div className="space-y-3">
              {data.upcomingBirthdays.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between p-3 bg-primary-50 rounded-card">
                  <div>
                    <p className="font-medium text-foreground">{getContactDisplayName(contact)}</p>
                    <p className="text-sm text-muted-foreground">Birthday: {contact.birthday}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-primary-600">
                      {getDaysUntilBirthday(contact.birthday!)} days
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Overdue Contacts */}
        <div className="bg-card p-6 rounded-card shadow-card hover:shadow-card-hover transition-shadow duration-200">
          <h2 className="text-lg font-semibold text-foreground mb-4">Overdue</h2>
          {data.overdueContacts.length === 0 ? (
            <p className="text-muted-foreground">All caught up! 🎉</p>
          ) : (
            <div className="space-y-3">
              {data.overdueContacts.slice(0, 5).map((contact) => (
                <div key={contact.id} className="flex items-center p-3 bg-destructive/5 rounded-card hover:bg-destructive/10 transition-colors">
                  <input
                    type="checkbox"
                    className="mr-3 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    onChange={() => handleMarkAsContacted(contact.id)}
                    disabled={markingContacted.has(contact.id)}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{getContactDisplayName(contact)}</p>
                    <p className="text-sm text-muted-foreground">
                      Last contacted: {contact.last_contacted_at ? formatDate(contact.last_contacted_at) : 'Never'}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-destructive">
                    {contact.communication_frequency}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Interactions - Bottom of page, less important */}
      <div className="bg-card p-6 rounded-card shadow-card hover:shadow-card-hover transition-shadow duration-200">
        <h2 className="text-lg font-semibold text-foreground mb-4">Recent Interactions</h2>
        {data.recentInteractions.length === 0 ? (
          <p className="text-muted-foreground">No recent interactions</p>
        ) : (
          <div className="space-y-3">
            {data.recentInteractions.slice(0, 10).map((interaction) => (
              <div key={interaction.id} className="p-3 bg-muted rounded-card">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">
                    {interaction.contact
                      ? `${interaction.contact.nickname || interaction.contact.first_name} ${interaction.contact.last_name || ''}`.trim()
                      : 'Unknown Contact'
                    }
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatDateTime(interaction.interaction_date)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{interaction.notes}</p>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 mt-2 capitalize">
                  {interaction.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}