'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UrgentTaskService, UrgentTask } from '@/services/UrgentTaskService'

export default function UrgentTasks() {
  const router = useRouter()
  const [urgentTasks, setUrgentTasks] = useState<UrgentTask[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTasks() {
      try {
        const tasks = await UrgentTaskService.getUrgentTasks()
        setUrgentTasks(tasks.filter(task => !task.is_completed))
      } catch (error) {
        console.error('Failed to load urgent tasks:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTasks()
  }, [])

  const handleTaskClick = (task: UrgentTask) => {
    router.push('/urgent-tasks')
  }

  const handleTaskComplete = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent navigation when clicking checkbox
    try {
      await UrgentTaskService.markCompleted(taskId)
      // Remove the task from local state immediately
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
              className="bg-white rounded-md p-3 border border-destructive/10 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => handleTaskClick(task)}
            >
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={false}
                  onChange={(e) => handleTaskComplete(task.id, e as any)}
                  onClick={(e) => handleTaskComplete(task.id, e)}
                  className="mt-0.5 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <h3 className="font-medium text-foreground mb-1">{task.title}</h3>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mb-1">{task.description}</p>
                  )}
                  <p className="text-xs text-destructive">Created: {new Date(task.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}