import { supabase, TABLES } from '@/lib/supabase'
import { Contact, Interaction, Reminder } from '@/types/database'
import { ContactService } from './ContactService'
import { InteractionService } from './InteractionService'
import { ReminderService } from './ReminderService'
import { BirthdayReminderService } from './BirthdayReminderService'
import { AutomatedReminderService } from './AutomatedReminderService'

export interface DashboardStats {
  contacts: {
    total: number
    withReminders: number
    withBirthdays: number
    remindersPaused: number
  }
  interactions: {
    total: number
    thisWeek: number
    thisMonth: number
    byType: Record<Interaction['type'], number>
  }
  reminders: {
    pending: number
    overdue: number
    dueToday: number
    dueThisWeek: number
    byType: Record<Reminder['type'], number>
  }
  birthdays: {
    today: number
    thisWeek: number
    thisMonth: number
    nextMonth: number
  }
  recentActivity: {
    recentInteractions: Interaction[]
    upcomingReminders: Reminder[]
    upcomingBirthdays: Array<{
      contact: Contact
      birthdayDate: Date
      daysUntil: number
    }>
  }
}

export interface ContactAnalytics {
  communicationTrends: {
    dailyInteractions: Array<{ date: string; count: number }>
    weeklyInteractions: Array<{ week: string; count: number }>
    monthlyInteractions: Array<{ month: string; count: number }>
  }
  reminderEffectiveness: {
    completionRate: number
    averageResponseTime: number
    overdueRate: number
  }
  contactGrowth: {
    newContactsThisMonth: number
    newContactsLastMonth: number
    totalGrowthRate: number
  }
}

export class DashboardService {
  /**
   * Get comprehensive dashboard statistics
   */
  static async getDashboardStats(): Promise<DashboardStats> {
    // Generate missing reminders (run in background to avoid blocking dashboard load)
    AutomatedReminderService.generateUpcomingReminders().catch(error => {
      console.warn('Background reminder generation failed:', error)
    })

    // Fetch all required data in parallel
    const [
      contacts,
      allInteractions,
      allReminders
    ] = await Promise.all([
      ContactService.getAll(),
      InteractionService.getAll({ limit: 1000 }),
      ReminderService.getAll({ limit: 1000 })
    ])

    const now = new Date()
    const startOfWeek = this.getStartOfWeek(now)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
    const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000)

    // Contact statistics
    const contactStats = {
      total: contacts.length,
      withReminders: contacts.filter(c => c.communication_frequency && !c.reminders_paused).length,
      withBirthdays: contacts.filter(c => c.birthday).length,
      remindersPaused: contacts.filter(c => c.reminders_paused).length
    }

    // Interaction statistics
    const interactionsThisWeek = allInteractions.filter(i => 
      new Date(i.interaction_date) >= startOfWeek && new Date(i.interaction_date) < endOfWeek
    )
    const interactionsThisMonth = allInteractions.filter(i => 
      new Date(i.interaction_date) >= startOfMonth
    )

    const interactionsByType: Record<Interaction['type'], number> = {
      call: 0,
      text: 0,
      email: 0,
      meetup: 0,
      other: 0
    }
    allInteractions.forEach(interaction => {
      interactionsByType[interaction.type]++
    })

    const interactionStats = {
      total: allInteractions.length,
      thisWeek: interactionsThisWeek.length,
      thisMonth: interactionsThisMonth.length,
      byType: interactionsByType
    }

    // Reminder statistics
    const pendingReminders = allReminders.filter(r => r.status === 'pending')
    const overdueReminders = pendingReminders.filter(r => 
      new Date(r.scheduled_for) < now
    )
    const dueTodayReminders = pendingReminders.filter(r => {
      const scheduledDate = new Date(r.scheduled_for)
      return scheduledDate >= startOfToday && scheduledDate <= endOfToday
    })
    const dueThisWeekReminders = pendingReminders.filter(r => {
      const scheduledDate = new Date(r.scheduled_for)
      return scheduledDate >= startOfWeek && scheduledDate < endOfWeek
    })

