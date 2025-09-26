import { supabase, TABLES } from '@/lib/supabase'
import { Habit, CreateHabitInput, UpdateHabitInput, HabitCompletion, CreateHabitCompletionInput } from '@/types/database'

export class HabitService {
  /**
   * Create a new habit
   */
  static async create(input: CreateHabitInput): Promise<Habit> {
    const { data, error } = await supabase
      .from(TABLES.HABITS)
      .insert(input)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create habit: ${error.message}`)
    }

    return data
  }

  /**
   * Get habit by ID
   */
  static async getById(id: string): Promise<Habit | null> {
    const { data, error } = await supabase
      .from(TABLES.HABITS)
      .select()
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // No rows returned
      }
      throw new Error(`Failed to get habit: ${error.message}`)
    }

    return data
  }

  /**
   * Get all habits with optional filtering
   */
  static async getAll(options?: {
    isActive?: boolean
    frequencyType?: Habit['frequency_type']
    sortBy?: 'name' | 'created_at'
    sortOrder?: 'asc' | 'desc'
  }): Promise<Habit[]> {
    let query = supabase.from(TABLES.HABITS).select()

    // Apply filters
    if (options?.isActive !== undefined) {
      query = query.eq('is_active', options.isActive)
    }

    if (options?.frequencyType) {
      query = query.eq('frequency_type', options.frequencyType)
    }

    // Apply sorting
    const sortBy = options?.sortBy || 'name'
    const sortOrder = options?.sortOrder || 'asc'
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to get habits: ${error.message}`)
    }

    return data || []
  }

  /**
   * Update a habit
   */
  static async update(id: string, input: UpdateHabitInput): Promise<Habit> {
    const { data, error } = await supabase
      .from(TABLES.HABITS)
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update habit: ${error.message}`)
    }

    return data
  }

  /**
   * Delete a habit (and all its completions)
   */
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.HABITS)
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete habit: ${error.message}`)
    }
  }

  /**
   * Get habits that should be shown today based on their frequency
   */
  static async getTodaysHabits(date: Date = new Date()): Promise<Habit[]> {
    const dayOfWeek = date.getDay() // 0 = Sunday, 1 = Monday, etc.

    const { data, error } = await supabase
      .from(TABLES.HABITS)
      .select()
      .eq('is_active', true)

    if (error) {
      throw new Error(`Failed to get today's habits: ${error.message}`)
    }

    // Filter habits based on their frequency
    const todaysHabits = data?.filter(habit => {
      switch (habit.frequency_type) {
        case 'daily':
          return true
        case 'specific_days':
          return habit.frequency_days?.includes(dayOfWeek) || false
        case 'weekly':
        case 'monthly':
          // For weekly/monthly, we'll show them every day until completed
          return true
        default:
          return false
      }
    }) || []

    return todaysHabits
  }

  /**
   * Check if a habit is completed for a specific date
   */
  static async isCompletedToday(habitId: string, date: Date = new Date()): Promise<boolean> {
    const dateString = date.toISOString().split('T')[0] // YYYY-MM-DD format

    const { data, error } = await supabase
      .from(TABLES.HABIT_COMPLETIONS)
      .select('id')
      .eq('habit_id', habitId)
      .eq('completed_date', dateString)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to check habit completion: ${error.message}`)
    }

    return !!data
  }

  /**
   * Get habits with their completion status for today
   */
  static async getTodaysHabitsWithStatus(date: Date = new Date()): Promise<Array<Habit & { isCompleted: boolean }>> {
    const habits = await this.getTodaysHabits(date)
    const dateString = date.toISOString().split('T')[0]

    // Get all completions for today
    const { data: completions, error } = await supabase
      .from(TABLES.HABIT_COMPLETIONS)
      .select('habit_id')
      .eq('completed_date', dateString)

    if (error) {
      throw new Error(`Failed to get habit completions: ${error.message}`)
    }

    const completedHabitIds = new Set(completions?.map(c => c.habit_id) || [])

    return habits.map(habit => ({
      ...habit,
      isCompleted: completedHabitIds.has(habit.id)
    }))
  }
}

export class HabitCompletionService {
  /**
   * Mark a habit as completed for a specific date
   */
  static async complete(input: CreateHabitCompletionInput): Promise<HabitCompletion> {
    const { data, error } = await supabase
      .from(TABLES.HABIT_COMPLETIONS)
      .insert({
        ...input,
        completed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      // If it's a unique constraint violation, the habit is already completed
      if (error.code === '23505') {
        throw new Error('Habit already completed for this date')
      }
      throw new Error(`Failed to complete habit: ${error.message}`)
    }

    return data
  }

  /**
   * Remove a habit completion (uncheck)
   */
  static async uncomplete(habitId: string, date: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.HABIT_COMPLETIONS)
      .delete()
      .eq('habit_id', habitId)
      .eq('completed_date', date)

    if (error) {
      throw new Error(`Failed to uncomplete habit: ${error.message}`)
    }
  }

  /**
   * Get completion history for a habit
   */
  static async getCompletionHistory(habitId: string, limit: number = 30): Promise<HabitCompletion[]> {
    const { data, error } = await supabase
      .from(TABLES.HABIT_COMPLETIONS)
      .select()
      .eq('habit_id', habitId)
      .order('completed_date', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to get completion history: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get completion stats for a habit
   */
  static async getCompletionStats(habitId: string, days: number = 30): Promise<{
    total: number
    completed: number
    percentage: number
    streak: number
  }> {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days)

    const { data, error } = await supabase
      .from(TABLES.HABIT_COMPLETIONS)
      .select('completed_date')
      .eq('habit_id', habitId)
      .gte('completed_date', startDate.toISOString().split('T')[0])
      .lte('completed_date', endDate.toISOString().split('T')[0])
      .order('completed_date', { ascending: false })

    if (error) {
      throw new Error(`Failed to get completion stats: ${error.message}`)
    }

    const completed = data?.length || 0
    const percentage = days > 0 ? Math.round((completed / days) * 100) : 0

    // Calculate current streak
    let streak = 0
    const completedDates = new Set(data?.map(d => d.completed_date) || [])
    const today = new Date()

    for (let i = 0; i < days; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() - i)
      const dateString = checkDate.toISOString().split('T')[0]

      if (completedDates.has(dateString)) {
        streak++
      } else {
        break
      }
    }

    return {
      total: days,
      completed,
      percentage,
      streak
    }
  }
}