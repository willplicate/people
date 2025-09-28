import { supabase, TABLES } from '@/lib/supabase'
import { Contact, ContactInfo, Interaction, Reminder } from '@/types/database'
import { ContactService } from './ContactService'
import { ContactInfoService } from './ContactInfoService'
import { InteractionService } from './InteractionService'
import { ReminderService } from './ReminderService'

export interface ExportData {
  contacts: Contact[]
  contactInfo: ContactInfo[]
  interactions: Interaction[]
  reminders: Reminder[]
  exportedAt: string
  totalRecords: number
}

export interface ExportOptions {
  includeContacts?: boolean
  includeContactInfo?: boolean
  includeInteractions?: boolean
  includeReminders?: boolean
  contactIds?: string[]
  dateFrom?: Date
  dateTo?: Date
  format?: 'json' | 'csv'
}

export class ExportService {
  /**
   * Export all data or filtered data based on options
   */
  static async exportData(options: ExportOptions = {}): Promise<ExportData> {
    const {
      includeContacts = true,
      includeContactInfo = true,
      includeInteractions = true,
      includeReminders = true,
      contactIds,
      dateFrom,
      dateTo
    } = options

    const exportData: ExportData = {
      contacts: [],
      contactInfo: [],
      interactions: [],
      reminders: [],
      exportedAt: new Date().toISOString(),
      totalRecords: 0
    }

    // Export contacts
    if (includeContacts) {
      if (contactIds && contactIds.length > 0) {
        exportData.contacts = await this.getContactsByIds(contactIds)
      } else {
        exportData.contacts = await ContactService.getAll()
      }
    }

    // Export contact info
    if (includeContactInfo) {
      if (contactIds && contactIds.length > 0) {
        exportData.contactInfo = await this.getContactInfoByContactIds(contactIds)
      } else {
        exportData.contactInfo = await this.getAllContactInfo()
      }
    }

    // Export interactions
    if (includeInteractions) {
      const interactionOptions: any = {}
      if (dateFrom) interactionOptions.dateFrom = dateFrom
      if (dateTo) interactionOptions.dateTo = dateTo
      
      if (contactIds && contactIds.length > 0) {
        exportData.interactions = await this.getInteractionsByContactIds(contactIds, interactionOptions)
      } else {
        exportData.interactions = await InteractionService.getAll(interactionOptions)
      }
    }

    // Export reminders
    if (includeReminders) {
      const reminderOptions: any = {}
      if (dateFrom) reminderOptions.scheduledFrom = dateFrom
      if (dateTo) reminderOptions.scheduledTo = dateTo
      
      if (contactIds && contactIds.length > 0) {
        exportData.reminders = await this.getRemindersByContactIds(contactIds, reminderOptions)
      } else {
        exportData.reminders = await ReminderService.getAll(reminderOptions)
      }
    }

    // Calculate total records
    exportData.totalRecords = 
      exportData.contacts.length +
      exportData.contactInfo.length +
      exportData.interactions.length +
      exportData.reminders.length

    return exportData
  }

  /**
   * Export data for a specific contact with all related records
   */
  static async exportContactData(contactId: string): Promise<ExportData> {
    const [contact, contactInfo, interactions, reminders] = await Promise.all([
      ContactService.getById(contactId),
      ContactInfoService.getByContactId(contactId),
      InteractionService.getByContactId(contactId),
      ReminderService.getByContactId(contactId)
    ])

    return {
      contacts: contact ? [contact] : [],
      contactInfo,
      interactions,
      reminders,
      exportedAt: new Date().toISOString(),
      totalRecords: (contact ? 1 : 0) + contactInfo.length + interactions.length + reminders.length
    }
  }

  /**
   * Export data to CSV format
   */
  static async exportToCSV(options: ExportOptions = {}): Promise<{
    contacts?: string
    contactInfo?: string
    interactions?: string
    reminders?: string
  }> {
    const data = await this.exportData(options)
    const csvData: any = {}

    if (data.contacts.length > 0) {
      csvData.contacts = this.convertToCSV(data.contacts, 'contacts')
    }

    if (data.contactInfo.length > 0) {
      csvData.contactInfo = this.convertToCSV(data.contactInfo, 'contactInfo')
    }

    if (data.interactions.length > 0) {
      csvData.interactions = this.convertToCSV(data.interactions, 'interactions')
    }

    if (data.reminders.length > 0) {
      csvData.reminders = this.convertToCSV(data.reminders, 'reminders')
    }

    return csvData
  }

