import { supabase, TABLES } from '@/lib/supabase'
import {
  LifeHabit,
  LifeHabitLog,
  LifeCoachMessage,
  LifeInsight,
  CreateLifeHabitInput,
  UpdateLifeHabitInput,
  CreateLifeHabitLogInput,
  CreateLifeCoachMessageInput,
  CreateLifeInsightInput,
} from '@/types/database'

export class LifeCoachService {
  // ========== HABITS ==========

  /**
   * Create a new habit
   */
  static async createHabit(input: CreateLifeHabitInput): Promise<LifeHabit> {
    const { data, error } = await supabase
      .from(TABLES.LIFE_HABITS)
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
  static async getHabitById(id: string): Promise<LifeHabit | null> {
    const { data, error } = await supabase
      .from(TABLES.LIFE_HABITS)
      .select()
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to get habit: ${error.message}`)
    }

    return data
  }

  /**
   * Get all habits for a user
   */
  static async getHabitsByUserId(userId: string): Promise<LifeHabit[]> {
    const { data, error } = await supabase
      .from(TABLES.LIFE_HABITS)
      .select()
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to get habits: ${error.message}`)
    }

    return data || []
  }

  /**
   * Update a habit
   */
  static async updateHabit(
    id: string,
    input: UpdateLifeHabitInput
  ): Promise<LifeHabit> {
    const { data, error } = await supabase
      .from(TABLES.LIFE_HABITS)
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
   * Delete a habit (cascades to logs)
   */
  static async deleteHabit(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.LIFE_HABITS)
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete habit: ${error.message}`)
    }
  }

  // ========== HABIT LOGS ==========

  /**
   * Log a habit completion
   */
  static async logHabitCompletion(
    input: CreateLifeHabitLogInput
  ): Promise<LifeHabitLog> {
    const { data, error } = await supabase
      .from(TABLES.LIFE_HABIT_LOGS)
      .upsert(input, {
        onConflict: 'habit_id,log_date',
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to log habit completion: ${error.message}`)
    }

    // Update streak if completed
    if (input.completed) {
      await this.updateHabitStreak(input.habit_id)
    }

    return data
  }

  /**
   * Get habit log for a specific date
   */
  static async getHabitLog(
    habitId: string,
    logDate: string
  ): Promise<LifeHabitLog | null> {
    const { data, error } = await supabase
      .from(TABLES.LIFE_HABIT_LOGS)
      .select()
      .eq('habit_id', habitId)
      .eq('log_date', logDate)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to get habit log: ${error.message}`)
    }

    return data
  }

  /**
   * Get habit logs for a date range
   */
  static async getHabitLogs(
    habitId: string,
    startDate: string,
    endDate: string
  ): Promise<LifeHabitLog[]> {
    const { data, error } = await supabase
      .from(TABLES.LIFE_HABIT_LOGS)
      .select()
      .eq('habit_id', habitId)
      .gte('log_date', startDate)
      .lte('log_date', endDate)
      .order('log_date', { ascending: false })

    if (error) {
      throw new Error(`Failed to get habit logs: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get all habit logs for today
   */
  static async getTodayHabitLogs(userId: string): Promise<LifeHabitLog[]> {
    const today = new Date().toISOString().split('T')[0]

    // First get all habits for user
    const habits = await this.getHabitsByUserId(userId)
    const habitIds = habits.map((h) => h.id)

    if (habitIds.length === 0) {
      return []
    }

    const { data, error } = await supabase
      .from(TABLES.LIFE_HABIT_LOGS)
      .select()
      .in('habit_id', habitIds)
      .eq('log_date', today)

    if (error) {
      throw new Error(`Failed to get today's habit logs: ${error.message}`)
    }

    return data || []
  }

  /**
   * Update habit streak based on recent completions
   */
  private static async updateHabitStreak(habitId: string): Promise<void> {
    const habit = await this.getHabitById(habitId)
    if (!habit) return

    const today = new Date()
    const last30Days = new Date(today)
    last30Days.setDate(last30Days.getDate() - 30)

    const logs = await this.getHabitLogs(
      habitId,
      last30Days.toISOString().split('T')[0],
      today.toISOString().split('T')[0]
    )

    // Calculate current streak
    let currentStreak = 0
    const sortedLogs = logs.sort(
      (a, b) =>
        new Date(b.log_date).getTime() - new Date(a.log_date).getTime()
    )

    for (const log of sortedLogs) {
      if (log.completed) {
        currentStreak++
      } else {
        break
      }
    }

    // Update habit with new streak
    const longestStreak = Math.max(habit.longest_streak, currentStreak)

    await this.updateHabit(habitId, {
      current_streak: currentStreak,
      longest_streak: longestStreak,
    })
  }

  // ========== CHAT MESSAGES ==========

  /**
   * Save a chat message
   */
  static async saveChatMessage(
    input: CreateLifeCoachMessageInput
  ): Promise<LifeCoachMessage> {
    const { data, error } = await supabase
      .from(TABLES.LIFE_COACH_MESSAGES)
      .insert(input)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to save chat message: ${error.message}`)
    }

    return data
  }

  /**
   * Get chat messages for a specific date
   */
  static async getChatMessagesByDate(
    userId: string,
    messageDate: string
  ): Promise<LifeCoachMessage[]> {
    const { data, error } = await supabase
      .from(TABLES.LIFE_COACH_MESSAGES)
      .select()
      .eq('user_id', userId)
      .eq('message_date', messageDate)
      .order('timestamp', { ascending: true })

    if (error) {
      throw new Error(`Failed to get chat messages: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get recent chat messages (last N days)
   */
  static async getRecentChatMessages(
    userId: string,
    days: number = 7
  ): Promise<LifeCoachMessage[]> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from(TABLES.LIFE_COACH_MESSAGES)
      .select()
      .eq('user_id', userId)
      .gte('message_date', startDate.toISOString().split('T')[0])
      .order('timestamp', { ascending: true })

    if (error) {
      throw new Error(`Failed to get recent chat messages: ${error.message}`)
    }

    return data || []
  }

  // ========== INSIGHTS ==========

  /**
   * Create a new insight
   */
  static async createInsight(
    input: CreateLifeInsightInput
  ): Promise<LifeInsight> {
    const { data, error } = await supabase
      .from(TABLES.LIFE_INSIGHTS)
      .insert(input)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create insight: ${error.message}`)
    }

    return data
  }

  /**
   * Get insights for a user
   */
  static async getInsightsByUserId(
    userId: string,
    limit: number = 10
  ): Promise<LifeInsight[]> {
    const { data, error } = await supabase
      .from(TABLES.LIFE_INSIGHTS)
      .select()
      .eq('user_id', userId)
      .order('insight_date', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to get insights: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get insights by pattern type
   */
  static async getInsightsByPattern(
    userId: string,
    patternType: string
  ): Promise<LifeInsight[]> {
    const { data, error } = await supabase
      .from(TABLES.LIFE_INSIGHTS)
      .select()
      .eq('user_id', userId)
      .eq('pattern_type', patternType)
      .order('insight_date', { ascending: false })

    if (error) {
      throw new Error(`Failed to get insights by pattern: ${error.message}`)
    }

    return data || []
  }
}
