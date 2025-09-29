import { supabase } from '@/lib/supabase'

export interface WeddingGuest {
  id: string
  guest_name: string
  email: string | null
  phone: string | null
  rsvp_status: 'pending' | 'attending' | 'not_attending' | 'maybe'
  number_of_guests: number
  dietary_restrictions: string | null
  plus_one_name: string | null
  message: string | null
  rsvp_date: string | null
  created_at: string
  updated_at: string
}

export interface CreateWeddingGuestInput {
  guest_name: string
  email?: string
  phone?: string
  rsvp_status?: 'pending' | 'attending' | 'not_attending' | 'maybe'
  number_of_guests?: number
  dietary_restrictions?: string
  plus_one_name?: string
  message?: string
}

export interface UpdateWeddingGuestInput {
  guest_name?: string
  email?: string
  phone?: string
  rsvp_status?: 'pending' | 'attending' | 'not_attending' | 'maybe'
  number_of_guests?: number
  dietary_restrictions?: string
  plus_one_name?: string
  message?: string
}

export class WeddingGuestService {
  private static TABLE = 'wedding_guests'

  /**
   * Create a new wedding guest RSVP
   */
  static async create(input: CreateWeddingGuestInput): Promise<WeddingGuest> {
    const { data, error } = await supabase
      .from(this.TABLE)
      .insert({
        ...input,
        rsvp_date: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create wedding guest: ${error.message}`)
    }

    return data
  }

  /**
   * Get wedding guest by ID
   */
  static async getById(id: string): Promise<WeddingGuest | null> {
    const { data, error } = await supabase
      .from(this.TABLE)
      .select()
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // No rows returned
      }
      throw new Error(`Failed to get wedding guest: ${error.message}`)
    }

    return data
  }

  /**
   * Get all wedding guests with optional filtering
   */
  static async getAll(options?: {
    rsvpStatus?: 'pending' | 'attending' | 'not_attending' | 'maybe'
    search?: string
    sortBy?: 'guest_name' | 'rsvp_date' | 'created_at'
    sortOrder?: 'asc' | 'desc'
  }): Promise<WeddingGuest[]> {
    let query = supabase.from(this.TABLE).select()

    // Apply filters
    if (options?.rsvpStatus) {
      query = query.eq('rsvp_status', options.rsvpStatus)
    }

    if (options?.search) {
      query = query.or(`guest_name.ilike.%${options.search}%,email.ilike.%${options.search}%`)
    }

    // Apply sorting
    const sortBy = options?.sortBy || 'created_at'
    const sortOrder = options?.sortOrder || 'desc'
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to get wedding guests: ${error.message}`)
    }

    return data || []
  }

  /**
   * Update wedding guest by ID
   */
  static async update(id: string, input: UpdateWeddingGuestInput): Promise<WeddingGuest> {
    const { data, error } = await supabase
      .from(this.TABLE)
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update wedding guest: ${error.message}`)
    }

    return data
  }

  /**
   * Delete wedding guest by ID
   */
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.TABLE)
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete wedding guest: ${error.message}`)
    }
  }

  /**
   * Get RSVP statistics
   */
  static async getStats(): Promise<{
    total: number
    attending: number
    notAttending: number
    pending: number
    maybe: number
    totalGuests: number
  }> {
    const { data, error } = await supabase
      .from(this.TABLE)
      .select('rsvp_status, number_of_guests')

    if (error) {
      throw new Error(`Failed to get wedding guest stats: ${error.message}`)
    }

    const stats = {
      total: data?.length || 0,
      attending: 0,
      notAttending: 0,
      pending: 0,
      maybe: 0,
      totalGuests: 0
    }

    data?.forEach(guest => {
      if (guest.rsvp_status === 'attending') {
        stats.attending++
        stats.totalGuests += guest.number_of_guests || 1
      } else if (guest.rsvp_status === 'not_attending') {
        stats.notAttending++
      } else if (guest.rsvp_status === 'pending') {
        stats.pending++
      } else if (guest.rsvp_status === 'maybe') {
        stats.maybe++
      }
    })

    return stats
  }
}