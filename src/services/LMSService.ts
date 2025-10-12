/**
 * LMSService - Database operations for Learning Management System
 *
 * PURPOSE:
 *   - Centralize all Supabase queries for LMS
 *   - Provide clean API for fetching programs, weeks, topics, sessions
 *   - Handle error cases consistently
 *
 * USED BY:
 *   - API routes (/api/learning/*)
 *   - Can also be used directly in server components
 */

import { supabase, TABLES } from '@/lib/supabase'
import {
  LearningProgram,
  LearningWeek,
  LearningTopic,
  LearningSession,
  WeekProgress,
  RecentSession,
  CreateSessionInput,
  CreateProgramInput,
  CreateWeekInput,
  CreateTopicInput,
  UpdateTopicInput
} from '@/types/lms'

/**
 * ProgramService - Operations on learning_programs table
 */
export class ProgramService {
  /**
   * Get the active program (assumes single-user, single active program)
   */
  static async getActiveProgram(): Promise<LearningProgram | null> {
    const { data, error } = await supabase
      .from(TABLES.LEARNING_PROGRAMS)
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Error fetching program:', error)
      throw new Error(`Failed to fetch program: ${error.message}`)
    }

    return data
  }

  /**
   * Create a new learning program
   */
  static async create(input: CreateProgramInput): Promise<LearningProgram> {
    const { data, error } = await supabase
      .from(TABLES.LEARNING_PROGRAMS)
      .insert(input)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create program: ${error.message}`)
    }

    return data
  }
}

/**
 * WeekService - Operations on learning_weeks table
 */
export class WeekService {
  /**
   * Get all weeks for a program
   */
  static async getAllByProgram(programId: string): Promise<LearningWeek[]> {
    const { data, error } = await supabase
      .from(TABLES.LEARNING_WEEKS)
      .select('*')
      .eq('program_id', programId)
      .order('week_number', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch weeks: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get a specific week by week number
   */
  static async getByWeekNumber(programId: string, weekNumber: number): Promise<LearningWeek | null> {
    const { data, error } = await supabase
      .from(TABLES.LEARNING_WEEKS)
      .select('*')
      .eq('program_id', programId)
      .eq('week_number', weekNumber)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to fetch week ${weekNumber}: ${error.message}`)
    }

    return data
  }

  /**
   * Create a new week
   */
  static async create(input: CreateWeekInput): Promise<LearningWeek> {
    const { data, error } = await supabase
      .from(TABLES.LEARNING_WEEKS)
      .insert(input)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create week: ${error.message}`)
    }

    return data
  }
}

/**
 * TopicService - Operations on learning_topics table
 */
export class TopicService {
  /**
   * Get all topics for a week
   */
  static async getByWeek(weekId: string): Promise<LearningTopic[]> {
    const { data, error } = await supabase
      .from(TABLES.LEARNING_TOPICS)
      .select('*')
      .eq('week_id', weekId)
      .order('topic_order', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch topics: ${error.message}`)
    }

    return data || []
  }

  /**
   * Update topic (e.g., mark as completed)
   */
  static async update(topicId: string, input: UpdateTopicInput): Promise<LearningTopic> {
    // If marking as completed, set completed_at
    const updateData = {
      ...input,
      ...(input.is_completed && { completed_at: new Date().toISOString() })
    }

    const { data, error } = await supabase
      .from(TABLES.LEARNING_TOPICS)
      .update(updateData)
      .eq('id', topicId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update topic: ${error.message}`)
    }

    return data
  }

  /**
   * Create a new topic
   */
  static async create(input: CreateTopicInput): Promise<LearningTopic> {
    const { data, error } = await supabase
      .from(TABLES.LEARNING_TOPICS)
      .insert(input)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create topic: ${error.message}`)
    }

    return data
  }
}

/**
 * SessionService - Operations on learning_sessions table
 */
export class SessionService {
  /**
   * Create a new learning session
   */
  static async create(input: CreateSessionInput): Promise<LearningSession> {
    const { data, error } = await supabase
      .from(TABLES.LEARNING_SESSIONS)
      .insert(input)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create session: ${error.message}`)
    }

    return data
  }

  /**
   * Get recent sessions for a week
   */
  static async getByWeek(weekId: string, limit: number = 10): Promise<LearningSession[]> {
    const { data, error } = await supabase
      .from(TABLES.LEARNING_SESSIONS)
      .select('*')
      .eq('week_id', weekId)
      .order('session_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to fetch sessions: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get recent sessions with context (uses the view)
   */
  static async getRecent(limit: number = 20): Promise<RecentSession[]> {
    const { data, error } = await supabase
      .from('recent_learning_sessions')
      .select('*')
      .limit(limit)

    if (error) {
      throw new Error(`Failed to fetch recent sessions: ${error.message}`)
    }

    return data || []
  }
}

/**
 * ProgressService - Operations on week_progress_summary view
 */
export class ProgressService {
  /**
   * Get progress summary for all weeks in a program
   */
  static async getWeekProgress(programId: string): Promise<WeekProgress[]> {
    const { data, error } = await supabase
      .from('week_progress_summary')
      .select('*')
      .eq('program_id', programId)
      .order('week_number', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch progress: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get progress for a specific week
   */
  static async getWeekProgressByNumber(
    programId: string,
    weekNumber: number
  ): Promise<WeekProgress | null> {
    const { data, error } = await supabase
      .from('week_progress_summary')
      .select('*')
      .eq('program_id', programId)
      .eq('week_number', weekNumber)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to fetch week progress: ${error.message}`)
    }

    return data
  }
}
