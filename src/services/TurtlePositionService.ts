import { supabase } from '@/lib/supabase'
import { TurtlePosition, CreateTurtlePositionInput, UpdateTurtlePositionInput } from '@/types/database'

export class TurtlePositionService {
  /**
   * Get all turtle positions with optional filtering
   */
  static async getAll(options?: {
    status?: TurtlePosition['status']
    symbol?: string
    limit?: number
    offset?: number
  }): Promise<TurtlePosition[]> {
    let query = supabase
      .from('turtle_positions')
      .select('*')
      .order('created_at', { ascending: false })

    if (options?.status) {
      query = query.eq('status', options.status)
    }

    if (options?.symbol) {
      query = query.eq('symbol', options.symbol)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching turtle positions:', error)
      throw error
    }

    return data || []
  }

  /**
   * Get a single turtle position by ID
   */
  static async getById(id: string): Promise<TurtlePosition | null> {
    const { data, error } = await supabase
      .from('turtle_positions')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching turtle position:', error)
      throw error
    }

    return data
  }

  /**
   * Create a new turtle position
   */
  static async create(input: CreateTurtlePositionInput): Promise<TurtlePosition> {
    const { data, error } = await supabase
      .from('turtle_positions')
      .insert(input)
      .select()
      .single()

    if (error) {
      console.error('Error creating turtle position:', error)
      throw error
    }

    return data
  }

  /**
   * Update an existing turtle position
   */
  static async update(id: string, input: UpdateTurtlePositionInput): Promise<TurtlePosition> {
    const { data, error } = await supabase
      .from('turtle_positions')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating turtle position:', error)
      throw error
    }

    return data
  }

  /**
   * Delete a turtle position
   */
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('turtle_positions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting turtle position:', error)
      throw error
    }
  }

  /**
   * Get count of positions by status
   */
  static async getCount(options?: {
    status?: TurtlePosition['status']
    symbol?: string
  }): Promise<number> {
    let query = supabase
      .from('turtle_positions')
      .select('*', { count: 'exact', head: true })

    if (options?.status) {
      query = query.eq('status', options.status)
    }

    if (options?.symbol) {
      query = query.eq('symbol', options.symbol)
    }

    const { count, error } = await query

    if (error) {
      console.error('Error getting turtle positions count:', error)
      throw error
    }

    return count || 0
  }

  /**
   * Search positions by name or symbol
   */
  static async search(searchTerm: string): Promise<TurtlePosition[]> {
    const { data, error } = await supabase
      .from('turtle_positions')
      .select('*')
      .or(`position_name.ilike.%${searchTerm}%,symbol.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error searching turtle positions:', error)
      throw error
    }

    return data || []
  }
}