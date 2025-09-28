import { supabase, TABLES } from '@/lib/supabase'
import { Contact, Reminder } from '@/types/database'
import { ReminderCalculatorService } from './ReminderCalculatorService'
import { ContactService } from './ContactService'
import { ReminderService } from './ReminderService'

export class AutomatedReminderService {
  /**
   * Generate reminders for all contacts that need them
   * This should be run periodically to ensure upcoming reminders are created
   */
  static async generateUpcomingReminders(): Promise<{ created: number; skipped: number }> {
    const contacts = await ContactService.getAll()
    let created = 0
    let skipped = 0

    for (const contact of contacts) {
      try {
        const reminderCreated = await this.generateReminderForContact(contact)
        if (reminderCreated) {
          created++
        } else {
          skipped++
        }
      } catch (error) {
        console.error(`Failed to generate reminder for contact ${contact.id}:`, error)
        skipped++
      }
    }

    return { created, skipped }
  }

  /**
   * Generate a reminder for a specific contact if needed
   */
  static async generateReminderForContact(contact: Contact): Promise<boolean> {
    // Skip if no communication frequency or reminders are paused
    if (!contact.communication_frequency || contact.reminders_paused) {
      return false
    }

    // Calculate when the next reminder should be scheduled
    const nextReminderDate = ReminderCalculatorService.calculateNextReminderDate(
      contact.communication_frequency,
      contact.last_contacted_at
    )

    // Check if we already have a pending OR recently dismissed reminder for this contact around this date
    const existingReminders = await ReminderService.getByContactId(contact.id, {
      status: ['pending', 'dismissed'] // Check both pending and dismissed
    })

    const hasRecentReminder = existingReminders.some(reminder => {
      const reminderDate = new Date(reminder.scheduled_for)
      const daysDiff = Math.abs(
        (reminderDate.getTime() - nextReminderDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      // Don't create new reminders if there's one within 2 days (pending or recently dismissed)
      return daysDiff <= 2
    })

    if (hasRecentReminder) {
      return false // Reminder already exists or was recently dismissed
    }

    // Only create reminders that are due within the next 7 days
    const now = new Date()
    const daysUntilReminder = Math.ceil(
      (nextReminderDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysUntilReminder > 7 || daysUntilReminder < 0) {
      return false // Too far in future or overdue (overdue handled separately)
    }

    // Create the reminder
    const message = ReminderCalculatorService.generateReminderMessage(contact)

    try {
      await ReminderService.create({
        contact_id: contact.id,
        type: 'communication',
        scheduled_for: nextReminderDate.toISOString(),
        message: message
      })
      return true
    } catch (error) {
      console.error('Failed to create reminder:', error)
      return false
    }
  }

  /**
   * Get upcoming reminders for the next N days
   */
  static async getUpcomingReminders(days: number = 7): Promise<Array<Reminder & { contact?: Contact }>> {
    const now = new Date()
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

    const { data: reminders, error } = await supabase
      .from(TABLES.REMINDERS)
      .select(`
        *,
        contact:personal_contacts(*)
      `)
      .eq('status', 'pending')
      .gte('scheduled_for', now.toISOString())
      .lte('scheduled_for', futureDate.toISOString())
      .order('scheduled_for', { ascending: true })

    if (error) {
      throw new Error(`Failed to get upcoming reminders: ${error.message}`)
    }

    return (reminders || []).map(reminder => ({
      ...reminder,
      contact: reminder.contact
    }))
  }

  /**
   * Clean up old dismissed reminders to keep database tidy
   */
  static async cleanupOldReminders(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const { data, error } = await supabase
      .from(TABLES.REMINDERS)
      .delete()
      .in('status', ['dismissed', 'sent'])
      .lt('scheduled_for', cutoffDate.toISOString())
      .select('id')

    if (error) {
      throw new Error(`Failed to cleanup old reminders: ${error.message}`)
    }

    return Array.isArray(data) ? data.length : 0
  }

  /**
   * Force refresh all reminders for all contacts
   * This can be used for maintenance or when reminder logic changes
   */
  static async refreshAllReminders(): Promise<{
    deleted: number;
    created: number;
    contacts: number
  }> {
    // Delete all pending communication reminders
    const { data: deletedData, error: deleteError } = await supabase
      .from(TABLES.REMINDERS)
      .delete()
      .eq('status', 'pending')
      .eq('type', 'communication')
      .select('id')

    if (deleteError) {
      throw new Error(`Failed to delete existing reminders: ${deleteError.message}`)
    }

    const deleted = Array.isArray(deletedData) ? deletedData.length : 0

    // Regenerate all reminders
    const { created, skipped } = await this.generateUpcomingReminders()

    return {
      deleted,
      created,
      contacts: created + skipped
    }
  }

  /**
   * Get reminder statistics
   */
  static async getReminderStats(): Promise<{
    pending: number
    overdue: number
    scheduled: number
    byFrequency: Record<string, number>
  }> {
    const now = new Date()

    const { data: reminders, error } = await supabase
      .from(TABLES.REMINDERS)
      .select(`
        *,
        contact:personal_contacts(communication_frequency)
      `)
      .eq('status', 'pending')
      .eq('type', 'communication')

    if (error) {
      throw new Error(`Failed to get reminder stats: ${error.message}`)
    }

    const pending = reminders?.length || 0
    const overdue = reminders?.filter(r => new Date(r.scheduled_for) < now).length || 0
    const scheduled = pending - overdue

    const byFrequency: Record<string, number> = {
      weekly: 0,
      monthly: 0,
      quarterly: 0,
      biannually: 0,
      annually: 0
    }

    reminders?.forEach(reminder => {
      const frequency = reminder.contact?.communication_frequency
      if (frequency && byFrequency.hasOwnProperty(frequency)) {
        byFrequency[frequency]++
      }
    })

    return {
      pending,
      overdue,
      scheduled,
      byFrequency
    }
  }
}