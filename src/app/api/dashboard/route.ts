import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { DashboardService } from '@/services/DashboardService'
import { ContactService } from '@/services/ContactService'
import { InteractionService } from '@/services/InteractionService'
import { ReminderService } from '@/services/ReminderService'
import { ReminderCalculatorService } from '@/services/ReminderCalculatorService'
import { AutomatedReminderService } from '@/services/AutomatedReminderService'
import { PersonalTaskService } from '@/services/PersonalTaskService'

export async function GET(request: NextRequest) {
  try {
    // Generate upcoming reminders for contacts that need them
    await AutomatedReminderService.generateUpcomingReminders()

    // Get basic data
    const [contacts, upcomingReminders, importantTasks] = await Promise.all([
      ContactService.getAll(),
      AutomatedReminderService.getUpcomingReminders(7),
      PersonalTaskService.getImportantTasks()
    ])

    // Get recent interactions with contact information
    const { data: interactions, error: interactionsError } = await supabase
      .from('personal_interactions')
      .select(`
        *,
        contact:personal_contacts(first_name, last_name, nickname)
      `)
      .order('interaction_date', { ascending: false })
      .limit(10)

    if (interactionsError) {
      throw new Error(`Failed to get interactions: ${interactionsError.message}`)
    }

    // Calculate basic stats
    const now = new Date()
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const upcomingBirthdays = contacts.filter(contact => {
      if (!contact.birthday) return false
      const [month, day] = contact.birthday.split('-').map(Number)
      const thisYear = new Date(now.getFullYear(), month - 1, day)
      const nextYear = new Date(now.getFullYear() + 1, month - 1, day)
      const birthdayDate = thisYear >= now ? thisYear : nextYear
      return birthdayDate <= nextWeek
    })

    // Calculate overdue contacts using ReminderCalculatorService
    const overdueContacts = contacts.filter(contact =>
      ReminderCalculatorService.needsCommunicationReminder(contact)
    )

    // Format response to match Dashboard component expectations
    const dashboardData = {
      stats: {
        totalContacts: contacts.length,
        contactsWithReminders: contacts.filter(c => c.communication_frequency && !c.reminders_paused).length,
        overdueReminders: overdueContacts.length,
        upcomingBirthdays: upcomingBirthdays.length
      },
      upcomingReminders: upcomingReminders,
      recentInteractions: interactions || [],
      upcomingBirthdays: upcomingBirthdays,
      overdueContacts: overdueContacts,
      importantTasks: importantTasks
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}