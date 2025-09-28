import { Contact } from '@/types/database'

export type CommunicationFrequency = 'weekly' | 'monthly' | 'quarterly' | 'biannually' | 'annually'

export class ReminderCalculatorService {
  // Frequency intervals in days
  private static readonly FREQUENCY_DAYS: Record<CommunicationFrequency, number> = {
    weekly: 7,
    monthly: 30,
    quarterly: 90,
    biannually: 180,
    annually: 365
  }

  /**
   * Calculate the next reminder date based on communication frequency and last contact date
   */
  static calculateNextReminderDate(
    communicationFrequency: CommunicationFrequency,
    lastContactedAt?: Date | string | null
  ): Date {
    const baseDate = lastContactedAt ? new Date(lastContactedAt) : new Date()
    const daysToAdd = this.FREQUENCY_DAYS[communicationFrequency]
    
    const nextReminderDate = new Date(baseDate)
    nextReminderDate.setDate(nextReminderDate.getDate() + daysToAdd)
    
    return nextReminderDate
  }

  /**
   * Calculate multiple future reminder dates
   */
  static calculateMultipleReminderDates(
    communicationFrequency: CommunicationFrequency,
    lastContactedAt?: Date | string | null,
    count: number = 5
  ): Date[] {
    const dates: Date[] = []
    let currentDate = lastContactedAt ? new Date(lastContactedAt) : new Date()
    const daysToAdd = this.FREQUENCY_DAYS[communicationFrequency]
    
    for (let i = 0; i < count; i++) {
      currentDate = new Date(currentDate)
      currentDate.setDate(currentDate.getDate() + daysToAdd)
      dates.push(new Date(currentDate))
    }
    
    return dates
  }

  /**
   * Check if a contact needs a communication reminder
   */
  static needsCommunicationReminder(contact: Contact): boolean {
    if (!contact.communication_frequency || contact.reminders_paused) {
      return false
    }

    if (!contact.last_contacted_at) {
      // If never contacted, they need a reminder
      return true
    }

    const lastContacted = new Date(contact.last_contacted_at)
    const now = new Date()
    const daysSinceContact = Math.floor((now.getTime() - lastContacted.getTime()) / (1000 * 60 * 60 * 24))
    
    return daysSinceContact >= this.FREQUENCY_DAYS[contact.communication_frequency]
  }

  /**
   * Calculate days until next reminder is due
   */
  static daysUntilNextReminder(
    communicationFrequency: CommunicationFrequency,
    lastContactedAt?: Date | string | null
  ): number {
    const nextReminderDate = this.calculateNextReminderDate(communicationFrequency, lastContactedAt)
    const now = new Date()
    
    const diffTime = nextReminderDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  }

  /**
   * Calculate days overdue for a reminder
   */
  static daysOverdue(
    communicationFrequency: CommunicationFrequency,
    lastContactedAt?: Date | string | null
  ): number {
    const daysUntil = this.daysUntilNextReminder(communicationFrequency, lastContactedAt)
    return daysUntil < 0 ? Math.abs(daysUntil) : 0
  }

  /**
   * Generate reminder message based on frequency and contact info
   */
  static generateReminderMessage(
    contact: Contact,
    daysOverdue?: number
  ): string {
    const firstName = contact.first_name
    const frequency = contact.communication_frequency
    
    if (!frequency) {
      return `Reminder to contact ${firstName}`
    }

    const frequencyText = this.getFrequencyDisplayText(frequency)
    
    if (daysOverdue && daysOverdue > 0) {
      return `Time to reach out to ${firstName}! It's been ${daysOverdue} days past your ${frequencyText} reminder.`
    }
    
    return `Time for your ${frequencyText} check-in with ${firstName}!`
  }

  /**
   * Get display text for frequency
   */
  static getFrequencyDisplayText(frequency: CommunicationFrequency): string {
    const displayTexts: Record<CommunicationFrequency, string> = {
      weekly: 'weekly',
      monthly: 'monthly',
      quarterly: 'quarterly',
      biannually: 'bi-annual',
      annually: 'annual'
    }
    
    return displayTexts[frequency]
  }

  /**
   * Calculate reminder priority based on how overdue it is
   */
  static calculateReminderPriority(
    communicationFrequency: CommunicationFrequency,
    lastContactedAt?: Date | string | null
  ): 'low' | 'medium' | 'high' | 'urgent' {
    const daysOverdue = this.daysOverdue(communicationFrequency, lastContactedAt)
    
    if (daysOverdue === 0) {
      return 'low'
    }
    
    const frequencyDays = this.FREQUENCY_DAYS[communicationFrequency]
    const overdueRatio = daysOverdue / frequencyDays
    
    if (overdueRatio >= 2) {
      return 'urgent'
    } else if (overdueRatio >= 1) {
      return 'high'
    } else if (overdueRatio >= 0.5) {
      return 'medium'
    } else {
      return 'low'
    }
  }

  /**
   * Calculate all upcoming reminder dates for a contact
   */
  static calculateUpcomingReminders(contact: Contact, monthsAhead: number = 12): Date[] {
    if (!contact.communication_frequency || contact.reminders_paused) {
      return []
    }

    const reminders: Date[] = []
    const daysToAdd = this.FREQUENCY_DAYS[contact.communication_frequency]
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + monthsAhead)
    
    const currentDate = contact.last_contacted_at
      ? new Date(contact.last_contacted_at)
      : new Date()
    
