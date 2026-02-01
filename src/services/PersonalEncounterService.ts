import { supabase, TABLES } from '@/lib/supabase'
import {
  PersonalEncounter,
  CreatePersonalEncounterInput,
  UpdatePersonalEncounterInput
} from '@/types/database'

export class PersonalEncounterService {
  /**
   * Get recent encounters, ordered by date descending
   */
  static async getRecent(limit: number = 5): Promise<PersonalEncounter[]> {
    const { data, error } = await supabase
      .from(TABLES.PERSONAL_ENCOUNTERS)
      .select()
      .order('encounter_date', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to get recent encounters: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get encounter by ID
   */
  static async getById(id: string): Promise<PersonalEncounter | null> {
    const { data, error } = await supabase
      .from(TABLES.PERSONAL_ENCOUNTERS)
      .select()
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // No rows returned
      }
      throw new Error(`Failed to get encounter: ${error.message}`)
    }

    return data
  }

  /**
   * Create a new encounter
   */
  static async create(input: CreatePersonalEncounterInput, userId: string): Promise<PersonalEncounter> {
    const { data, error } = await supabase
      .from(TABLES.PERSONAL_ENCOUNTERS)
      .insert({
        ...input,
        created_by: userId
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create encounter: ${error.message}`)
    }

    return data
  }

  /**
   * Update an encounter
   */
  static async update(id: string, input: UpdatePersonalEncounterInput): Promise<PersonalEncounter> {
    const { data, error } = await supabase
      .from(TABLES.PERSONAL_ENCOUNTERS)
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update encounter: ${error.message}`)
    }

    return data
  }

  /**
   * Delete an encounter
   */
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.PERSONAL_ENCOUNTERS)
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete encounter: ${error.message}`)
    }
  }

  /**
   * Get encounters by date range
   */
  static async getByDateRange(startDate: string, endDate: string): Promise<PersonalEncounter[]> {
    const { data, error } = await supabase
      .from(TABLES.PERSONAL_ENCOUNTERS)
      .select()
      .gte('encounter_date', startDate)
      .lte('encounter_date', endDate)
      .order('encounter_date', { ascending: false })

    if (error) {
      throw new Error(`Failed to get encounters by date range: ${error.message}`)
    }

    return data || []
  }
}
