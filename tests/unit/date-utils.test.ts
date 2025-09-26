import { describe, it, expect, beforeEach, afterEach } from 'vitest'

// Date utility functions that would be used throughout the application
export const formatBirthday = (birthday: string): string => {
  const [month, day] = birthday.split('-')
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return `${monthNames[parseInt(month) - 1]} ${parseInt(day)}`
}

export const getDaysUntilBirthday = (birthday: string): number => {
  const today = new Date()
  const currentYear = today.getFullYear()
  const [month, day] = birthday.split('-').map(Number)

  let birthdayThisYear = new Date(currentYear, month - 1, day)

  // If birthday already passed this year, calculate for next year
  if (birthdayThisYear < today) {
    birthdayThisYear = new Date(currentYear + 1, month - 1, day)
  }

  const diffTime = birthdayThisYear.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export const isBirthdayInNextDays = (birthday: string, days: number): boolean => {
  const daysUntil = getDaysUntilBirthday(birthday)
  return daysUntil <= days && daysUntil >= 0
}

export const isOverdue = (lastContactedAt: string | null, frequency: string): boolean => {
  if (!lastContactedAt || !frequency) return false

  const lastContact = new Date(lastContactedAt)
  const today = new Date()
  const daysSinceContact = Math.floor((today.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24))

  const frequencyDays: { [key: string]: number } = {
    weekly: 7,
    monthly: 30,
    quarterly: 90,
    biannually: 180,
    annually: 365
  }

  const expectedDays = frequencyDays[frequency]
  return expectedDays ? daysSinceContact > expectedDays : false
}

export const getNextContactDate = (lastContactedAt: string | null, frequency: string): Date | null => {
  if (!lastContactedAt || !frequency) return null

  const lastContact = new Date(lastContactedAt)
  const frequencyDays: { [key: string]: number } = {
    weekly: 7,
    monthly: 30,
    quarterly: 90,
    biannually: 180,
    annually: 365
  }

  const days = frequencyDays[frequency]
  if (!days) return null

  const nextContact = new Date(lastContact)
  nextContact.setDate(nextContact.getDate() + days)
  return nextContact
}

export const formatRelativeDate = (date: string): string => {
  const targetDate = new Date(date)
  const today = new Date()
  const diffTime = targetDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'
  if (diffDays > 1) return `In ${diffDays} days`
  if (diffDays < -1) return `${Math.abs(diffDays)} days ago`

  return targetDate.toLocaleDateString()
}

export const isValidISODate = (dateString: string): boolean => {
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date.getTime()) && dateString.includes('T')
}

export const formatDateForInput = (date: Date): string => {
  return date.toISOString().slice(0, 16)
}

export const calculateAge = (birthday: string): number | null => {
  // This function calculates age, but needs birth year
  // For MM-DD format, we can't calculate exact age
  return null
}

export const getBirthdayInCurrentYear = (birthday: string): Date => {
  const [month, day] = birthday.split('-').map(Number)
  const currentYear = new Date().getFullYear()
  return new Date(currentYear, month - 1, day)
}

