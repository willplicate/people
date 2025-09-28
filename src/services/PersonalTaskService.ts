import { supabase, TABLES } from '@/lib/supabase'
import { PersonalTask, CreatePersonalTaskInput, UpdatePersonalTaskInput } from '@/types/database'

export class PersonalTaskService {
  /**
   * Get all personal tasks with optional filtering
   */
  static async getAll(options?: {
    status?: PersonalTask['status']
    priority?: PersonalTask['priority']
    category?: string
    dueDateFrom?: Date
    dueDateTo?: Date
    limit?: number
    offset?: number
  }): Promise<PersonalTask[]> {
    let query = supabase
      .from(TABLES.TASKS)
      .select('*')
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

    if (options?.dueDateFrom) {
      query = query.gte('due_date', options.dueDateFrom.toISOString())
    }

    if (options?.dueDateTo) {
      query = query.lte('due_date', options.dueDateTo.toISOString())
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to get tasks: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get task by ID
   */
  static async getById(id: string): Promise<PersonalTask | null> {
    const { data, error } = await supabase
      .from(TABLES.TASKS)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to get task: ${error.message}`)
    }

    return data
  }

  /**
   * Create a new task
   */
  static async create(taskData: CreatePersonalTaskInput): Promise<PersonalTask> {
    const { data, error } = await supabase
      .from(TABLES.TASKS)
      .insert(taskData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create task: ${error.message}`)
    }

    return data
  }

  /**
   * Update an existing task
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

  /**
   * Mark task as completed
   */
  static async markCompleted(id: string): Promise<PersonalTask> {
    return this.update(id, {
      status: 'completed',
      completed_at: new Date().toISOString()
    })
  }

  /**
   * Mark task as todo (uncomplete)
   */
  static async markTodo(id: string): Promise<PersonalTask> {
    return this.update(id, {
      status: 'todo',
      completed_at: undefined
    })
  }

  /**
   * Get tasks by status
   */
  static async getByStatus(status: PersonalTask['status']): Promise<PersonalTask[]> {
    return this.getAll({ status })
  }

  /**
   * Get overdue tasks
   */
  static async getOverdue(): Promise<PersonalTask[]> {
    const now = new Date()
    const { data, error } = await supabase
      .from(TABLES.TASKS)
      .select('*')
      .lt('due_date', now.toISOString())
      .neq('status', 'completed')
      .neq('status', 'cancelled')
      .order('due_date', { ascending: true })

    if (error) {
      throw new Error(`Failed to get overdue tasks: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get tasks due today
   */
  static async getDueToday(): Promise<PersonalTask[]> {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)

    return this.getAll({
      dueDateFrom: startOfDay,
      dueDateTo: endOfDay
    })
  }

  /**
   * Get tasks due this week
   */
  static async getDueThisWeek(): Promise<PersonalTask[]> {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay()) // Start of week (Sunday)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6) // End of week (Saturday)

    return this.getAll({
      dueDateFrom: startOfWeek,
      dueDateTo: endOfWeek
    })
  }

  /**
   * Get all unique categories
   */
  static async getCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from(TABLES.TASKS)
      .select('category')
      .not('category', 'is', null)

    if (error) {
      throw new Error(`Failed to get categories: ${error.message}`)
    }

    const categories = [...new Set((data || []).map(item => item.category).filter(Boolean))]
    return categories.sort()
  }

  /**
   * Get task statistics
   */
  static async getStats(): Promise<{
    total: number
    todo: number
    inProgress: number
    completed: number
    cancelled: number
    overdue: number
    dueToday: number
    dueThisWeek: number
  }> {
    const [allTasks, overdueTasks, dueTodayTasks, dueThisWeekTasks] = await Promise.all([
      this.getAll(),
      this.getOverdue(),
      this.getDueToday(),
      this.getDueThisWeek()
    ])

    const stats = {
      total: allTasks.length,
      todo: allTasks.filter(t => t.status === 'todo').length,
      inProgress: allTasks.filter(t => t.status === 'in_progress').length,
      completed: allTasks.filter(t => t.status === 'completed').length,
      cancelled: allTasks.filter(t => t.status === 'cancelled').length,
      overdue: overdueTasks.length,
      dueToday: dueTodayTasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length,
      dueThisWeek: dueThisWeekTasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length
    }

    return stats
  }

  /**
   * Search tasks by title or description
   */
  static async search(query: string): Promise<PersonalTask[]> {
    const { data, error } = await supabase
      .from(TABLES.TASKS)
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to search tasks: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get task count
   */
  static async getCount(filters?: {
    status?: PersonalTask['status']
    priority?: PersonalTask['priority']
  }): Promise<number> {
    let query = supabase
      .from(TABLES.TASKS)
      .select('*', { count: 'exact', head: true })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.priority) {
      query = query.eq('priority', filters.priority)
    }

    const { count, error } = await query

    if (error) {
      throw new Error(`Failed to get task count: ${error.message}`)
    }

    return count || 0
  }

  /**
   * Clean up completed tasks older than 4 hours
   */
  static async cleanupOldCompletedTasks(): Promise<{ deletedCount: number }> {
    const fourHoursAgo = new Date()
    fourHoursAgo.setHours(fourHoursAgo.getHours() - 4)

    const { data, error } = await supabase
      .from(TABLES.TASKS)
      .delete()
      .eq('status', 'completed')
      .lt('completed_at', fourHoursAgo.toISOString())
      .select()

    if (error) {
      throw new Error(`Failed to cleanup old completed tasks: ${error.message}`)
    }

    return { deletedCount: (data || []).length }
  }

  /**
   * Get important tasks categorized by work/personal for dashboard
   */
  static async getImportantTasks(): Promise<{
    work: PersonalTask[]
    personal: PersonalTask[]
  }> {
    // Get pending tasks ordered by priority (urgent, high, medium, low)
    const tasks = await this.getAll({
      limit: 20 // Get more than needed to ensure we have enough after filtering
    })

    // Filter out completed and cancelled tasks
    const activeTasks = tasks.filter(task =>
      task.status === 'todo' || task.status === 'in_progress'
    )

    // Sort by priority order (urgent -> high -> medium -> low) and then by created date
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
    const sortedTasks = activeTasks.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff

      // If same priority, sort by due date (if exists), then created date
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      }
      if (a.due_date && !b.due_date) return -1
      if (!a.due_date && b.due_date) return 1

      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })

    // Categorize tasks
    const workTasks = sortedTasks
      .filter(task => task.category === 'work')
      .slice(0, 3)

    const personalTasks = sortedTasks
      .filter(task => task.category === 'personal')
      .slice(0, 3)

    return {
      work: workTasks,
      personal: personalTasks
    }
  }
}