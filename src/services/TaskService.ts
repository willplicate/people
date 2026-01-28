import { supabase, TABLES } from '@/lib/supabase'
import { PersonalTask, CreatePersonalTaskInput, UpdatePersonalTaskInput } from '@/types/database'

/**
 * TaskService - Manage personal tasks
 */
export class TaskService {
  /**
   * Create a new task
   */
  static async create(input: CreatePersonalTaskInput): Promise<PersonalTask> {
    const { data, error } = await supabase
      .from(TABLES.TASKS)
      .insert(input)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create task: ${error.message}`)
    }

    return data
  }

  /**
   * Get all tasks with optional filtering
   */
  static async getAll(options?: {
    status?: PersonalTask['status']
    priority?: PersonalTask['priority']
    category?: PersonalTask['category']
    limit?: number
  }): Promise<PersonalTask[]> {
    let query = supabase
      .from(TABLES.TASKS)
      .select()
      .order('created_at', { ascending: false })

    if (options?.status) {
      query = query.eq('status', options.status)
    }

    if (options?.priority) {
      query = query.eq('priority', options.priority)
    }

    if (options?.category) {
      query = query.eq('category', options.category)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to get tasks: ${error.message}`)
    }

    return data || []
  }

  /**
   * Update a task
   */
  static async update(id: string, updates: UpdatePersonalTaskInput): Promise<PersonalTask> {
    const { data, error } = await supabase
      .from(TABLES.TASKS)
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update task: ${error.message}`)
    }

    return data
  }

  /**
   * Mark task as completed
   */
  static async markComplete(id: string): Promise<PersonalTask> {
    return this.update(id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
  }

  /**
   * Delete a task
   */
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.TASKS)
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete task: ${error.message}`)
    }
  }
}
