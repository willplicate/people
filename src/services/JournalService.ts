import { supabase, TABLES } from '@/lib/supabase'
import {
  JournalEntry,
  JournalContentItem,
  CreateJournalEntryInput,
  AppendJournalEntryInput
} from '@/types/database'

export class JournalService {
  /**
   * Get today's journal entry
   */
  static async getTodayEntry(): Promise<JournalEntry | null> {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

    const { data, error } = await supabase
      .from(TABLES.JOURNAL_ENTRIES)
      .select()
      .eq('date', today)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // No rows returned
      }
      throw new Error(`Failed to get today's entry: ${error.message}`)
    }

    return data
  }

  /**
   * Get journal entry by date
   */
  static async getByDate(date: string): Promise<JournalEntry | null> {
    const { data, error } = await supabase
      .from(TABLES.JOURNAL_ENTRIES)
      .select()
      .eq('date', date)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // No rows returned
      }
      throw new Error(`Failed to get entry: ${error.message}`)
    }

    return data
  }

  /**
   * Get recent journal entries
   */
  static async getRecentEntries(limit: number = 10): Promise<JournalEntry[]> {
    const { data, error } = await supabase
      .from(TABLES.JOURNAL_ENTRIES)
      .select()
      .order('date', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to get recent entries: ${error.message}`)
    }

    return data || []
  }

  /**
   * Create a new journal entry for a specific date
   */
  static async createEntry(input: CreateJournalEntryInput): Promise<JournalEntry> {
    const contentItem: JournalContentItem = {
      text: input.text,
      timestamp: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from(TABLES.JOURNAL_ENTRIES)
      .insert({
        date: input.date,
        content: [contentItem]
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create entry: ${error.message}`)
    }

    return data
  }

  /**
   * Append text to an existing journal entry
   * If no entry exists for the date, creates a new one
   */
  static async appendToEntry(date: string, input: AppendJournalEntryInput): Promise<JournalEntry> {
    // First try to get existing entry
    const existingEntry = await this.getByDate(date)

    if (!existingEntry) {
      // Create new entry if it doesn't exist
      return this.createEntry({
        date,
        text: input.text
      })
    }

    // Append to existing entry
    const newContentItem: JournalContentItem = {
      text: input.text,
      timestamp: new Date().toISOString()
    }

    const updatedContent = [...existingEntry.content, newContentItem]

    const { data, error } = await supabase
      .from(TABLES.JOURNAL_ENTRIES)
      .update({ content: updatedContent })
      .eq('date', date)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to append to entry: ${error.message}`)
    }

    return data
  }

  /**
   * Get current streak of consecutive days with entries (excluding backfills)
   */
  static async getCurrentStreak(): Promise<number> {
    const { data, error } = await supabase
      .rpc('calculate_journal_streak')

    if (error) {
      throw new Error(`Failed to calculate streak: ${error.message}`)
    }

    return data || 0
  }

  /**
   * Delete a journal entry
   */
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.JOURNAL_ENTRIES)
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete entry: ${error.message}`)
    }
  }

  /**
   * Get all entries for a specific date range
   */
  static async getEntriesByDateRange(startDate: string, endDate: string): Promise<JournalEntry[]> {
    const { data, error } = await supabase
      .from(TABLES.JOURNAL_ENTRIES)
      .select()
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })

    if (error) {
      throw new Error(`Failed to get entries by date range: ${error.message}`)
    }

    return data || []
  }
}
