import { supabase, TABLES } from '@/lib/supabase'
import { Interaction, CreateInteractionInput, UpdateInteractionInput } from '@/types/database'
import { ContactService } from './ContactService'

export class InteractionService {
  /**
   * Create a new interaction and update contact's last_contacted_at
   */
  static async create(input: CreateInteractionInput): Promise<Interaction> {
    // Validate interaction date is not in the future
    const interactionDate = new Date(input.interaction_date)
    const now = new Date()

    if (interactionDate > now) {
      throw new Error('Interaction date cannot be in the future')
    }

    // Validate notes length
    if (!input.notes || input.notes.trim().length === 0) {
      throw new Error('Notes are required and cannot be empty')
    }

    if (input.notes.length > 2000) {
      throw new Error('Notes cannot exceed 2000 characters')
    }

    // Create the interaction
    const { data, error } = await supabase
      .from(TABLES.INTERACTIONS)
      .insert({
        ...input,
        notes: input.notes.trim()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create interaction: ${error.message}`)
    }

    // Update contact's last_contacted_at
    try {
      await ContactService.updateLastContactedAt(input.contact_id, interactionDate)
    } catch (contactError) {
      // If updating contact fails, we should still return the interaction
      // but log the error for monitoring
      console.error('Failed to update contact last_contacted_at:', contactError)
    }

    return data
  }

  /**
   * Get interaction by ID
   */
  static async getById(id: string): Promise<Interaction | null> {
    const { data, error } = await supabase
      .from(TABLES.INTERACTIONS)
      .select()
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // No rows returned
      }
      throw new Error(`Failed to get interaction: ${error.message}`)
    }

    return data
  }

  /**
   * Get all interactions for a contact
   */
  static async getByContactId(
    contactId: string,
    options?: {
      type?: Interaction['type']
      sortBy?: 'interaction_date' | 'created_at'
      sortOrder?: 'asc' | 'desc'
      limit?: number
      offset?: number
    }
  ): Promise<Interaction[]> {
    let query = supabase
      .from(TABLES.INTERACTIONS)
      .select()
      .eq('contact_id', contactId)

    // Apply type filter
    if (options?.type) {
      query = query.eq('type', options.type)
    }

    // Apply sorting
    const sortBy = options?.sortBy || 'interaction_date'
    const sortOrder = options?.sortOrder || 'desc'
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
      throw new Error(`Failed to get interactions: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get all interactions with optional filtering
   */
  static async getAll(options?: {
    type?: Interaction['type']
    searchNotes?: string
    dateFrom?: Date
    dateTo?: Date
    sortBy?: 'interaction_date' | 'created_at'
    sortOrder?: 'asc' | 'desc'
    limit?: number
    offset?: number
  }): Promise<Interaction[]> {
    let query = supabase.from(TABLES.INTERACTIONS).select()

    // Apply filters
    if (options?.type) {
      query = query.eq('type', options.type)
    }

    if (options?.searchNotes) {
      query = query.ilike('notes', `%${options.searchNotes}%`)
    }

    if (options?.dateFrom) {
      query = query.gte('interaction_date', options.dateFrom.toISOString())
    }

    if (options?.dateTo) {
      query = query.lte('interaction_date', options.dateTo.toISOString())
    }

    // Apply sorting
    const sortBy = options?.sortBy || 'interaction_date'
    const sortOrder = options?.sortOrder || 'desc'
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
      throw new Error(`Failed to get interactions: ${error.message}`)
    }

    return data || []
  }

  /**
   * Update interaction by ID
   */
  static async update(id: string, input: UpdateInteractionInput): Promise<Interaction> {
    // Validate interaction date if provided
    if (input.interaction_date) {
      const interactionDate = new Date(input.interaction_date)
      const now = new Date()
      
      if (interactionDate > now) {
        throw new Error('Interaction date cannot be in the future')
      }
    }

    // Validate notes if provided
    if (input.notes !== undefined) {
      if (!input.notes || input.notes.trim().length === 0) {
        throw new Error('Notes are required and cannot be empty')
      }

      if (input.notes.length > 2000) {
        throw new Error('Notes cannot exceed 2000 characters')
      }
    }

    const updateData = { ...input }
    if (updateData.notes) {
      updateData.notes = updateData.notes.trim()
    }

    const { data, error } = await supabase
      .from(TABLES.INTERACTIONS)
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update interaction: ${error.message}`)
    }

    // If interaction date was updated, update contact's last_contacted_at
    if (input.interaction_date) {
      try {
        await ContactService.updateLastContactedAt(data.contact_id, new Date(input.interaction_date))
      } catch (contactError) {
        console.error('Failed to update contact last_contacted_at:', contactError)
      }
    }

    return data
  }

  /**
   * Delete interaction by ID
   */
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.INTERACTIONS)
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete interaction: ${error.message}`)
    }
  }

