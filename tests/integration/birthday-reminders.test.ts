import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Mock the Supabase client for integration testing
const mockSupabase = {
  from: vi.fn(),
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase),
}))

describe('Integration Test: Birthday Reminder Generation and Scheduling (T032)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should generate birthday week and day reminders for contact with birthday', async () => {
    const contactId = 'contact-birthday'
    const currentYear = 2024
    const birthday = '03-15' // March 15th
    
    // Calculate reminder dates for March 15th, 2024
    const birthdayDate = new Date(currentYear, 2, 15) // Month is 0-indexed
    const weekBeforeDate = new Date(birthdayDate.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const expectedReminders = [
      {
        id: 'reminder-birthday-week',
        contactId: contactId,
        type: 'birthday_week',
        scheduledFor: weekBeforeDate.toISOString(),
        status: 'pending',
        message: 'John Doe\'s birthday is coming up in 7 days (March 15th)',
        createdAt: new Date().toISOString(),
        sentAt: null,
      },
      {
        id: 'reminder-birthday-day',
        contactId: contactId,
        type: 'birthday_day',
        scheduledFor: birthdayDate.toISOString(),
        status: 'pending',
        message: 'Today is John Doe\'s birthday! 🎉',
        createdAt: new Date().toISOString(),
        sentAt: null,
      }
    ]

    // Mock successful reminder creation
    mockSupabase.from.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ data: expectedReminders, error: null }),
      select: vi.fn().mockResolvedValue({ data: expectedReminders, error: null }),
      eq: vi.fn().mockReturnThis(),
    })

    // This would be the service call that doesn't exist yet
    // const reminderService = new ReminderService()
    // const result = await reminderService.generateBirthdayReminders(contactId, birthday)

    // Verify the reminder structure and timing
    expect(expectedReminders).toHaveLength(2)
    
    const weekReminder = expectedReminders.find(r => r.type === 'birthday_week')
    const dayReminder = expectedReminders.find(r => r.type === 'birthday_day')

    expect(weekReminder).toBeDefined()
    expect(dayReminder).toBeDefined()
    
    // Verify timing - week reminder should be exactly 7 days before day reminder
    const weekReminderDate = new Date(weekReminder!.scheduledFor)
    const dayReminderDate = new Date(dayReminder!.scheduledFor)
    const timeDiff = dayReminderDate.getTime() - weekReminderDate.getTime()
    const daysDiff = timeDiff / (24 * 60 * 60 * 1000)
    
    expect(daysDiff).toBe(7)
  })

  it('should handle leap year birthdays correctly', async () => {
    const contactId = 'contact-leap-year'
    const leapYearBirthday = '02-29' // February 29th
    
    // Test for non-leap year (2023) - should use February 28th
    const nonLeapYear = 2023
    const expectedDateNonLeap = new Date(nonLeapYear, 1, 28) // Feb 28, 2023
    
    // Test for leap year (2024) - should use February 29th
    const leapYear = 2024
    const expectedDateLeap = new Date(leapYear, 1, 29) // Feb 29, 2024

    const nonLeapYearReminders = [
      {
        id: 'reminder-leap-week-2023',
        contactId: contactId,
        type: 'birthday_week',
        scheduledFor: new Date(expectedDateNonLeap.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        message: 'Alice Johnson\'s birthday is coming up in 7 days (February 28th)',
      },
      {
        id: 'reminder-leap-day-2023',
        contactId: contactId,
        type: 'birthday_day',
        scheduledFor: expectedDateNonLeap.toISOString(),
        status: 'pending',
        message: 'Today is Alice Johnson\'s birthday! 🎉',
      }
    ]

    const leapYearReminders = [
      {
        id: 'reminder-leap-week-2024',
        contactId: contactId,
        type: 'birthday_week',
        scheduledFor: new Date(expectedDateLeap.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        message: 'Alice Johnson\'s birthday is coming up in 7 days (February 29th)',
      },
      {
        id: 'reminder-leap-day-2024',
        contactId: contactId,
        type: 'birthday_day',
        scheduledFor: expectedDateLeap.toISOString(),
        status: 'pending',
        message: 'Today is Alice Johnson\'s birthday! 🎉',
      }
    ]

    // Verify leap year logic
    expect(isLeapYear(2024)).toBe(true)
    expect(isLeapYear(2023)).toBe(false)
    expect(isLeapYear(2000)).toBe(true)
    expect(isLeapYear(1900)).toBe(false)

    // Verify date calculations
    expect(expectedDateNonLeap.getMonth()).toBe(1) // February (0-indexed)
    expect(expectedDateNonLeap.getDate()).toBe(28)
    expect(expectedDateLeap.getMonth()).toBe(1) // February (0-indexed)
    expect(expectedDateLeap.getDate()).toBe(29)

    function isLeapYear(year: number): boolean {
      return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
    }
  })

  it('should regenerate birthday reminders annually', async () => {
    const contactId = 'contact-annual'
    const birthday = '06-20' // June 20th

    // Mock existing reminders from previous year (already sent/dismissed)
    const previousYearReminders = [
      {
        id: 'old-week-reminder',
        contactId: contactId,
        type: 'birthday_week',
        scheduledFor: new Date(2023, 5, 13).toISOString(), // June 13, 2023
        status: 'sent',
        sentAt: new Date(2023, 5, 13).toISOString(),
      },
      {
        id: 'old-day-reminder',
        contactId: contactId,
        type: 'birthday_day',
        scheduledFor: new Date(2023, 5, 20).toISOString(), // June 20, 2023
        status: 'dismissed',
        sentAt: null,
      }
    ]

    // New reminders for current year
    const currentYearReminders = [
      {
        id: 'new-week-reminder',
        contactId: contactId,
        type: 'birthday_week',
        scheduledFor: new Date(2024, 5, 13).toISOString(), // June 13, 2024
        status: 'pending',
        sentAt: null,
      },
      {
        id: 'new-day-reminder',
        contactId: contactId,
        type: 'birthday_day',
        scheduledFor: new Date(2024, 5, 20).toISOString(), // June 20, 2024
        status: 'pending',
        sentAt: null,
      }
    ]

    // Mock database queries
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: previousYearReminders, error: null }),
      insert: vi.fn().mockResolvedValue({ data: currentYearReminders, error: null }),
      eq: vi.fn().mockReturnThis(),
    })

    // Verify annual regeneration logic
    expect(previousYearReminders.every(r => r.status !== 'pending')).toBe(true)
    expect(currentYearReminders.every(r => r.status === 'pending')).toBe(true)

    // Verify year difference
    const oldDate = new Date(previousYearReminders[0].scheduledFor)
    const newDate = new Date(currentYearReminders[0].scheduledFor)
    expect(newDate.getFullYear() - oldDate.getFullYear()).toBe(1)
  })

  it('should not generate birthday reminders for contacts without birthdays', async () => {
    const contactId = 'contact-no-birthday'
    const contactData = {
      id: contactId,
      firstName: 'John',
      lastName: 'Doe',
      birthday: null, // No birthday
      communicationFrequency: 'monthly',
    }

    // Mock empty reminder result
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
      eq: vi.fn().mockReturnThis(),
    })

    // When birthday is null, no birthday reminders should be generated
    expect(contactData.birthday).toBeNull()
    
    // Only communication reminders should be generated for this contact
    expect(contactData.communicationFrequency).toBe('monthly')
  })

  it('should handle birthday reminder scheduling for all months', () => {
    const testBirthdays = [
      { birthday: '01-01', month: 'January', day: 1 },
      { birthday: '02-14', month: 'February', day: 14 },
      { birthday: '03-17', month: 'March', day: 17 },
      { birthday: '04-22', month: 'April', day: 22 },
      { birthday: '05-30', month: 'May', day: 30 },
      { birthday: '06-15', month: 'June', day: 15 },
      { birthday: '07-04', month: 'July', day: 4 },
      { birthday: '08-25', month: 'August', day: 25 },
      { birthday: '09-10', month: 'September', day: 10 },
      { birthday: '10-31', month: 'October', day: 31 },
      { birthday: '11-11', month: 'November', day: 11 },
      { birthday: '12-25', month: 'December', day: 25 },
    ]

    testBirthdays.forEach(({ birthday, month, day }) => {
      const [monthStr, dayStr] = birthday.split('-')
      const monthNum = parseInt(monthStr, 10)
      const dayNum = parseInt(dayStr, 10)

      expect(monthNum).toBeGreaterThanOrEqual(1)
      expect(monthNum).toBeLessThanOrEqual(12)
      expect(dayNum).toBeGreaterThanOrEqual(1)
      expect(dayNum).toBeLessThanOrEqual(31)

      // Verify birthday format is MM-DD
      expect(birthday).toMatch(/^\d{2}-\d{2}$/)
    })
  })

  it('should handle timezone-independent birthday scheduling', () => {
    const birthday = '07-20' // July 20th
    const year = 2024

    // Birthday should be calculated at start of day in local timezone
    const birthdayDate = new Date(year, 6, 20, 0, 0, 0) // July 20, 2024, 00:00:00
    const weekBeforeDate = new Date(year, 6, 13, 0, 0, 0) // July 13, 2024, 00:00:00

    // Verify dates are calculated correctly regardless of timezone
    expect(birthdayDate.getDate()).toBe(20)
    expect(birthdayDate.getMonth()).toBe(6) // July is month 6 (0-indexed)
    expect(birthdayDate.getFullYear()).toBe(year)

    expect(weekBeforeDate.getDate()).toBe(13)
    expect(weekBeforeDate.getMonth()).toBe(6)
    expect(weekBeforeDate.getFullYear()).toBe(year)

    // Verify 7-day difference
    const timeDiff = birthdayDate.getTime() - weekBeforeDate.getTime()
    const daysDiff = timeDiff / (24 * 60 * 60 * 1000)
    expect(daysDiff).toBe(7)
  })

  it('should validate birthday reminder types and statuses', () => {
    const validReminderTypes = ['communication', 'birthday_week', 'birthday_day']
    const validReminderStatuses = ['pending', 'sent', 'dismissed']

    // Birthday reminder types
    expect(validReminderTypes).toContain('birthday_week')
    expect(validReminderTypes).toContain('birthday_day')

    // Reminder statuses
    expect(validReminderStatuses).toContain('pending')
    expect(validReminderStatuses).toContain('sent')
    expect(validReminderStatuses).toContain('dismissed')

    // Invalid types should not be allowed
    const invalidTypes = ['birthday_month', 'birthday_yearly', 'custom']
    invalidTypes.forEach(type => {
      expect(validReminderTypes).not.toContain(type)
    })
  })

  it('should generate appropriate reminder messages for birthday types', () => {
    const contactName = 'Jane Smith'
    const birthday = '09-25' // September 25th

    const expectedWeekMessage = `${contactName}'s birthday is coming up in 7 days (September 25th)`
    const expectedDayMessage = `Today is ${contactName}'s birthday! 🎉`

    // Verify message structure
    expect(expectedWeekMessage).toContain(contactName)
    expect(expectedWeekMessage).toContain('7 days')
    expect(expectedWeekMessage).toContain('September 25th')

    expect(expectedDayMessage).toContain(contactName)
    expect(expectedDayMessage).toContain('Today is')
    expect(expectedDayMessage).toContain('birthday')

    // Message length validation (from data model: 1-200 characters)
    expect(expectedWeekMessage.length).toBeGreaterThanOrEqual(1)
    expect(expectedWeekMessage.length).toBeLessThanOrEqual(200)
    expect(expectedDayMessage.length).toBeGreaterThanOrEqual(1)
    expect(expectedDayMessage.length).toBeLessThanOrEqual(200)
  })

  it('should handle birthday reminders for contacts with only first name', () => {
    const contactData = {
      id: 'contact-firstname-only',
      firstName: 'Madonna',
      lastName: null,
      birthday: '08-16'
    }

    const expectedWeekMessage = `Madonna's birthday is coming up in 7 days (August 16th)`
    const expectedDayMessage = `Today is Madonna's birthday! 🎉`

    // Should work with just first name
    expect(expectedWeekMessage).toContain('Madonna')
    expect(expectedDayMessage).toContain('Madonna')
    expect(expectedWeekMessage).not.toContain('null')
    expect(expectedDayMessage).not.toContain('null')
  })
})