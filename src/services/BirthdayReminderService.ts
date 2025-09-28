import { Contact } from '@/types/database'
import { ReminderService, CreateReminderInput } from './ReminderService'

export class BirthdayReminderService {
  /**
   * Generate birthday reminders for a contact
   */
  static async generateBirthdayReminders(contact: Contact): Promise<void> {
    if (!contact.birthday || contact.reminders_paused) {
      return
    }

    // Delete any existing pending birthday reminders for this contact
    await this.clearExistingBirthdayReminders(contact.id)

    // Generate new birthday reminders
    const birthdayDates = this.calculateBirthdayDates(contact.birthday)
    
    for (const { date, type, message } of birthdayDates) {
      // Only create reminders for future dates
      if (date > new Date()) {
        const reminderInput: CreateReminderInput = {
          contact_id: contact.id,
          type,
          scheduled_for: date.toISOString(),
          message
        }

        try {
          await ReminderService.create(reminderInput)
        } catch (error) {
          console.error(`Failed to create birthday reminder for ${contact.first_name}:`, error)
        }
      }
    }
  }

  /**
   * Generate birthday reminders for multiple contacts
   */
  static async generateBirthdayRemindersForContacts(contacts: Contact[]): Promise<void> {
    const contactsWithBirthdays = contacts.filter(contact => 
      contact.birthday && !contact.reminders_paused
    )

    for (const contact of contactsWithBirthdays) {
      await this.generateBirthdayReminders(contact)
    }
  }

  /**
   * Calculate birthday reminder dates for the current and next year
   */
  private static calculateBirthdayDates(birthday: string): Array<{
    date: Date
    type: 'birthday_week' | 'birthday_day'
    message: string
  }> {
    const [month, day] = birthday.split('-').map(Number)
    const currentYear = new Date().getFullYear()
    const results: Array<{
      date: Date
      type: 'birthday_week' | 'birthday_day'
      message: string
    }> = []

    // Generate for current year and next year
    for (let year = currentYear; year <= currentYear + 1; year++) {
      const birthdayDate = this.getBirthdayDateForYear(month, day, year)
      const weekBeforeDate = new Date(birthdayDate)
      weekBeforeDate.setDate(weekBeforeDate.getDate() - 7)

      // Birthday week reminder (7 days before)
      results.push({
        date: weekBeforeDate,
        type: 'birthday_week',
        message: `${birthday} birthday coming up in 7 days!`
      })

      // Birthday day reminder
      results.push({
        date: birthdayDate,
        type: 'birthday_day',
        message: `It's ${birthday} birthday today! 🎉`
      })
    }

    return results
  }

  /**
   * Get birthday date for a specific year, handling leap years
   */
  private static getBirthdayDateForYear(month: number, day: number, year: number): Date {
    // Handle February 29th on non-leap years
    if (month === 2 && day === 29 && !this.isLeapYear(year)) {
      return new Date(year, 1, 28) // February 28th
    }

    return new Date(year, month - 1, day)
  }