    // Start from the next reminder date
    currentDate.setDate(currentDate.getDate() + daysToAdd)
    
    while (currentDate <= endDate) {
      reminders.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + daysToAdd)
    }
    
    return reminders
  }

  /**
   * Calculate ideal contact schedule based on frequency
   */
  static calculateContactSchedule(
    communicationFrequency: CommunicationFrequency,
    startDate?: Date
  ): {
    frequency: CommunicationFrequency
    intervalDays: number
    nextContactDate: Date
    contactsPerYear: number
  } {
    const intervalDays = this.FREQUENCY_DAYS[communicationFrequency]
    const baseDate = startDate || new Date()
    const nextContactDate = new Date(baseDate)
    nextContactDate.setDate(nextContactDate.getDate() + intervalDays)
    
    const contactsPerYear = Math.floor(365 / intervalDays)
    
    return {
      frequency: communicationFrequency,
      intervalDays,
      nextContactDate,
      contactsPerYear
    }
  }

  /**
   * Suggest optimal communication frequency based on interaction history
   */
  static suggestOptimalFrequency(interactionDates: Date[]): {
    suggested: CommunicationFrequency
    confidence: number
    reasoning: string
  } {
    if (interactionDates.length < 2) {
      return {
        suggested: 'monthly',
        confidence: 0.3,
        reasoning: 'Insufficient interaction history. Monthly is a good default starting point.'
      }
    }

    // Sort dates and calculate intervals
    const sortedDates = interactionDates.sort((a, b) => a.getTime() - b.getTime())
    const intervals: number[] = []
    
    for (let i = 1; i < sortedDates.length; i++) {
      const diffTime = sortedDates[i].getTime() - sortedDates[i - 1].getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      intervals.push(diffDays)
    }

    // Calculate average interval
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
    
    // Find closest frequency
    let closestFrequency: CommunicationFrequency = 'monthly'
    let smallestDiff = Infinity
    
    for (const [frequency, days] of Object.entries(this.FREQUENCY_DAYS)) {
      const diff = Math.abs(avgInterval - days)
      if (diff < smallestDiff) {
        smallestDiff = diff
        closestFrequency = frequency as CommunicationFrequency
      }
    }

    // Calculate confidence based on consistency of intervals
    const variance = intervals.reduce((sum, interval) => {
      return sum + Math.pow(interval - avgInterval, 2)
    }, 0) / intervals.length
    
    const standardDeviation = Math.sqrt(variance)
    const consistencyScore = Math.max(0, 1 - (standardDeviation / avgInterval))
    const confidence = Math.min(0.9, 0.5 + (consistencyScore * 0.4))

    return {
      suggested: closestFrequency,
      confidence: Math.round(confidence * 100) / 100,
      reasoning: `Based on ${intervals.length} interactions with an average of ${Math.round(avgInterval)} days between contacts.`
    }
  }

  /**
   * Check if current date is a good time to contact based on frequency
   */
  static isGoodTimeToContact(
    communicationFrequency: CommunicationFrequency,
    lastContactedAt?: Date | string | null,
    bufferDays: number = 2
  ): boolean {
    if (!lastContactedAt) {
      return true // Always good to contact if never contacted
    }

    const daysUntilNext = this.daysUntilNextReminder(communicationFrequency, lastContactedAt)
    return daysUntilNext <= bufferDays
  }

  /**
   * Get frequency options with descriptions
   */
  static getFrequencyOptions(): Array<{
    value: CommunicationFrequency
    label: string
    description: string
    days: number
    contactsPerYear: number
  }> {
    return [
      {
        value: 'weekly',
        label: 'Weekly',
        description: 'Every 7 days',
        days: 7,
        contactsPerYear: 52
      },
      {
        value: 'monthly',
        label: 'Monthly',
        description: 'Every 30 days',
        days: 30,
        contactsPerYear: 12
      },
      {
        value: 'quarterly',
        label: 'Quarterly',
        description: 'Every 90 days',
        days: 90,
        contactsPerYear: 4
      },
      {
        value: 'biannually',
        label: 'Bi-annually',
        description: 'Every 180 days',
        days: 180,
        contactsPerYear: 2
      },
      {
        value: 'annually',
        label: 'Annually',
        description: 'Every 365 days',
        days: 365,
        contactsPerYear: 1
      }
    ]
  }

  /**
   * Calculate workload for a set of contacts
   */
  static calculateCommunicationWorkload(contacts: Contact[]): {
    totalContactsPerWeek: number
    totalContactsPerMonth: number
    totalContactsPerYear: number
    byFrequency: Record<CommunicationFrequency, number>
  } {
    const byFrequency: Record<CommunicationFrequency, number> = {
      weekly: 0,
      monthly: 0,
      quarterly: 0,
      biannually: 0,
      annually: 0
    }

    contacts.forEach(contact => {
      if (contact.communication_frequency && !contact.reminders_paused) {
        byFrequency[contact.communication_frequency]++
      }
    })

    const totalContactsPerYear = 
      byFrequency.weekly * 52 +
      byFrequency.monthly * 12 +
      byFrequency.quarterly * 4 +
      byFrequency.biannually * 2 +
      byFrequency.annually * 1

    return {
      totalContactsPerWeek: Math.round(totalContactsPerYear / 52 * 100) / 100,
      totalContactsPerMonth: Math.round(totalContactsPerYear / 12 * 100) / 100,
      totalContactsPerYear,
      byFrequency
    }
  }
}