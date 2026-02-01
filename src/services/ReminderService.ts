import { supabase, TABLES } from '@/lib/supabase'
import { Reminder } from '@/types/database'

export type CreateReminderInput = {
  contact_id: string
  type: 'communication' | 'birthday_week' | 'birthday_day'
  scheduled_for: string
  message: string
}

export type UpdateReminderInput = Partial<{
  scheduled_for: string
  message: string
  status: 'pending' | 'sent' | 'dismissed'
  sent_at: string | null
}>

export class ReminderService {
  /**
   * Create a new reminder
   */
  static async create(input: CreateReminderInput): Promise<Reminder> {
    // Validate scheduled_for is in the future for pending reminders
    const scheduledFor = new Date(input.scheduled_for)
    const now = new Date()
    
    if (scheduledFor <= now) {
      throw new Error('Scheduled date must be in the future for new reminders')
    }

    // Validate message length
    if (!input.message || input.message.trim().length === 0) {
      throw new Error('Message is required and cannot be empty')
    }

    if (input.message.length > 200) {
      throw new Error('Message cannot exceed 200 characters')
    }

    const { data, error } = await supabase
      .from(TABLES.REMINDERS)
      .insert({
        ...input,
        message: input.message.trim(),
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create reminder: ${error.message}`)
    }

    return data
  }

  /**
   * Get reminder by ID
   */
  static async getById(id: string): Promise<Reminder | null> {
    const { data, error } = await supabase
      .from(TABLES.REMINDERS)
      .select()
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // No rows returned
      }
      throw new Error(`Failed to get reminder: ${error.message}`)
    }

    return data
  }

  /**
   * Get all reminders for a contact
   */
  static async getByContactId(
    contactId: string,
    options?: {
      type?: Reminder['type']
      status?: Reminder['status'] | Reminder['status'][]
      sortBy?: 'scheduled_for' | 'created_at'
      sortOrder?: 'asc' | 'desc'
      limit?: number
      offset?: number
    }
  ): Promise<Reminder[]> {
    let query = supabase
      .from(TABLES.REMINDERS)
      .select()
      .eq('contact_id', contactId)

    // Apply filters
    if (options?.type) {
      query = query.eq('type', options.type)
    }

    if (options?.status) {
      if (Array.isArray(options.status)) {
        query = query.in('status', options.status)
      } else {
        query = query.eq('status', options.status)
      }
    }

    // Apply sorting
    const sortBy = options?.sortBy || 'scheduled_for'
    const sortOrder = options?.sortOrder || 'asc'
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit)
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to get reminders: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get pending reminders that are due (scheduled_for <= now)
   */
  static async getDueReminders(): Promise<Reminder[]> {
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from(TABLES.REMINDERS)
      .select()
      .eq('status', 'pending')
      .lte('scheduled_for', now)
      .order('scheduled_for', { ascending: true })

    if (error) {
      throw new Error(`Failed to get due reminders: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get upcoming reminders within the next N days
   */
  static async getUpcomingReminders(daysAhead: number = 7): Promise<Reminder[]> {
    const now = new Date()
    const futureDate = new Date(now.getTime() + (daysAhead * 24 * 60 * 60 * 1000))

    const { data, error } = await supabase
      .from(TABLES.REMINDERS)
      .select()
      .eq('status', 'pending')
      .gte('scheduled_for', now.toISOString())
      .lte('scheduled_for', futureDate.toISOString())
      .order('scheduled_for', { ascending: true })

    if (error) {
      throw new Error(`Failed to get upcoming reminders: ${error.message}`)
    }

    return data || []
  }

  /**
   * Update reminder by ID
   */
  static async update(id: string, input: UpdateReminderInput): Promise<Reminder> {
    // Validate scheduled_for if provided
    if (input.scheduled_for) {
      const scheduledFor = new Date(input.scheduled_for)
      const now = new Date()
      
      if (scheduledFor <= now && input.status === 'pending') {
        throw new Error('Scheduled date must be in the future for pending reminders')
      }
    }

    // Validate message if provided
    if (input.message !== undefined) {
      if (!input.message || input.message.trim().length === 0) {
        throw new Error('Message is required and cannot be empty')
      }

      if (input.message.length > 200) {
        throw new Error('Message cannot exceed 200 characters')
      }
    }

    const updateData = { ...input }
    if (updateData.message) {
      updateData.message = updateData.message.trim()
    }

    const { data, error } = await supabase
      .from(TABLES.REMINDERS)
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update reminder: ${error.message}`)
    }

    return data
  }

  /**
   * Mark reminder as sent
   */
  static async markAsSent(id: string): Promise<Reminder> {
    return this.update(id, {
      status: 'sent',
      sent_at: new Date().toISOString()
    })
  }

  /**
   * Mark reminder as dismissed
   */
  static async markAsDismissed(id: string): Promise<Reminder> {
    return this.update(id, {
      status: 'dismissed'
    })
  }

  /**
   * Dismiss a reminder by setting status to 'dismissed'
   * Note: This does NOT update the contact's last_contacted_at - that should be done
   * separately by the caller if the contact was actually contacted
   */
  static async dismiss(id: string): Promise<Reminder> {
    // Update the reminder status
    const { data, error } = await supabase
      .from(TABLES.REMINDERS)
      .update({
        status: 'dismissed',
        sent_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to dismiss reminder: ${error.message}`)
    }

    return data
  }

  /**
   * Delete reminder by ID
   */
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.REMINDERS)
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete reminder: ${error.message}`)
    }
  }

  /**
   * Get all reminders with optional filtering
   */
  static async getAll(options?: {
    type?: Reminder['type']
    status?: Reminder['status']
    scheduledFrom?: Date
    scheduledTo?: Date
    sortBy?: 'scheduled_for' | 'created_at'
    sortOrder?: 'asc' | 'desc'
    limit?: number
    offset?: number
  }): Promise<Reminder[]> {
    let query = supabase.from(TABLES.REMINDERS).select()

    // Apply filters
    if (options?.type) {
      query = query.eq('type', options.type)
    }

    if (options?.status) {
      query = query.eq('status', options.status)
    }

    if (options?.scheduledFrom) {
      query = query.gte('scheduled_for', options.scheduledFrom.toISOString())
    }

    if (options?.scheduledTo) {
      query = query.lte('scheduled_for', options.scheduledTo.toISOString())
    }

    // Apply sorting
    const sortBy = options?.sortBy || 'scheduled_for'
    const sortOrder = options?.sortOrder || 'asc'
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit)
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to get reminders: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get reminder count for a contact
   */
  static async getCountByContactId(contactId: string, status?: Reminder['status']): Promise<number> {
    let query = supabase
      .from(TABLES.REMINDERS)
      .select('*', { count: 'exact', head: true })
      .eq('contact_id', contactId)

    if (status) {
      query = query.eq('status', status)
    }

    const { count, error } = await query

    if (error) {
      throw new Error(`Failed to get reminder count: ${error.message}`)
    }

    return count || 0
  }

  /**
   * Get total reminder count
   */
  static async getTotalCount(filters?: {
    type?: Reminder['type']
    status?: Reminder['status']
  }): Promise<number> {
    let query = supabase.from(TABLES.REMINDERS).select('*', { count: 'exact', head: true })

    if (filters?.type) {
      query = query.eq('type', filters.type)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    const { count, error } = await query

    if (error) {
      throw new Error(`Failed to get total reminder count: ${error.message}`)
    }

    return count || 0
  }

  /**
   * Delete all reminders for a specific contact
   */
  static async deleteByContactId(contactId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.REMINDERS)
      .delete()
      .eq('contact_id', contactId)

    if (error) {
      throw new Error(`Failed to delete reminders for contact: ${error.message}`)
    }
  }

  /**
   * Get pending communication reminders for a contact
   */
  static async getPendingCommunicationReminders(contactId: string): Promise<Reminder[]> {
    return this.getByContactId(contactId, {
      type: 'communication',
      status: 'pending',
      sortBy: 'scheduled_for',
      sortOrder: 'asc'
    })
  }

  /**
   * Get pending birthday reminders for a contact
   */
  static async getPendingBirthdayReminders(contactId: string): Promise<Reminder[]> {
    const { data, error } = await supabase
      .from(TABLES.REMINDERS)
      .select()
      .eq('contact_id', contactId)
      .eq('status', 'pending')
      .in('type', ['birthday_week', 'birthday_day'])
      .order('scheduled_for', { ascending: true })

    if (error) {
      throw new Error(`Failed to get birthday reminders: ${error.message}`)
    }

    return data || []
  }

  /**
   * Archive old sent reminders (older than specified days)
   */
  static async archiveOldReminders(daysOld: number = 365): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const { data, error } = await supabase
      .from(TABLES.REMINDERS)
      .delete()
      .eq('status', 'sent')
      .lt('sent_at', cutoffDate.toISOString())
      .select()

    if (error) {
      throw new Error(`Failed to archive old reminders: ${error.message}`)
    }

    return data?.length || 0
  }

  /**
   * Get reminder statistics
   */
  static async getStatistics(): Promise<{
    total: number
    pending: number
    sent: number
    dismissed: number
    byType: Record<Reminder['type'], number>
    overdue: number
  }> {
    const allReminders = await this.getAll()
    const now = new Date()

    const stats = {
      total: allReminders.length,
      pending: 0,
      sent: 0,
      dismissed: 0,
      byType: {
        communication: 0,
        birthday_week: 0,
        birthday_day: 0
      } as Record<Reminder['type'], number>,
      overdue: 0
    }

    allReminders.forEach(reminder => {
      // Count by status
      stats[reminder.status]++

      // Count by type
      stats.byType[reminder.type]++

      // Count overdue (pending reminders past their scheduled time)
      if (reminder.status === 'pending' && new Date(reminder.scheduled_for) < now) {
        stats.overdue++
      }
    })

    return stats
  }

  /**
   * Reschedule a pending reminder
   */
  static async reschedule(id: string, newScheduledFor: Date, newMessage?: string): Promise<Reminder> {
    const updateData: UpdateReminderInput = {
      scheduled_for: newScheduledFor.toISOString()
    }

    if (newMessage) {
      updateData.message = newMessage
    }

    return this.update(id, updateData)
  }

  /**
   * Bulk mark reminders as sent
   */
  static async markMultipleAsSent(ids: string[]): Promise<void> {
    const { error } = await supabase
      .from(TABLES.REMINDERS)
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .in('id', ids)

    if (error) {
      throw new Error(`Failed to mark reminders as sent: ${error.message}`)
    }
  }

  /**
   * Bulk dismiss reminders
   */
  static async dismissMultiple(ids: string[]): Promise<void> {
    const { error } = await supabase
      .from(TABLES.REMINDERS)
      .update({
        status: 'dismissed'
      })
      .in('id', ids)

    if (error) {
      throw new Error(`Failed to dismiss reminders: ${error.message}`)
    }
  }
}