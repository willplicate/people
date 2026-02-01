'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UrgentTaskService, UrgentTask } from '@/services/UrgentTaskService'

export default function UrgentTasks() {
  const router = useRouter()
  const [urgentTasks, setUrgentTasks] = useState<UrgentTask[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)

  useEffect(() => {
    async function loadTasks() {
      try {
        const tasks = await UrgentTaskService.getUrgentTasks()
        setUrgentTasks(tasks)
      } catch (error) {
        console.error('Failed to load urgent tasks:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTasks()
  }, [])

  const handleTaskComplete = async (taskId: string, isCompleted: boolean, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await UrgentTaskService.updateUrgentTask(taskId, { is_completed: !isCompleted })
      // Remove completed tasks from the list
      setUrgentTasks(prev => prev.filter(task => task.id !== taskId))
    } catch (error) {
      console.error('Failed to complete task:', error)
    }
  }

  if (loading) {
    return (
      <div className="bg-red-50 border border-destructive/20 rounded-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium text-destructive">Urgent Tasks</h2>
        </div>
        <div className="text-center py-4 text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="bg-red-50 border border-destructive/20 rounded-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-medium text-destructive">Urgent Tasks</h2>
        {urgentTasks.length > 0 && urgentTasks[0].timeLeft && (
          <div className="bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-sm font-medium">
            {urgentTasks[0].timeLeft}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {urgentTasks.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No urgent tasks
          </div>
        ) : (
          urgentTasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-md border border-destructive/10"
            >
              <div
                className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
              >
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={task.is_completed}
                    onChange={(e) => handleTaskComplete(task.id, task.is_completed, e as any)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-0.5 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-medium ${task.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <span className="text-xs text-gray-400">
                          {expandedTaskId === task.id ? '▼' : '▶'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded details */}
              {expandedTaskId === task.id && task.description && (
                <div className="px-3 pb-3 pt-0 border-t border-gray-100 bg-gray-50">
                  <div className={`text-sm mt-2 whitespace-pre-wrap ${task.is_completed ? 'line-through text-muted-foreground' : 'text-gray-700'}`}>
                    {task.description}
                  </div>
                  <p className="text-xs text-destructive mt-2">
                    Created: {new Date(task.created_at).toLocaleDateString()}
                  </p>
                  {task.is_completed && task.completed_at && (
                    <p className="text-xs text-green-600 mt-1">
                      Completed: {new Date(task.completed_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}