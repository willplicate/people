import { supabase, TABLES } from '@/lib/supabase'
import { Meeting } from '@/types/database'

export class MeetingService {
  /**
   * Get all meetings (including Granola-synced meetings)
   */
  static async getAll(options?: {
    source?: string // Filter by source (e.g., 'granola_mcp')
    dateFrom?: Date
    dateTo?: Date
    limit?: number
  }): Promise<Meeting[]> {
    let query = supabase
      .from(TABLES.MEETINGS)
      .select('*')
      .order('start_time', { ascending: false })

    // Filter by source
    if (options?.source) {
      query = query.eq('source', options.source)
    }

    // Date range filtering
    if (options?.dateFrom) {
      query = query.gte('start_time', options.dateFrom.toISOString())
    }

    if (options?.dateTo) {
      query = query.lte('start_time', options.dateTo.toISOString())
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to get meetings: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get meeting by ID
   */
  static async getById(id: string): Promise<Meeting | null> {
    const { data, error } = await supabase
      .from(TABLES.MEETINGS)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to get meeting: ${error.message}`)
    }

    return data
  }

  /**
   * Get Granola-synced meetings only
   */
  static async getGranolaMeetings(limit?: number): Promise<Meeting[]> {
    return this.getAll({
      source: 'granola_mcp',
      limit
    })
  }

  /**
   * Get upcoming meetings (from today onwards)
   */
  static async getUpcoming(limit: number = 10): Promise<Meeting[]> {
    const now = new Date()

    return this.getAll({
      dateFrom: now,
      limit
    })
  }

  /**
   * Get recent meetings (last 30 days)
   */
  static async getRecent(limit: number = 10): Promise<Meeting[]> {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    return this.getAll({
      dateFrom: thirtyDaysAgo,
      dateTo: new Date(),
      limit
    })
  }
}
