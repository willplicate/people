import { supabase, TABLES } from '@/lib/supabase'
import { Contact, CreateContactInput, UpdateContactInput } from '@/types/database'

export class ContactService {
  /**
   * Create a new contact
   */
  static async create(input: CreateContactInput): Promise<Contact> {
    const { data, error } = await supabase
      .from(TABLES.CONTACTS)
      .insert(input)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create contact: ${error.message}`)
    }

    return data
  }

  /**
   * Get contact by ID
   */
  static async getById(id: string): Promise<Contact | null> {
    const { data, error } = await supabase
      .from(TABLES.CONTACTS)
      .select()
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // No rows returned
      }
      throw new Error(`Failed to get contact: ${error.message}`)
    }

    return data
  }

  /**
   * Get all contacts with optional filtering and sorting
   */
  static async getAll(options?: {
    search?: string
    communicationFrequency?: Contact['communication_frequency']
    remindersPaused?: boolean
    christmasList?: boolean
    sortBy?: 'first_name' | 'last_name' | 'last_contacted_at' | 'created_at'
    sortOrder?: 'asc' | 'desc'
    limit?: number
    offset?: number
  }): Promise<Contact[]> {
    let query = supabase.from(TABLES.CONTACTS).select()

    // Apply filters
    if (options?.search) {
      query = query.or(`first_name.ilike.%${options.search}%,last_name.ilike.%${options.search}%,nickname.ilike.%${options.search}%`)
    }

    if (options?.communicationFrequency) {
      query = query.eq('communication_frequency', options.communicationFrequency)
    }

    if (options?.remindersPaused !== undefined) {
      query = query.eq('reminders_paused', options.remindersPaused)
    }

    if (options?.christmasList !== undefined) {
      query = query.eq('christmas_list', options.christmasList)
    }

    // Apply sorting
    const sortBy = options?.sortBy || 'first_name'
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
      throw new Error(`Failed to get contacts: ${error.message}`)
    }

    return data || []
  }

  /**
   * Update contact by ID
   */
  static async update(id: string, input: UpdateContactInput): Promise<Contact> {
    // Clean up the input to handle empty string timestamps
    const cleanedInput = { ...input }

    // Convert empty string timestamps to null to avoid PostgreSQL validation errors
    if (cleanedInput.last_contacted_at === "") {
      cleanedInput.last_contacted_at = null
    }

    const { data, error } = await supabase
      .from(TABLES.CONTACTS)
      .update({ ...cleanedInput, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update contact: ${error.message}`)
    }

    return data
  }

  /**
   * Delete contact by ID (cascade deletes related records)
   */
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.CONTACTS)
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete contact: ${error.message}`)
    }
  }

  /**
   * Get contacts with upcoming birthdays within the next N days
   */
  static async getUpcomingBirthdays(daysAhead: number = 30): Promise<Contact[]> {
    const today = new Date()
    const currentMonth = today.getMonth() + 1 // getMonth() is 0-indexed
    const currentDay = today.getDate()
    
    // For simplicity, we'll get all contacts with birthdays and filter in memory
    // In a real app, you might want to implement more sophisticated date queries
    const { data, error } = await supabase
      .from(TABLES.CONTACTS)
      .select()
      .not('birthday', 'is', null)

    if (error) {
      throw new Error(`Failed to get contacts with birthdays: ${error.message}`)
    }

    if (!data) return []

    // Filter contacts whose birthdays are within the next N days
    return data.filter(contact => {
      if (!contact.birthday) return false
      
      const [month, day] = contact.birthday.split('-').map(Number)
      const birthdayThisYear = new Date(today.getFullYear(), month - 1, day)
      
      // If birthday already passed this year, check next year
      if (birthdayThisYear < today) {
        birthdayThisYear.setFullYear(today.getFullYear() + 1)
      }
      
      const diffTime = birthdayThisYear.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      return diffDays >= 0 && diffDays <= daysAhead
    })
  }

  /**
   * Get contacts that need communication reminders
   */
  static async getContactsNeedingReminders(): Promise<Contact[]> {
    const { data, error } = await supabase
      .from(TABLES.CONTACTS)
      .select()
      .not('communication_frequency', 'is', null)
      .eq('reminders_paused', false)

    if (error) {
      throw new Error(`Failed to get contacts needing reminders: ${error.message}`)
    }

    if (!data) return []

    // Filter contacts based on their communication frequency and last contact date
    const now = new Date()
    return data.filter(contact => {
      if (!contact.communication_frequency || !contact.last_contacted_at) return true
      
      const lastContacted = new Date(contact.last_contacted_at)
      const daysSinceContact = Math.floor((now.getTime() - lastContacted.getTime()) / (1000 * 60 * 60 * 24))
      
      const frequencyDays = {
        weekly: 7,
        monthly: 30,
        quarterly: 90,
        biannually: 180,
        annually: 365
      }
      
      return daysSinceContact >= frequencyDays[contact.communication_frequency]
    })
  }

  /**
   * Search contacts by text across multiple fields
   */
  static async search(query: string): Promise<Contact[]> {
    const { data, error } = await supabase
      .from(TABLES.CONTACTS)
      .select()
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,nickname.ilike.%${query}%,notes.ilike.%${query}%`)
      .order('first_name', { ascending: true })

    if (error) {
      throw new Error(`Failed to search contacts: ${error.message}`)
    }

    return data || []
  }

  /**
   * Update last contacted date for a contact
   */
  static async updateLastContactedAt(id: string, date?: Date): Promise<Contact> {
    const lastContactedAt = date ? date.toISOString() : new Date().toISOString()
    
    return this.update(id, { last_contacted_at: lastContactedAt })
  }

  /**
   * Get contacts on Christmas list
   */
  static async getChristmasList(): Promise<Contact[]> {
    const { data, error } = await supabase
      .from(TABLES.CONTACTS)
      .select()
      .eq('christmas_list', true)
      .order('first_name', { ascending: true })

    if (error) {
      throw new Error(`Failed to get Christmas list contacts: ${error.message}`)
    }

    return data || []
  }

  /**
   * Toggle Christmas list status for a contact
   */
  static async toggleChristmasList(id: string, isOnList: boolean): Promise<Contact> {
    return this.update(id, { christmas_list: isOnList })
  }

  /**
   * Get contact count
   */
  static async getCount(filters?: {
    search?: string
    communicationFrequency?: Contact['communication_frequency']
    remindersPaused?: boolean
    christmasList?: boolean
  }): Promise<number> {
    let query = supabase.from(TABLES.CONTACTS).select('*', { count: 'exact', head: true })

    if (filters?.search) {
      query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,nickname.ilike.%${filters.search}%`)
    }

    if (filters?.communicationFrequency) {
      query = query.eq('communication_frequency', filters.communicationFrequency)
    }

    if (filters?.remindersPaused !== undefined) {
      query = query.eq('reminders_paused', filters.remindersPaused)
    }

    if (filters?.christmasList !== undefined) {
      query = query.eq('christmas_list', filters.christmasList)
    }

    const { count, error } = await query

    if (error) {
      throw new Error(`Failed to get contact count: ${error.message}`)
    }

    return count || 0
  }
}