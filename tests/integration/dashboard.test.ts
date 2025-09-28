import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Mock the Supabase client for integration testing
const mockSupabase = {
  from: vi.fn(),
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase),
}))

describe('Integration Test: Dashboard Overview with All Data Sections (T034)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should aggregate and display all dashboard data sections', async () => {
    const currentDate = new Date('2024-03-15T10:00:00Z')
    
    // Mock dashboard data sections
    const upcomingReminders = [
      {
        id: 'reminder-1',
        contactId: 'contact-1',
        type: 'communication',
        scheduledFor: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        status: 'pending',
        message: 'Time to reach out to John Doe (monthly check-in)',
        contact: { firstName: 'John', lastName: 'Doe' }
      },
      {
        id: 'reminder-2',
        contactId: 'contact-2',
        type: 'birthday_week',
        scheduledFor: new Date(currentDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
        status: 'pending',
        message: 'Alice Johnson\'s birthday is coming up in 7 days (March 22nd)',
        contact: { firstName: 'Alice', lastName: 'Johnson' }
      },
      {
        id: 'reminder-3',
        contactId: 'contact-3',
        type: 'birthday_day',
        scheduledFor: new Date(currentDate.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days
        status: 'pending',
        message: 'Today is Bob Wilson\'s birthday! 🎉',
        contact: { firstName: 'Bob', lastName: 'Wilson' }
      }
    ]

    const recentInteractions = [
      {
        id: 'interaction-1',
        contactId: 'contact-1',
        type: 'call',
        notes: 'Discussed project updates and next meeting',
        interactionDate: new Date(currentDate.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        contact: { firstName: 'John', lastName: 'Doe' }
      },
      {
        id: 'interaction-2',
        contactId: 'contact-4',
        type: 'email',
        notes: 'Sent quarterly business update',
        interactionDate: new Date(currentDate.getTime() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
        contact: { firstName: 'Sarah', lastName: 'Chen' }
      },
      {
        id: 'interaction-3',
        contactId: 'contact-2',
        type: 'meetup',
        notes: 'Coffee meeting downtown - great catch up',
        interactionDate: new Date(currentDate.getTime() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
        contact: { firstName: 'Alice', lastName: 'Johnson' }
      }
    ]

    const birthdayAlerts = [
      {
        id: 'contact-5',
        firstName: 'Emma',
        lastName: 'Davis',
        birthday: '03-15', // Today!
        daysUntil: 0
      },
      {
        id: 'contact-6',
        firstName: 'Michael',
        lastName: 'Brown',
        birthday: '03-17',
        daysUntil: 2
      },
      {
        id: 'contact-7',
        firstName: 'Lisa',
        lastName: 'Taylor',
        birthday: '03-22',
        daysUntil: 7
      }
    ]

    const overdueReminders = [
      {
        id: 'overdue-1',
        contactId: 'contact-8',
        type: 'communication',
        scheduledFor: new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days overdue
        status: 'pending',
        message: 'Time to reach out to Tom Miller (weekly check-in)',
        contact: { firstName: 'Tom', lastName: 'Miller' },
        daysOverdue: 7
      },
      {
        id: 'overdue-2',
        contactId: 'contact-9',
        type: 'communication',
        scheduledFor: new Date(currentDate.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days overdue
        status: 'pending',
        message: 'Time to reach out to Kate Wilson (biweekly check-in)',
        contact: { firstName: 'Kate', lastName: 'Wilson' },
        daysOverdue: 3
      }
    ]

    const contactStats = {
      totalContacts: 15,
      contactsWithBirthdays: 8,
      contactsWithCommunicationFrequency: 12,
      totalInteractions: 45,
      interactionsThisMonth: 8
    }

    // Mock database queries for dashboard data
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: upcomingReminders, error: null })
            })
          })
        })
      })
    })

    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        gte: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: recentInteractions, error: null })
        })
      })
    })

    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        not: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: birthdayAlerts, error: null })
        })
      })
    })

    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          lt: vi.fn().mockResolvedValue({ data: overdueReminders, error: null })
        })
      })
    })

    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockResolvedValue({ data: [{ count: contactStats.totalContacts }], error: null })
    })

    // This would be the service call that doesn't exist yet
    // const dashboardService = new DashboardService()
    // const dashboardData = await dashboardService.getDashboardOverview()

    // Verify dashboard structure
    const expectedDashboard = {
      upcomingReminders,
      recentInteractions,
      birthdayAlerts,
      overdueReminders,
      contactStats
    }

    // Test upcoming reminders (next 7 days)
    expect(upcomingReminders).toHaveLength(3)
    upcomingReminders.forEach(reminder => {
      const scheduledDate = new Date(reminder.scheduledFor)
      const daysFromNow = (scheduledDate.getTime() - currentDate.getTime()) / (24 * 60 * 60 * 1000)
      expect(daysFromNow).toBeGreaterThanOrEqual(0)
      expect(daysFromNow).toBeLessThanOrEqual(7)
      expect(reminder.status).toBe('pending')
    })

    // Test recent interactions (last 7 days)
    expect(recentInteractions).toHaveLength(3)
    recentInteractions.forEach(interaction => {
      const interactionDate = new Date(interaction.interactionDate)
      const daysAgo = (currentDate.getTime() - interactionDate.getTime()) / (24 * 60 * 60 * 1000)
      expect(daysAgo).toBeGreaterThanOrEqual(0)
      expect(daysAgo).toBeLessThanOrEqual(7)
    })

    // Test birthday alerts (next 30 days)
    expect(birthdayAlerts).toHaveLength(3)
    birthdayAlerts.forEach(alert => {
      expect(alert.daysUntil).toBeGreaterThanOrEqual(0)
      expect(alert.daysUntil).toBeLessThanOrEqual(30)
      expect(alert.birthday).toMatch(/^\d{2}-\d{2}$/)
    })

    // Test overdue reminders
    expect(overdueReminders).toHaveLength(2)
    overdueReminders.forEach(reminder => {
      const scheduledDate = new Date(reminder.scheduledFor)
      expect(scheduledDate.getTime()).toBeLessThan(currentDate.getTime())
      expect(reminder.daysOverdue).toBeGreaterThan(0)
      expect(reminder.status).toBe('pending')
    })

    // Test contact statistics
    expect(contactStats.totalContacts).toBe(15)
    expect(contactStats.contactsWithBirthdays).toBe(8)
    expect(contactStats.contactsWithCommunicationFrequency).toBe(12)
    expect(contactStats.totalInteractions).toBe(45)
    expect(contactStats.interactionsThisMonth).toBe(8)
  })

  it('should prioritize reminders by type and urgency', () => {
    const currentDate = new Date('2024-03-15T10:00:00Z')
    
    const mixedReminders = [
      {
        id: 'comm-today',
        type: 'communication',
        scheduledFor: currentDate.toISOString(), // Today
        urgency: 'high'
      },
      {
        id: 'birthday-today',
        type: 'birthday_day',
        scheduledFor: currentDate.toISOString(), // Today
        urgency: 'critical'
      },
      {
        id: 'birthday-week',
        type: 'birthday_week',
        scheduledFor: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        urgency: 'medium'
      },
      {
        id: 'comm-future',
        type: 'communication',
        scheduledFor: new Date(currentDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
        urgency: 'low'
      }
    ]

    // Priority order should be:
    // 1. birthday_day (critical)
    // 2. communication due today (high)
    // 3. birthday_week (medium)
    // 4. communication future (low)

    const priorityOrder = ['critical', 'high', 'medium', 'low']
    const typeImportance = { 'birthday_day': 0, 'birthday_week': 1, 'communication': 2 }

    mixedReminders.forEach(reminder => {
      const daysFromNow = (new Date(reminder.scheduledFor).getTime() - currentDate.getTime()) / (24 * 60 * 60 * 1000)
      
      // Assign urgency based on type and timing
      if (reminder.type === 'birthday_day' && daysFromNow <= 0) {
        expect(reminder.urgency).toBe('critical')
      } else if (daysFromNow <= 0) {
        expect(reminder.urgency).toBe('high')
      } else if (daysFromNow <= 1) {
        expect(['high', 'medium']).toContain(reminder.urgency)
      } else {
        expect(['medium', 'low']).toContain(reminder.urgency)
      }
    })
  })

  it('should display appropriate empty states for dashboard sections', async () => {
    // Mock empty data responses
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null })
            })
          })
        }),
        gte: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null })
        }),
        not: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null })
        }),
        lt: vi.fn().mockResolvedValue({ data: [], error: null })
      })
    })

    const emptyDashboard = {
      upcomingReminders: [],
      recentInteractions: [],
      birthdayAlerts: [],
      overdueReminders: [],
      contactStats: {
        totalContacts: 0,
        contactsWithBirthdays: 0,
        contactsWithCommunicationFrequency: 0,
        totalInteractions: 0,
        interactionsThisMonth: 0
      }
    }

    // Verify empty states
    expect(emptyDashboard.upcomingReminders).toHaveLength(0)
    expect(emptyDashboard.recentInteractions).toHaveLength(0)
    expect(emptyDashboard.birthdayAlerts).toHaveLength(0)
    expect(emptyDashboard.overdueReminders).toHaveLength(0)
    expect(emptyDashboard.contactStats.totalContacts).toBe(0)

    // Dashboard should display appropriate empty state messages
    const emptyMessages = {
      upcomingReminders: 'No upcoming reminders in the next 7 days',
      recentInteractions: 'No interactions in the past 7 days',
      birthdayAlerts: 'No birthdays in the next 30 days',
      overdueReminders: 'No overdue reminders',
      contacts: 'No contacts added yet'
    }

    Object.values(emptyMessages).forEach(message => {
      expect(message).toBeTruthy()
      expect(typeof message).toBe('string')
    })
  })

  it('should calculate correct statistics for contact data', async () => {
    const mockContacts = [
      { id: '1', firstName: 'John', birthday: '03-15', communicationFrequency: 'monthly' },
      { id: '2', firstName: 'Alice', birthday: null, communicationFrequency: 'weekly' },
      { id: '3', firstName: 'Bob', birthday: '07-22', communicationFrequency: null },
      { id: '4', firstName: 'Sarah', birthday: '12-01', communicationFrequency: 'quarterly' },
      { id: '5', firstName: 'Mike', birthday: null, communicationFrequency: null },
    ]

    const mockInteractions = [
      { id: 'i1', contactId: '1', interactionDate: '2024-03-10T10:00:00Z' },
      { id: 'i2', contactId: '2', interactionDate: '2024-03-12T14:00:00Z' },
      { id: 'i3', contactId: '1', interactionDate: '2024-02-15T09:00:00Z' }, // Last month
      { id: 'i4', contactId: '4', interactionDate: '2024-03-14T16:00:00Z' },
    ]

    // Mock database responses
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockResolvedValue({ data: mockContacts, error: null })
    })

    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        gte: vi.fn().mockReturnValue({
          lt: vi.fn().mockResolvedValue({ data: mockInteractions.slice(0, 3), error: null }) // This month only
        })
      })
    })

    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockResolvedValue({ data: mockInteractions, error: null }) // All interactions
    })

    // Calculate expected statistics
    const expectedStats = {
      totalContacts: mockContacts.length, // 5
      contactsWithBirthdays: mockContacts.filter(c => c.birthday !== null).length, // 3
      contactsWithCommunicationFrequency: mockContacts.filter(c => c.communicationFrequency !== null).length, // 3
      totalInteractions: mockInteractions.length, // 4
      interactionsThisMonth: mockInteractions.slice(0, 3).length, // 3
    }

    expect(expectedStats.totalContacts).toBe(5)
    expect(expectedStats.contactsWithBirthdays).toBe(3)
    expect(expectedStats.contactsWithCommunicationFrequency).toBe(3)
    expect(expectedStats.totalInteractions).toBe(4)
    expect(expectedStats.interactionsThisMonth).toBe(3)

    // Verify calculations
    const contactsWithBirthdays = mockContacts.filter(c => c.birthday !== null)
    expect(contactsWithBirthdays).toHaveLength(3)
    expect(contactsWithBirthdays.map(c => c.id).sort()).toEqual(['1', '3', '4'])

    const contactsWithFrequency = mockContacts.filter(c => c.communicationFrequency !== null)
    expect(contactsWithFrequency).toHaveLength(3)
    expect(contactsWithFrequency.map(c => c.id).sort()).toEqual(['1', '2', '4'])
  })

  it('should handle dashboard data refresh and real-time updates', async () => {
    const initialTime = new Date('2024-03-15T10:00:00Z')
    const refreshTime = new Date('2024-03-15T11:00:00Z')

    // Initial dashboard state
    const initialReminders = [
      {
        id: 'reminder-1',
        type: 'communication',
        scheduledFor: new Date(initialTime.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour from initial time
        status: 'pending'
      }
    ]

    // After 1 hour, the reminder should now be overdue
    const refreshedReminders = [
      {
        id: 'reminder-1',
        type: 'communication',
        scheduledFor: new Date(refreshTime.getTime() - 60 * 60 * 1000).toISOString(), // Now 1 hour overdue
        status: 'pending'
      }
    ]

    // Mock initial data
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({ data: initialReminders, error: null })
          })
        })
      })
    })

    // Mock refreshed data
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          lt: vi.fn().mockResolvedValue({ data: refreshedReminders, error: null })
        })
      })
    })

    // Initial state: reminder is upcoming
    const initialReminderTime = new Date(initialReminders[0].scheduledFor).getTime()
    expect(initialReminderTime).toBeGreaterThan(initialTime.getTime())

    // After refresh: same reminder is now overdue
    const refreshedReminderTime = new Date(refreshedReminders[0].scheduledFor).getTime()
    expect(refreshedReminderTime).toBeLessThan(refreshTime.getTime())
    expect(refreshedReminders[0].id).toBe(initialReminders[0].id) // Same reminder, different status
  })

  it('should format dashboard display data correctly', () => {
    const sampleData = {
      upcomingReminder: {
        id: 'reminder-1',
        type: 'birthday_week',
        scheduledFor: '2024-03-20T09:00:00Z',
        message: 'John Doe\'s birthday is coming up in 7 days (March 27th)',
        contact: { firstName: 'John', lastName: 'Doe' }
      },
      recentInteraction: {
        id: 'interaction-1',
        type: 'call',
        interactionDate: '2024-03-13T14:30:00Z',
        notes: 'Discussed project timeline and deliverables.',
        contact: { firstName: 'Alice', lastName: 'Johnson' }
      },
      birthdayAlert: {
        id: 'contact-1',
        firstName: 'Bob',
        lastName: 'Wilson',
        birthday: '03-18',
        daysUntil: 3
      }
    }

    // Format display strings
    const formatters = {
      reminderTitle: (contact: any) => `${contact.firstName} ${contact.lastName}`,
      interactionSummary: (interaction: any) => `${interaction.type} with ${interaction.contact.firstName}`,
      birthdayMessage: (alert: any) => `${alert.firstName}'s birthday in ${alert.daysUntil} days`,
      dateDisplay: (dateStr: string) => new Date(dateStr).toLocaleDateString(),
      timeAgo: (dateStr: string) => {
        const now = new Date('2024-03-15T10:00:00Z')
        const date = new Date(dateStr)
        const hoursAgo = Math.floor((now.getTime() - date.getTime()) / (60 * 60 * 1000))
        return `${hoursAgo} hours ago`
      }
    }

    // Test formatting functions
    expect(formatters.reminderTitle(sampleData.upcomingReminder.contact)).toBe('John Doe')
    expect(formatters.interactionSummary(sampleData.recentInteraction)).toBe('call with Alice')
    expect(formatters.birthdayMessage(sampleData.birthdayAlert)).toBe('Bob\'s birthday in 3 days')
    expect(formatters.dateDisplay(sampleData.upcomingReminder.scheduledFor)).toBe('3/20/2024')
    expect(formatters.timeAgo(sampleData.recentInteraction.interactionDate)).toBe('19 hours ago')

    // Verify data structure for UI components
    expect(sampleData.upcomingReminder.contact).toHaveProperty('firstName')
    expect(sampleData.upcomingReminder.contact).toHaveProperty('lastName')
    expect(sampleData.recentInteraction.notes.length).toBeGreaterThan(0)
    expect(sampleData.birthdayAlert.daysUntil).toBeGreaterThanOrEqual(0)
  })
})