  /**
   * Export contacts with their primary contact information
   */
  static async exportContactsWithPrimaryInfo(): Promise<Array<{
    id: string
    firstName: string
    lastName?: string
    nickname?: string
    birthday?: string
    communicationFrequency?: string
    lastContactedAt?: string
    remindersPaused: boolean
    notes?: string
    primaryPhone?: string
    primaryEmail?: string
    primaryAddress?: string
    createdAt: string
    updatedAt: string
  }>> {
    const contacts = await ContactService.getAll()
    const enrichedContacts = []

    for (const contact of contacts) {
      const primaryMethods = await ContactInfoService.getPrimaryMethods(contact.id)
      
      enrichedContacts.push({
        id: contact.id,
        firstName: contact.first_name,
        lastName: contact.last_name,
        nickname: contact.nickname,
        birthday: contact.birthday,
        communicationFrequency: contact.communication_frequency,
        lastContactedAt: contact.last_contacted_at,
        remindersPaused: contact.reminders_paused,
        notes: contact.notes,
        primaryPhone: primaryMethods.phone?.value,
        primaryEmail: primaryMethods.email?.value,
        primaryAddress: primaryMethods.address?.value,
        createdAt: contact.created_at,
        updatedAt: contact.updated_at
      })
    }

    return enrichedContacts
  }

  /**
   * Export interaction summary with contact names
   */
  static async exportInteractionSummary(options?: {
    dateFrom?: Date
    dateTo?: Date
  }): Promise<Array<{
    id: string
    contactName: string
    type: string
    notes: string
    interactionDate: string
    createdAt: string
  }>> {
    const interactions = await InteractionService.getAll(options)
    const contacts = await ContactService.getAll()
    const contactMap = new Map(contacts.map(c => [c.id, c]))

    return interactions.map(interaction => {
      const contact = contactMap.get(interaction.contact_id)
      const contactName = contact 
        ? `${contact.first_name}${contact.last_name ? ' ' + contact.last_name : ''}`
        : 'Unknown Contact'

      return {
        id: interaction.id,
        contactName,
        type: interaction.type,
        notes: interaction.notes,
        interactionDate: interaction.interaction_date,
        createdAt: interaction.created_at
      }
    })
  }

  /**
   * Export reminder summary with contact names
   */
  static async exportReminderSummary(): Promise<Array<{
    id: string
    contactName: string
    type: string
    scheduledFor: string
    status: string
    message: string
    createdAt: string
    sentAt?: string
  }>> {
    const reminders = await ReminderService.getAll()
    const contacts = await ContactService.getAll()
    const contactMap = new Map(contacts.map(c => [c.id, c]))

    return reminders.map(reminder => {
      const contact = contactMap.get(reminder.contact_id)
      const contactName = contact 
        ? `${contact.first_name}${contact.last_name ? ' ' + contact.last_name : ''}`
        : 'Unknown Contact'

      return {
        id: reminder.id,
        contactName,
        type: reminder.type,
        scheduledFor: reminder.scheduled_for,
        status: reminder.status,
        message: reminder.message,
        createdAt: reminder.created_at,
        sentAt: reminder.sent_at
      }
    })
  }

  /**
   * Create a backup of all data
   */
  static async createBackup(): Promise<ExportData> {
    return this.exportData({
      includeContacts: true,
      includeContactInfo: true,
      includeInteractions: true,
      includeReminders: true
    })
  }

  /**
   * Get export statistics
   */
  static async getExportStatistics(): Promise<{
    totalContacts: number
    totalContactInfo: number
    totalInteractions: number
    totalReminders: number
    dataSize: {
      contacts: number
      contactInfo: number
      interactions: number
      reminders: number
    }
  }> {
    const [contactCount, reminderCount] = await Promise.all([
      ContactService.getCount(),
      ReminderService.getTotalCount()
    ])

    const [allContactInfo, interactionCount] = await Promise.all([
      this.getAllContactInfo(),
      InteractionService.getTotalCount()
    ])

    return {
      totalContacts: contactCount,
      totalContactInfo: allContactInfo.length,
      totalInteractions: interactionCount,
      totalReminders: reminderCount,
      dataSize: {
        contacts: contactCount,
        contactInfo: allContactInfo.length,
        interactions: interactionCount,
        reminders: reminderCount
      }
    }
  }

