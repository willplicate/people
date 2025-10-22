import { supabase, TABLES } from '@/lib/supabase'
import { DailyQuote, CreateDailyQuoteInput, UpdateDailyQuoteInput } from '@/types/database'

export class DailyQuoteService {
  /**
   * Get the daily quote for today
   * First tries to get a quote assigned to today's date,
   * otherwise returns a random active quote (using today's date as seed for consistency)
   */
  static async getDailyQuote(): Promise<DailyQuote | null> {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

    // First try to get a quote specifically assigned to today
    const { data: dateSpecificQuote, error: dateError } = await supabase
      .from(TABLES.DAILY_QUOTES)
      .select()
      .eq('date_assigned', today)
      .eq('is_active', true)
      .single()

    if (!dateError && dateSpecificQuote) {
      return dateSpecificQuote
    }

    // If no date-specific quote, get a random active quote
    // Use today's date as a seed to get the same quote throughout the day
    const { data: allQuotes, error: allError } = await supabase
      .from(TABLES.DAILY_QUOTES)
      .select()
      .eq('is_active', true)
      .is('date_assigned', null) // Only get quotes without specific dates

    if (allError || !allQuotes || allQuotes.length === 0) {
      return null
    }

    // Use today's date to deterministically pick the same quote all day
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
    const index = dayOfYear % allQuotes.length

    return allQuotes[index]
  }

  /**
   * Get all quotes
   */
  static async getAll(options?: {
    isActive?: boolean
    hasDateAssigned?: boolean
  }): Promise<DailyQuote[]> {
    let query = supabase.from(TABLES.DAILY_QUOTES).select()

    if (options?.isActive !== undefined) {
      query = query.eq('is_active', options.isActive)
    }

    if (options?.hasDateAssigned !== undefined) {
      if (options.hasDateAssigned) {
        query = query.not('date_assigned', 'is', null)
      } else {
        query = query.is('date_assigned', null)
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get quotes: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get quote by ID
   */
  static async getById(id: string): Promise<DailyQuote | null> {
    const { data, error } = await supabase
      .from(TABLES.DAILY_QUOTES)
      .select()
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // No rows returned
      }
      throw new Error(`Failed to get quote: ${error.message}`)
    }

    return data
  }

  /**
   * Create a new quote
   */
  static async create(input: CreateDailyQuoteInput): Promise<DailyQuote> {
    const { data, error } = await supabase
      .from(TABLES.DAILY_QUOTES)
      .insert(input)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create quote: ${error.message}`)
    }

    return data
  }

  /**
   * Update a quote
   */
  static async update(id: string, input: UpdateDailyQuoteInput): Promise<DailyQuote> {
    const { data, error } = await supabase
      .from(TABLES.DAILY_QUOTES)
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update quote: ${error.message}`)
    }

    return data
  }

  /**
   * Delete a quote
   */
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.DAILY_QUOTES)
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete quote: ${error.message}`)
    }
  }
}
