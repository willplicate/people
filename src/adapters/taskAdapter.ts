import { PersonalTask } from '@/types/database'
import { SpreadsheetItem, StatusColor } from '@/types/unified'
import { formatDistanceToNow } from 'date-fns'

/**
 * Map task status to status pill color
 */
function taskStatusToColor(status: PersonalTask['status']): StatusColor {
  const colorMap: Record<PersonalTask['status'], StatusColor> = {
    todo: 'gray',
    in_progress: 'blue',
    completed: 'green',
    cancelled: 'red',
  }
  return colorMap[status] || 'gray'
}

/**
 * Map task priority to favorite status (urgent/high = starred)
 */
function isPriorityHigh(priority: PersonalTask['priority']): boolean {
  return priority === 'urgent' || priority === 'high'
}

/**
 * Format task activity text (due date or completion)
 */
function formatTaskActivity(task: PersonalTask): string {
  if (task.status === 'completed' && task.completed_at) {
    return `Completed ${formatDistanceToNow(new Date(task.completed_at), { addSuffix: true })}`
  }

  if (task.due_date) {
    const dueDate = new Date(task.due_date)
    const now = new Date()
    const isOverdue = dueDate < now && task.status !== 'completed'

    if (isOverdue) {
      return `Overdue ${formatDistanceToNow(dueDate, { addSuffix: true })}`
    }

    return `Due ${formatDistanceToNow(dueDate, { addSuffix: true })}`
  }

  return 'No due date'
}

/**
 * Format task status label
 */
function formatStatusLabel(status: PersonalTask['status']): string {
  const labelMap: Record<PersonalTask['status'], string> = {
    todo: 'To Do',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }
  return labelMap[status]
}

/**
 * Transform PersonalTask to SpreadsheetItem
 */
export function taskToSpreadsheetItem(task: PersonalTask): SpreadsheetItem {
  return {
    id: task.id,
    name: task.title,
    type: 'task',
    isFavorite: isPriorityHigh(task.priority),
    status: {
      label: formatStatusLabel(task.status),
      color: taskStatusToColor(task.status),
    },
    activity: formatTaskActivity(task),
    dueDate: task.due_date ? new Date(task.due_date) : undefined,
    metadata: task,
  }
}

/**
 * Transform multiple tasks to spreadsheet items
 */
export function tasksToSpreadsheetItems(tasks: PersonalTask[]): SpreadsheetItem[] {
  return tasks.map(taskToSpreadsheetItem)
}