  /**
   * Helper method to get contacts by IDs
   */
  private static async getContactsByIds(contactIds: string[]): Promise<Contact[]> {
    const { data, error } = await supabase
      .from(TABLES.CONTACTS)
      .select()
      .in('id', contactIds)

    if (error) {
      throw new Error(`Failed to get contacts: ${error.message}`)
    }

    return data || []
  }

  /**
   * Helper method to get all contact info
   */
  private static async getAllContactInfo(): Promise<ContactInfo[]> {
    const { data, error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .select()

    if (error) {
      throw new Error(`Failed to get contact info: ${error.message}`)
    }

    return data || []
  }

  /**
   * Helper method to get contact info by contact IDs
   */
  private static async getContactInfoByContactIds(contactIds: string[]): Promise<ContactInfo[]> {
    const { data, error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .select()
      .in('contact_id', contactIds)

    if (error) {
      throw new Error(`Failed to get contact info: ${error.message}`)
    }

    return data || []
  }

  /**
   * Helper method to get interactions by contact IDs
   */
  private static async getInteractionsByContactIds(
    contactIds: string[], 
    options: any = {}
  ): Promise<Interaction[]> {
    let query = supabase
      .from(TABLES.INTERACTIONS)
      .select()
      .in('contact_id', contactIds)

    if (options.dateFrom) {
      query = query.gte('interaction_date', options.dateFrom.toISOString())
    }

    if (options.dateTo) {
      query = query.lte('interaction_date', options.dateTo.toISOString())
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to get interactions: ${error.message}`)
    }

    return data || []
  }

  /**
   * Helper method to get reminders by contact IDs
   */
  private static async getRemindersByContactIds(
    contactIds: string[], 
    options: any = {}
  ): Promise<Reminder[]> {
    let query = supabase
      .from(TABLES.REMINDERS)
      .select()
      .in('contact_id', contactIds)

    if (options.scheduledFrom) {
      query = query.gte('scheduled_for', options.scheduledFrom.toISOString())
    }

    if (options.scheduledTo) {
      query = query.lte('scheduled_for', options.scheduledTo.toISOString())
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to get reminders: ${error.message}`)
    }

    return data || []
  }

  /**
   * Convert data to CSV format
   */
  private static convertToCSV(data: any[], type: string): string {
    if (data.length === 0) return ''

    const headers = Object.keys(data[0])
    const csvHeaders = headers.join(',')
    
    const csvRows = data.map(row => {
      return headers.map(header => {
        const value = row[header]
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value || ''
      }).join(',')
    })

    return [csvHeaders, ...csvRows].join('\n')
  }

  /**
   * Import data from exported format (for backup restoration)
   */
  static async importData(exportData: ExportData): Promise<{
    imported: {
      contacts: number
      contactInfo: number
      interactions: number
      reminders: number
    }
    errors: string[]
  }> {
    const result = {
      imported: {
        contacts: 0,
        contactInfo: 0,
        interactions: 0,
        reminders: 0
      },
      errors: [] as string[]
    }

    // Import contacts first
    for (const contact of exportData.contacts) {
      try {
        await supabase.from(TABLES.CONTACTS).insert(contact)
        result.imported.contacts++
      } catch (error) {
        result.errors.push(`Failed to import contact ${contact.first_name}: ${error}`)
      }
    }

    // Import contact info
    for (const contactInfo of exportData.contactInfo) {
      try {
        await supabase.from(TABLES.CONTACT_INFO).insert(contactInfo)
        result.imported.contactInfo++
      } catch (error) {
        result.errors.push(`Failed to import contact info: ${error}`)
      }
    }

    // Import interactions
    for (const interaction of exportData.interactions) {
      try {
        await supabase.from(TABLES.INTERACTIONS).insert(interaction)
        result.imported.interactions++
      } catch (error) {
        result.errors.push(`Failed to import interaction: ${error}`)
      }
    }

    // Import reminders
    for (const reminder of exportData.reminders) {
      try {
        await supabase.from(TABLES.REMINDERS).insert(reminder)
        result.imported.reminders++
      } catch (error) {
        result.errors.push(`Failed to import reminder: ${error}`)
      }
    }

    return result
  }
}