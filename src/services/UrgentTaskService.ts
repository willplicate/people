import { supabase } from '@/lib/supabase';

export interface UrgentTask {
  id: string;
  title: string;
  description?: string;
  is_completed: boolean;
  order_index: number;
  original_task_id?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface CreateUrgentTaskData {
  title: string;
  description?: string;
  original_task_id?: string;
}

export interface UpdateUrgentTaskData {
  title?: string;
  description?: string;
  is_completed?: boolean;
  order_index?: number;
}

export class UrgentTaskService {
  static async getUrgentTasks(): Promise<UrgentTask[]> {
    const { data, error } = await supabase
      .from('urgent_tasks')
      .select('*')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch urgent tasks: ${error.message}`);
    }

    return data || [];
  }

  static async createUrgentTask(taskData: CreateUrgentTaskData): Promise<UrgentTask> {
    // Get the next order index
    const { data: lastTask } = await supabase
      .from('urgent_tasks')
      .select('order_index')
      .order('order_index', { ascending: false })
      .limit(1);

    const nextOrderIndex = lastTask && lastTask.length > 0 ? lastTask[0].order_index + 1 : 0;

    const { data, error } = await supabase
      .from('urgent_tasks')
      .insert([{
        ...taskData,
        order_index: nextOrderIndex,
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create urgent task: ${error.message}`);
    }

    return data;
  }

  static async updateUrgentTask(id: string, updates: UpdateUrgentTaskData): Promise<UrgentTask> {
    const updateData: any = { ...updates };

    // If marking as completed, set completed_at timestamp and update original task
    if (updates.is_completed === true) {
      updateData.completed_at = new Date().toISOString();

      // Get the urgent task to find original_task_id
      const { data: urgentTask } = await supabase
        .from('urgent_tasks')
        .select('original_task_id')
        .eq('id', id)
        .single();

      // If there's an original task, mark it as completed too
      if (urgentTask?.original_task_id) {
        await supabase
          .from('personal_tasks')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', urgentTask.original_task_id);
      }
    } else if (updates.is_completed === false) {
      updateData.completed_at = null;

      // Get the urgent task to find original_task_id
      const { data: urgentTask } = await supabase
        .from('urgent_tasks')
        .select('original_task_id')
        .eq('id', id)
        .single();

      // If there's an original task, mark it as todo
      if (urgentTask?.original_task_id) {
        await supabase
          .from('personal_tasks')
          .update({
            status: 'todo',
            completed_at: null
          })
          .eq('id', urgentTask.original_task_id);
      }
    }

    const { data, error } = await supabase
      .from('urgent_tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update urgent task: ${error.message}`);
    }

    return data;
  }

  static async deleteUrgentTask(id: string): Promise<void> {
    const { error } = await supabase
      .from('urgent_tasks')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete urgent task: ${error.message}`);
    }
  }

  static async reorderUrgentTasks(taskUpdates: { id: string; order_index: number }[]): Promise<void> {
    const updates = taskUpdates.map(update =>
      supabase
        .from('urgent_tasks')
        .update({ order_index: update.order_index })
        .eq('id', update.id)
    );

    const results = await Promise.all(updates);

    for (const result of results) {
      if (result.error) {
        throw new Error(`Failed to reorder urgent tasks: ${result.error.message}`);
      }
    }
  }

  static async moveTaskToUrgent(taskId: string, taskTitle: string, taskDescription?: string): Promise<UrgentTask> {
    // Check if this task is already in urgent list
    const { data: existingUrgent } = await supabase
      .from('urgent_tasks')
      .select('id')
      .eq('original_task_id', taskId)
      .eq('is_completed', false);

    if (existingUrgent && existingUrgent.length > 0) {
      throw new Error('Task is already in urgent list');
    }

    // Create urgent task from existing task
    return this.createUrgentTask({
      title: taskTitle,
      description: taskDescription,
      original_task_id: taskId
    });
  }
}