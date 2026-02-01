import { supabase, TABLES } from '@/lib/supabase'
import { MeetingAgenda, CreateMeetingAgendaInput, UpdateMeetingAgendaInput } from '@/types/database'

export class MeetingAgendaService {
  /**
   * Get all meeting agendas with optional filtering and search
   */
  static async getAll(options?: {
    search?: string // Search in title, attendees, agenda, notes
    attendee?: string // Filter by specific attendee
    dateFrom?: Date
    dateTo?: Date
    limit?: number
    offset?: number
  }): Promise<MeetingAgenda[]> {
    let query = supabase
      .from(TABLES.MEETING_AGENDAS)
      .select('*')
      .order('meeting_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    // Search functionality
    if (options?.search) {
      const searchTerm = options.search.toLowerCase()
      query = query.or(`title.ilike.%${searchTerm}%,agenda.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`)
    }

    // Filter by attendee
    if (options?.attendee) {
      query = query.contains('attendees', [options.attendee])
    }

    // Date range filtering
    if (options?.dateFrom) {
      query = query.gte('meeting_date', options.dateFrom.toISOString())
    }

    if (options?.dateTo) {
      query = query.lte('meeting_date', options.dateTo.toISOString())
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to get meeting agendas: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get meeting agenda by ID
   */
  static async getById(id: string): Promise<MeetingAgenda | null> {
    const { data, error } = await supabase
      .from(TABLES.MEETING_AGENDAS)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to get meeting agenda: ${error.message}`)
    }

    return data
  }

  /**
   * Create a new meeting agenda
   */
  static async create(agendaData: CreateMeetingAgendaInput): Promise<MeetingAgenda> {
    const { data, error } = await supabase
      .from(TABLES.MEETING_AGENDAS)
      .insert(agendaData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create meeting agenda: ${error.message}`)
    }

    return data
  }

  /**
   * Update an existing meeting agenda
   */
  static async update(id: string, updates: UpdateMeetingAgendaInput): Promise<MeetingAgenda> {
    const { data, error } = await supabase
      .from(TABLES.MEETING_AGENDAS)
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update meeting agenda: ${error.message}`)
    }

    return data
  }

  /**
   * Delete a meeting agenda
   */
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.MEETING_AGENDAS)
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete meeting agenda: ${error.message}`)
    }
  }

  /**
   * Search meeting agendas by attendee name
   */
  static async searchByAttendee(attendeeName: string): Promise<MeetingAgenda[]> {
    return this.getAll({ attendee: attendeeName })
  }

  /**
   * Get recent meeting agendas (last 30 days)
   */
  static async getRecent(limit: number = 10): Promise<MeetingAgenda[]> {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    return this.getAll({
      dateFrom: thirtyDaysAgo,
      limit
    })
  }

  /**
   * Get all unique attendees for autocomplete
   */
  static async getAllAttendees(): Promise<string[]> {
    const { data, error } = await supabase
      .from(TABLES.MEETING_AGENDAS)
      .select('attendees')

    if (error) {
      throw new Error(`Failed to get attendees: ${error.message}`)
    }

    // Flatten all attendee arrays and get unique names
    const allAttendees = (data || [])
      .flatMap(item => item.attendees || [])
      .filter(Boolean)

    const uniqueAttendees = [...new Set(allAttendees)]
    return uniqueAttendees.sort()
  }

  /**
   * Search meetings with full text search
   */
  static async search(searchTerm: string): Promise<MeetingAgenda[]> {
    return this.getAll({ search: searchTerm })
  }
}