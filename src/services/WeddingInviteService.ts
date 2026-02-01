import { supabase } from '@/lib/supabase'

export interface WeddingInvite {
  id: string
  name: string
  address: string | null
  category: string | null
  likeliness_to_come: number | null
  invite_status: 'Not contacted' | 'Contacted - awaiting response' | 'Confirmed attending' | 'Confirmed not attending' | 'No response'
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CreateWeddingInviteInput {
  name: string
  address?: string
  category?: string
  likeliness_to_come?: number
  invite_status?: 'Not contacted' | 'Contacted - awaiting response' | 'Confirmed attending' | 'Confirmed not attending' | 'No response'
  notes?: string
}

export interface UpdateWeddingInviteInput {
  name?: string
  address?: string
  category?: string
  likeliness_to_come?: number
  invite_status?: 'Not contacted' | 'Contacted - awaiting response' | 'Confirmed attending' | 'Confirmed not attending' | 'No response'
  notes?: string
}

export class WeddingInviteService {
  private static TABLE = 'wedding_invites'

  /**
   * Create a new wedding invite
   */
  static async create(input: CreateWeddingInviteInput): Promise<WeddingInvite> {
    const { data, error } = await supabase
      .from(this.TABLE)
      .insert(input)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create wedding invite: ${error.message}`)
    }

    return data
  }

  /**
   * Create multiple wedding invites from CSV import
   */
  static async createMany(invites: CreateWeddingInviteInput[]): Promise<WeddingInvite[]> {
    const { data, error } = await supabase
      .from(this.TABLE)
      .insert(invites)
      .select()

    if (error) {
      throw new Error(`Failed to create wedding invites: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get wedding invite by ID
   */
  static async getById(id: string): Promise<WeddingInvite | null> {
    const { data, error } = await supabase
      .from(this.TABLE)
      .select()
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to get wedding invite: ${error.message}`)
    }

    return data
  }

  /**
   * Get all wedding invites with optional filtering
   */
  static async getAll(options?: {
    category?: string
    inviteStatus?: string
    search?: string
    sortBy?: 'name' | 'category' | 'likeliness_to_come' | 'invite_status'
    sortOrder?: 'asc' | 'desc'
  }): Promise<WeddingInvite[]> {
    let query = supabase.from(this.TABLE).select()

    // Apply filters
    if (options?.category) {
      query = query.eq('category', options.category)
    }

    if (options?.inviteStatus) {
      query = query.eq('invite_status', options.inviteStatus)
    }

    if (options?.search) {
      query = query.or(`name.ilike.%${options.search}%,notes.ilike.%${options.search}%`)
    }

    // Apply sorting
    const sortBy = options?.sortBy || 'name'
    const sortOrder = options?.sortOrder || 'asc'
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to get wedding invites: ${error.message}`)
    }

    return data || []
  }

  /**
   * Update wedding invite by ID
   */
  static async update(id: string, input: UpdateWeddingInviteInput): Promise<WeddingInvite> {
    const { data, error } = await supabase
      .from(this.TABLE)
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update wedding invite: ${error.message}`)
    }

    return data
  }

  /**
   * Delete wedding invite by ID
   */
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.TABLE)
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete wedding invite: ${error.message}`)
    }
  }

  /**
   * Get invite statistics by category and status
   */
  static async getStats(): Promise<{
    totalInvites: number
    byCategory: Record<string, number>
    byStatus: Record<string, number>
    averageLikeliness: number
  }> {
    const { data, error } = await supabase
      .from(this.TABLE)
      .select('category, invite_status, likeliness_to_come')

    if (error) {
      throw new Error(`Failed to get wedding invite stats: ${error.message}`)
    }

    const stats = {
      totalInvites: data?.length || 0,
      byCategory: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      averageLikeliness: 0
    }

    let totalLikeliness = 0
    let likelinessCount = 0

    data?.forEach(invite => {
      // Category stats
      if (invite.category) {
        stats.byCategory[invite.category] = (stats.byCategory[invite.category] || 0) + 1
      }

      // Status stats
      if (invite.invite_status) {
        stats.byStatus[invite.invite_status] = (stats.byStatus[invite.invite_status] || 0) + 1
      }

      // Likeliness average
      if (invite.likeliness_to_come !== null) {
        totalLikeliness += invite.likeliness_to_come
        likelinessCount++
      }
    })

    if (likelinessCount > 0) {
      stats.averageLikeliness = Math.round((totalLikeliness / likelinessCount) * 10) / 10
    }

    return stats
  }
}