  /**
   * Get recent interactions across all contacts
   */
  static async getRecent(limit: number = 10): Promise<Interaction[]> {
    const { data, error } = await supabase
      .from(TABLES.INTERACTIONS)
      .select()
      .order('interaction_date', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to get recent interactions: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get latest interaction for a contact
   */
  static async getLatestByContactId(contactId: string): Promise<Interaction | null> {
    const { data, error } = await supabase
      .from(TABLES.INTERACTIONS)
      .select()
      .eq('contact_id', contactId)
      .order('interaction_date', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // No rows returned
      }
      throw new Error(`Failed to get latest interaction: ${error.message}`)
    }

    return data
  }

  /**
   * Get interaction count for a contact
   */
  static async getCountByContactId(contactId: string): Promise<number> {
    const { count, error } = await supabase
      .from(TABLES.INTERACTIONS)
      .select('*', { count: 'exact', head: true })
      .eq('contact_id', contactId)

    if (error) {
      throw new Error(`Failed to get interaction count: ${error.message}`)
    }

    return count || 0
  }

  /**
   * Get total interaction count
   */
  static async getTotalCount(filters?: {
    type?: Interaction['type']
    dateFrom?: Date
    dateTo?: Date
  }): Promise<number> {
    let query = supabase.from(TABLES.INTERACTIONS).select('*', { count: 'exact', head: true })

    if (filters?.type) {
      query = query.eq('type', filters.type)
    }

    if (filters?.dateFrom) {
      query = query.gte('interaction_date', filters.dateFrom.toISOString())
    }

    if (filters?.dateTo) {
      query = query.lte('interaction_date', filters.dateTo.toISOString())
    }

    const { count, error } = await query

    if (error) {
      throw new Error(`Failed to get total interaction count: ${error.message}`)
    }

    return count || 0
  }

  /**
   * Search interactions by notes content
   */
  static async searchByNotes(searchTerm: string, limit?: number): Promise<Interaction[]> {
    let query = supabase
      .from(TABLES.INTERACTIONS)
      .select()
      .ilike('notes', `%${searchTerm}%`)
      .order('interaction_date', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to search interactions: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get interactions by type across all contacts
   */
  static async getByType(type: Interaction['type'], limit?: number): Promise<Interaction[]> {
    let query = supabase
      .from(TABLES.INTERACTIONS)
      .select()
      .eq('type', type)
      .order('interaction_date', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to get interactions by type: ${error.message}`)
    }

    return data || []
  }

  /**
   * Delete all interactions for a specific contact
   */
  static async deleteByContactId(contactId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.INTERACTIONS)
      .delete()
      .eq('contact_id', contactId)

    if (error) {
      throw new Error(`Failed to delete interactions for contact: ${error.message}`)
    }
  }

  /**
   * Get interaction statistics for a contact
   */
  static async getStatsByContactId(contactId: string): Promise<{
    total: number
    byType: Record<Interaction['type'], number>
    lastInteraction?: Date
    firstInteraction?: Date
  }> {
    const interactions = await this.getByContactId(contactId)
    
    const stats = {
      total: interactions.length,
      byType: {
        call: 0,
        text: 0,
        email: 0,
        meetup: 0,
        other: 0
      } as Record<Interaction['type'], number>,
      lastInteraction: undefined as Date | undefined,
      firstInteraction: undefined as Date | undefined
    }

    if (interactions.length > 0) {
      // Count by type
      interactions.forEach(interaction => {
        stats.byType[interaction.type]++
      })

      // Get first and last interaction dates
      const dates = interactions.map(i => new Date(i.interaction_date)).sort((a, b) => a.getTime() - b.getTime())
      stats.firstInteraction = dates[0]
      stats.lastInteraction = dates[dates.length - 1]
    }

    return stats
  }
}