    const remindersByType: Record<Reminder['type'], number> = {
      communication: 0,
      birthday_week: 0,
      birthday_day: 0
    }
    allReminders.forEach(reminder => {
      remindersByType[reminder.type]++
    })

    const reminderStats = {
      pending: pendingReminders.length,
      overdue: overdueReminders.length,
      dueToday: dueTodayReminders.length,
      dueThisWeek: dueThisWeekReminders.length,
      byType: remindersByType
    }

    // Birthday statistics
    const todaysBirthdays = BirthdayReminderService.getTodaysBirthdays(contacts)
    const upcomingBirthdays = BirthdayReminderService.getUpcomingBirthdays(contacts, 30)
    const birthdaysThisWeek = upcomingBirthdays.filter(b => b.daysUntil <= 7)
    const birthdaysThisMonth = upcomingBirthdays.filter(b => b.daysUntil <= 30)
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0)
    const birthdaysNextMonth = BirthdayReminderService.getUpcomingBirthdays(contacts, 60)
      .filter(b => {
        const birthDate = b.birthdayDate
        return birthDate >= nextMonth && birthDate <= endOfNextMonth
      })

    const birthdayStats = {
      today: todaysBirthdays.length,
      thisWeek: birthdaysThisWeek.length,
      thisMonth: birthdaysThisMonth.length,
      nextMonth: birthdaysNextMonth.length
    }

    // Recent activity
    const recentInteractions = allInteractions
      .sort((a, b) => new Date(b.interaction_date).getTime() - new Date(a.interaction_date).getTime())
      .slice(0, 10)

    const upcomingReminders = pendingReminders
      .sort((a, b) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime())
      .slice(0, 10)

    const upcomingBirthdaysList = upcomingBirthdays.slice(0, 5)

    const recentActivity = {
      recentInteractions,
      upcomingReminders,
      upcomingBirthdays: upcomingBirthdaysList
    }

    return {
      contacts: contactStats,
      interactions: interactionStats,
      reminders: reminderStats,
      birthdays: birthdayStats,
      recentActivity
    }
  }

  /**
   * Get contact analytics and trends
   */
  static async getContactAnalytics(): Promise<ContactAnalytics> {
    const [contacts, interactions] = await Promise.all([
      ContactService.getAll(),
      InteractionService.getAll({ limit: 2000 })
    ])

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    // Communication trends
    const communicationTrends = this.calculateCommunicationTrends(interactions)

    // Reminder effectiveness (would need reminder completion tracking)
    const reminderEffectiveness = await this.calculateReminderEffectiveness()

    // Contact growth
    const newContactsThisMonth = contacts.filter(c => 
      new Date(c.created_at) >= new Date(now.getFullYear(), now.getMonth(), 1)
    ).length

    const newContactsLastMonth = contacts.filter(c => {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const createdAt = new Date(c.created_at)
      return createdAt >= lastMonth && createdAt < thisMonth
    }).length

    const totalGrowthRate = newContactsLastMonth === 0 ? 100 : 
      ((newContactsThisMonth - newContactsLastMonth) / newContactsLastMonth) * 100

    const contactGrowth = {
      newContactsThisMonth,
      newContactsLastMonth,
      totalGrowthRate: Math.round(totalGrowthRate * 100) / 100
    }

    return {
      communicationTrends,
      reminderEffectiveness,
      contactGrowth
    }
  }

  /**
   * Get contact activity summary for a specific contact
   */
  static async getContactActivitySummary(contactId: string): Promise<{
    contact: Contact | null
    totalInteractions: number
    lastInteraction?: Interaction
    interactionsByType: Record<Interaction['type'], number>
    pendingReminders: number
    nextReminder?: Reminder
    daysSinceLastContact?: number
    averageDaysBetweenContacts?: number
  }> {
    const [contact, interactions, reminders] = await Promise.all([
      ContactService.getById(contactId),
      InteractionService.getByContactId(contactId),
      ReminderService.getByContactId(contactId, { status: 'pending' })
    ])

    if (!contact) {
      return {
        contact: null,
        totalInteractions: 0,
        interactionsByType: { call: 0, text: 0, email: 0, meetup: 0, other: 0 },
        pendingReminders: 0
      }
    }

    const interactionsByType: Record<Interaction['type'], number> = {
      call: 0,
      text: 0,
      email: 0,
      meetup: 0,
      other: 0
    }

    interactions.forEach(interaction => {
      interactionsByType[interaction.type]++
    })

    const lastInteraction = interactions.length > 0 ? interactions[0] : undefined
    const nextReminder = reminders.length > 0 ? 
      reminders.sort((a, b) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime())[0] 
      : undefined

    let daysSinceLastContact: number | undefined
    let averageDaysBetweenContacts: number | undefined

    if (contact.last_contacted_at) {
      const daysSince = Math.floor(
        (new Date().getTime() - new Date(contact.last_contacted_at).getTime()) / (1000 * 60 * 60 * 24)
      )
      daysSinceLastContact = daysSince
    }

    if (interactions.length > 1) {
      const dates = interactions.map(i => new Date(i.interaction_date)).sort((a, b) => a.getTime() - b.getTime())
      const intervals: number[] = []
      
      for (let i = 1; i < dates.length; i++) {
        const days = Math.floor((dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24))
        intervals.push(days)
      }
      
      averageDaysBetweenContacts = Math.round(intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length)
    }

    return {
      contact,
      totalInteractions: interactions.length,
      lastInteraction,
      interactionsByType,
      pendingReminders: reminders.length,
      nextReminder,
      daysSinceLastContact,
      averageDaysBetweenContacts
    }
  }

  /**
   * Get contacts that need attention (overdue reminders, no recent contact, etc.)
   */
  static async getContactsNeedingAttention(): Promise<{
    overdueReminders: Array<{ contact: Contact; reminder: Reminder; daysOverdue: number }>
    neverContacted: Contact[]
    longTimeNoContact: Array<{ contact: Contact; daysSinceContact: number }>
    missingBirthdays: Contact[]
    missingContactInfo: Contact[]
  }> {
    const [contacts, reminders] = await Promise.all([
      ContactService.getAll(),
      ReminderService.getAll({ status: 'pending' })
    ])

    const now = new Date()
    
    // Overdue reminders
    const overdueReminders = reminders
      .filter(r => new Date(r.scheduled_for) < now)
      .map(reminder => {
        const contact = contacts.find(c => c.id === reminder.contact_id)!
        const daysOverdue = Math.floor((now.getTime() - new Date(reminder.scheduled_for).getTime()) / (1000 * 60 * 60 * 24))
        return { contact, reminder, daysOverdue }
      })
      .sort((a, b) => b.daysOverdue - a.daysOverdue)

    // Never contacted
    const neverContacted = contacts.filter(c => !c.last_contacted_at)

    // Long time no contact (more than 6 months for contacts with frequencies)
    const longTimeNoContact = contacts
      .filter(c => c.last_contacted_at && c.communication_frequency && !c.reminders_paused)
      .map(contact => {
        const daysSinceContact = Math.floor(
          (now.getTime() - new Date(contact.last_contacted_at!).getTime()) / (1000 * 60 * 60 * 24)
        )
        return { contact, daysSinceContact }
      })
      .filter(item => item.daysSinceContact > 180)
      .sort((a, b) => b.daysSinceContact - a.daysSinceContact)

    // Missing birthdays
    const missingBirthdays = contacts.filter(c => !c.birthday)

    // Missing contact info (would need to check ContactInfo table)
    const missingContactInfo: Contact[] = [] // Placeholder - would need ContactInfo integration

    return {
      overdueReminders,
      neverContacted,
      longTimeNoContact,
      missingBirthdays,
      missingContactInfo
    }
  }

  /**
   * Calculate communication trends over time
   */
  private static calculateCommunicationTrends(interactions: Interaction[]): {
    dailyInteractions: Array<{ date: string; count: number }>
    weeklyInteractions: Array<{ week: string; count: number }>
    monthlyInteractions: Array<{ month: string; count: number }>
  } {
    const now = new Date()
    
    // Daily interactions for last 30 days
    const dailyInteractions: Array<{ date: string; count: number }> = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      const count = interactions.filter(int => 
        int.interaction_date.startsWith(dateStr)
      ).length
      dailyInteractions.push({ date: dateStr, count })
    }

    // Weekly interactions for last 12 weeks
    const weeklyInteractions: Array<{ week: string; count: number }> = []
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
      const weekStr = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`
      const count = interactions.filter(int => {
        const intDate = new Date(int.interaction_date)
        return intDate >= weekStart && intDate < weekEnd
      }).length
      weeklyInteractions.push({ week: weekStr, count })
    }

    // Monthly interactions for last 12 months
    const monthlyInteractions: Array<{ month: string; count: number }> = []
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      const monthStr = monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      const count = interactions.filter(int => {
        const intDate = new Date(int.interaction_date)
        return intDate >= monthStart && intDate <= monthEnd
      }).length
      monthlyInteractions.push({ month: monthStr, count })
    }

    return {
      dailyInteractions,
      weeklyInteractions,
      monthlyInteractions
    }
  }

  /**
   * Calculate reminder effectiveness metrics
   */
  private static async calculateReminderEffectiveness(): Promise<{
    completionRate: number
    averageResponseTime: number
    overdueRate: number
  }> {
    const reminders = await ReminderService.getAll()
    
    const totalReminders = reminders.length
    const sentReminders = reminders.filter(r => r.status === 'sent').length
    const dismissedReminders = reminders.filter(r => r.status === 'dismissed').length
    const completedReminders = sentReminders + dismissedReminders
    
    const completionRate = totalReminders === 0 ? 0 : (completedReminders / totalReminders) * 100

    // Calculate average response time for sent reminders
    const sentRemindersWithTimes = reminders.filter(r => r.status === 'sent' && r.sent_at)
    const responseTimes = sentRemindersWithTimes.map(r => {
      const scheduled = new Date(r.scheduled_for)
      const sent = new Date(r.sent_at!)
      return Math.max(0, Math.floor((sent.getTime() - scheduled.getTime()) / (1000 * 60 * 60 * 24)))
    })
    
    const averageResponseTime = responseTimes.length === 0 ? 0 : 
      Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length)

    const pendingReminders = reminders.filter(r => r.status === 'pending')
    const overdueReminders = pendingReminders.filter(r => new Date(r.scheduled_for) < new Date())
    const overdueRate = pendingReminders.length === 0 ? 0 : (overdueReminders.length / pendingReminders.length) * 100

    return {
      completionRate: Math.round(completionRate * 100) / 100,
      averageResponseTime,
      overdueRate: Math.round(overdueRate * 100) / 100
    }
  }

  /**
   * Get start of week (Monday) for a given date
   */
  private static getStartOfWeek(date: Date): Date {
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    return new Date(date.setDate(diff))
  }

  /**
   * Get summary statistics for quick overview
   */
  static async getQuickStats(): Promise<{
    totalContacts: number
    pendingReminders: number
    overdueReminders: number
    interactionsThisWeek: number
    birthdaysThisWeek: number
  }> {
    const [contactCount, reminderStats, weeklyInteractions, contacts] = await Promise.all([
      ContactService.getCount(),
      ReminderService.getTotalCount({ status: 'pending' }),
      this.getWeeklyInteractionCount(),
      ContactService.getAll()
    ])

    const now = new Date()
    const pendingReminders = await ReminderService.getAll({ status: 'pending' })
    const overdueReminders = pendingReminders.filter(r => new Date(r.scheduled_for) < now).length
    const birthdaysThisWeek = BirthdayReminderService.getUpcomingBirthdays(contacts, 7).length

    return {
      totalContacts: contactCount,
      pendingReminders: reminderStats,
      overdueReminders,
      interactionsThisWeek: weeklyInteractions,
      birthdaysThisWeek
    }
  }

  /**
   * Get interaction count for current week
   */
  private static async getWeeklyInteractionCount(): Promise<number> {
    const now = new Date()
    const startOfWeek = this.getStartOfWeek(new Date())
    const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000)

    return InteractionService.getTotalCount({
      dateFrom: startOfWeek,
      dateTo: endOfWeek
    })
  }
}