  /**
   * Check if a year is a leap year
   */
  private static isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
  }

  /**
   * Clear existing pending birthday reminders for a contact
   */
  private static async clearExistingBirthdayReminders(contactId: string): Promise<void> {
    const existingReminders = await ReminderService.getByContactId(contactId, {
      status: 'pending'
    })

    const birthdayReminders = existingReminders.filter(reminder => 
      reminder.type === 'birthday_week' || reminder.type === 'birthday_day'
    )

    for (const reminder of birthdayReminders) {
      await ReminderService.delete(reminder.id)
    }
  }

  /**
   * Get upcoming birthdays within the next N days
   */
  static getUpcomingBirthdays(contacts: Contact[], daysAhead: number = 30): Array<{
    contact: Contact
    birthdayDate: Date
    daysUntil: number
    age?: number
  }> {
    const today = new Date()
    const cutoffDate = new Date(today)
    cutoffDate.setDate(cutoffDate.getDate() + daysAhead)

    const upcomingBirthdays: Array<{
      contact: Contact
      birthdayDate: Date
      daysUntil: number
      age?: number
    }> = []

    for (const contact of contacts) {
      if (!contact.birthday) continue

      const [month, day] = contact.birthday.split('-').map(Number)
      let birthdayThisYear = this.getBirthdayDateForYear(month, day, today.getFullYear())

      // If birthday already passed this year, check next year
      if (birthdayThisYear < today) {
        birthdayThisYear = this.getBirthdayDateForYear(month, day, today.getFullYear() + 1)
      }

      if (birthdayThisYear <= cutoffDate) {
        const daysUntil = Math.ceil((birthdayThisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        
        upcomingBirthdays.push({
          contact,
          birthdayDate: birthdayThisYear,
          daysUntil,
          age: undefined // We don't store birth year, so we can't calculate age
        })
      }
    }

    // Sort by days until birthday
    return upcomingBirthdays.sort((a, b) => a.daysUntil - b.daysUntil)
  }

  /**
   * Get today's birthdays
   */
  static getTodaysBirthdays(contacts: Contact[]): Contact[] {
    const today = new Date()
    const todayMonth = today.getMonth() + 1 // getMonth() is 0-indexed
    const todayDay = today.getDate()
    const todayString = `${todayMonth.toString().padStart(2, '0')}-${todayDay.toString().padStart(2, '0')}`

    return contacts.filter(contact => contact.birthday === todayString)
  }

  /**
   * Get birthday statistics for all contacts
   */
  static getBirthdayStatistics(contacts: Contact[]): {
    totalWithBirthdays: number
    totalWithoutBirthdays: number
    birthdaysThisMonth: number
    birthdaysNextMonth: number
    birthdaysByMonth: Record<string, number>
  } {
    const today = new Date()
    const currentMonth = today.getMonth() + 1
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1

    const stats = {
      totalWithBirthdays: 0,
      totalWithoutBirthdays: 0,
      birthdaysThisMonth: 0,
      birthdaysNextMonth: 0,
      birthdaysByMonth: {} as Record<string, number>
    }

    // Initialize months
    for (let i = 1; i <= 12; i++) {
      const monthName = new Date(2000, i - 1, 1).toLocaleString('default', { month: 'long' })
      stats.birthdaysByMonth[monthName] = 0
    }

    for (const contact of contacts) {
      if (contact.birthday) {
        stats.totalWithBirthdays++
        
        const [month] = contact.birthday.split('-').map(Number)
        const monthName = new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' })
        stats.birthdaysByMonth[monthName]++

        if (month === currentMonth) {
          stats.birthdaysThisMonth++
        }
        if (month === nextMonth) {
          stats.birthdaysNextMonth++
        }
      } else {
        stats.totalWithoutBirthdays++
      }
    }

    return stats
  }

  /**
   * Validate birthday format (MM-DD)
   */
  static validateBirthdayFormat(birthday: string): boolean {
    const regex = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
    if (!regex.test(birthday)) {
      return false
    }

    const [month, day] = birthday.split('-').map(Number)
    
    // Check for valid month
    if (month < 1 || month > 12) {
      return false
    }

    // Check for valid day based on month
    const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    if (day < 1 || day > daysInMonth[month - 1]) {
      return false
    }

    return true
  }

  /**
   * Format birthday for display
   */
  static formatBirthdayForDisplay(birthday: string): string {
    if (!this.validateBirthdayFormat(birthday)) {
      return birthday
    }

    const [month, day] = birthday.split('-').map(Number)
    const date = new Date(2000, month - 1, day) // Using 2000 as dummy year
    
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric'
    })
  }

  /**
   * Parse birthday from various input formats
   */
  static parseBirthdayInput(input: string): string | null {
    // Remove extra spaces and convert to lowercase
    const cleaned = input.trim().toLowerCase()

    // Try MM-DD format
    if (/^\d{1,2}-\d{1,2}$/.test(cleaned)) {
      const [month, day] = cleaned.split('-').map(Number)
      const formatted = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
      return this.validateBirthdayFormat(formatted) ? formatted : null
    }

    // Try MM/DD format
    if (/^\d{1,2}\/\d{1,2}$/.test(cleaned)) {
      const [month, day] = cleaned.split('/').map(Number)
      const formatted = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
      return this.validateBirthdayFormat(formatted) ? formatted : null
    }

    // Try month name formats (e.g., "January 15", "Jan 15")
    const monthNameMatch = cleaned.match(/^([a-z]+)\s+(\d{1,2})$/)
    if (monthNameMatch) {
      const monthName = monthNameMatch[1]
      const day = parseInt(monthNameMatch[2])
      
      const monthNames = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
      ]
      
      const shortMonthNames = [
        'jan', 'feb', 'mar', 'apr', 'may', 'jun',
        'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
      ]

      let month = monthNames.indexOf(monthName) + 1
      if (month === 0) {
        month = shortMonthNames.indexOf(monthName) + 1
      }

      if (month > 0) {
        const formatted = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
        return this.validateBirthdayFormat(formatted) ? formatted : null
      }
    }

    return null
  }

  /**
   * Regenerate all birthday reminders for contacts with birthdays
   */
  static async regenerateAllBirthdayReminders(contacts: Contact[]): Promise<{
    processed: number
    created: number
    errors: number
  }> {
    const results = {
      processed: 0,
      created: 0,
      errors: 0
    }

    const contactsWithBirthdays = contacts.filter(contact => 
      contact.birthday && !contact.reminders_paused
    )

    for (const contact of contactsWithBirthdays) {
      results.processed++
      
      try {
        await this.generateBirthdayReminders(contact)
        results.created += 2 // Each contact gets 2 reminders (week before + day of)
      } catch (error) {
        results.errors++
        console.error(`Failed to generate birthday reminders for ${contact.first_name}:`, error)
      }
    }

    return results
  }

  /**
   * Get birthday reminders that need to be sent today
   */
  static async getTodaysBirthdayReminders(): Promise<any[]> {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)

    return ReminderService.getAll({
      scheduledFrom: startOfDay,
      scheduledTo: endOfDay,
      status: 'pending'
    }).then(reminders => 
      reminders.filter(reminder => 
        reminder.type === 'birthday_week' || reminder.type === 'birthday_day'
      )
    )
  }

  /**
   * Check if a contact needs birthday reminder generation
   */
  static async needsBirthdayReminderGeneration(contact: Contact): Promise<boolean> {
    if (!contact.birthday || contact.reminders_paused) {
      return false
    }

    // Check if there are existing pending birthday reminders
    const existingReminders = await ReminderService.getPendingBirthdayReminders(contact.id)
    
    // If no pending birthday reminders exist, need to generate them
    return existingReminders.length === 0
  }
}