describe('Date Utilities', () => {
  let originalDate: DateConstructor

  beforeEach(() => {
    // Mock current date to make tests predictable
    originalDate = global.Date
    const mockDate = new Date('2023-06-15T12:00:00Z') // June 15, 2023
    global.Date = class extends Date {
      constructor(...args: any[]) {
        if (args.length === 0) {
          super(mockDate)
        } else {
          super(...args)
        }
      }
      static now() {
        return mockDate.getTime()
      }
    } as any
  })

  afterEach(() => {
    global.Date = originalDate
  })

  describe('formatBirthday', () => {
    it('should format MM-DD to readable format', () => {
      expect(formatBirthday('01-15')).toBe('January 15')
      expect(formatBirthday('12-25')).toBe('December 25')
      expect(formatBirthday('06-30')).toBe('June 30')
      expect(formatBirthday('02-29')).toBe('February 29')
    })

    it('should handle edge cases', () => {
      expect(formatBirthday('01-01')).toBe('January 1')
      expect(formatBirthday('12-31')).toBe('December 31')
    })
  })

  describe('getDaysUntilBirthday', () => {
    it('should calculate days until birthday this year', () => {
      // Current date is June 15, 2023
      expect(getDaysUntilBirthday('06-20')).toBe(5) // 5 days from now
      expect(getDaysUntilBirthday('07-01')).toBe(16) // July 1st
      expect(getDaysUntilBirthday('12-25')).toBe(193) // Christmas
    })

    it('should calculate days until birthday next year for past dates', () => {
      // Current date is June 15, 2023
      expect(getDaysUntilBirthday('01-01')).toBe(200) // New Year next year
      expect(getDaysUntilBirthday('06-14')).toBe(364) // Yesterday, so next year
    })

    it('should handle birthday today', () => {
      expect(getDaysUntilBirthday('06-15')).toBe(0) // Today
    })
  })

  describe('isBirthdayInNextDays', () => {
    it('should identify birthdays within specified days', () => {
      expect(isBirthdayInNextDays('06-20', 7)).toBe(true) // 5 days away, within 7
      expect(isBirthdayInNextDays('06-25', 7)).toBe(false) // 10 days away, not within 7
      expect(isBirthdayInNextDays('06-15', 0)).toBe(true) // Today, within 0 days
      expect(isBirthdayInNextDays('06-14', 7)).toBe(false) // Yesterday, next year
    })
  })

  describe('isOverdue', () => {
    it('should identify overdue contacts based on frequency', () => {
      const eightDaysAgo = new Date('2023-06-07T12:00:00Z').toISOString()
      const thirtyOneDaysAgo = new Date('2023-05-15T12:00:00Z').toISOString()

      expect(isOverdue(eightDaysAgo, 'weekly')).toBe(true) // 8 days > 7 days
      expect(isOverdue(eightDaysAgo, 'monthly')).toBe(false) // 8 days < 30 days
      expect(isOverdue(thirtyOneDaysAgo, 'monthly')).toBe(true) // 31 days > 30 days
    })

    it('should handle null values', () => {
      expect(isOverdue(null, 'weekly')).toBe(false)
      expect(isOverdue('2023-06-07T12:00:00Z', '')).toBe(false)
      expect(isOverdue(null, '')).toBe(false)
    })

    it('should handle all frequency types', () => {
      const overdueDates = {
        weekly: new Date('2023-06-07T12:00:00Z').toISOString(), // 8 days ago
        monthly: new Date('2023-05-14T12:00:00Z').toISOString(), // 32 days ago
        quarterly: new Date('2023-03-15T12:00:00Z').toISOString(), // 92 days ago
        biannually: new Date('2022-12-15T12:00:00Z').toISOString(), // 182 days ago
        annually: new Date('2022-06-14T12:00:00Z').toISOString() // 366 days ago
      }

      Object.entries(overdueDates).forEach(([frequency, date]) => {
        expect(isOverdue(date, frequency)).toBe(true)
      })
    })
  })

  describe('getNextContactDate', () => {
    it('should calculate next contact date based on frequency', () => {
      const lastContact = '2023-06-01T12:00:00Z'

      const weeklyNext = getNextContactDate(lastContact, 'weekly')
      expect(weeklyNext?.toISOString().slice(0, 10)).toBe('2023-06-08')

      const monthlyNext = getNextContactDate(lastContact, 'monthly')
      expect(monthlyNext?.toISOString().slice(0, 10)).toBe('2023-07-01')
    })

    it('should handle null inputs', () => {
      expect(getNextContactDate(null, 'weekly')).toBe(null)
      expect(getNextContactDate('2023-06-01T12:00:00Z', '')).toBe(null)
      expect(getNextContactDate(null, '')).toBe(null)
    })
  })

  describe('formatRelativeDate', () => {
    it('should format dates relative to today', () => {
      const today = '2023-06-15T12:00:00Z'
      const tomorrow = '2023-06-16T12:00:00Z'
      const yesterday = '2023-06-14T12:00:00Z'
      const inThreeDays = '2023-06-18T12:00:00Z'
      const threeDaysAgo = '2023-06-12T12:00:00Z'

      expect(formatRelativeDate(today)).toBe('Today')
      expect(formatRelativeDate(tomorrow)).toBe('Tomorrow')
      expect(formatRelativeDate(yesterday)).toBe('Yesterday')
      expect(formatRelativeDate(inThreeDays)).toBe('In 3 days')
      expect(formatRelativeDate(threeDaysAgo)).toBe('3 days ago')
    })
  })

  describe('isValidISODate', () => {
    it('should validate ISO date strings', () => {
      expect(isValidISODate('2023-06-15T12:00:00Z')).toBe(true)
      expect(isValidISODate('2023-06-15T12:00:00.000Z')).toBe(true)
      expect(isValidISODate('2023-06-15')).toBe(false) // No time component
      expect(isValidISODate('invalid-date')).toBe(false)
      expect(isValidISODate('')).toBe(false)
    })
  })

  describe('formatDateForInput', () => {
    it('should format date for datetime-local input', () => {
      const date = new Date('2023-06-15T14:30:00Z')
      const formatted = formatDateForInput(date)
      expect(formatted).toBe('2023-06-15T14:30')
    })
  })

  describe('getBirthdayInCurrentYear', () => {
    it('should get birthday date in current year', () => {
      const birthday = getBirthdayInCurrentYear('12-25')
      expect(birthday.getFullYear()).toBe(2023)
      expect(birthday.getMonth()).toBe(11) // December (0-indexed)
      expect(birthday.getDate()).toBe(25)
    })
  })
})