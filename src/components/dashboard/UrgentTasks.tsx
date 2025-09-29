'use client'

import { useState, useEffect } from 'react'
import { UrgentTaskService, UrgentTask } from '@/services/UrgentTaskService'

export default function UrgentTasks() {
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
            <div key={task.id} className="bg-white rounded-md p-3 border border-destructive/10">
              <h3 className="font-medium text-foreground mb-1">{task.title}</h3>
              {task.description && (
                <p className="text-sm text-muted-foreground mb-1">{task.description}</p>
              )}
              <p className="text-xs text-destructive">Created: {new Date(task.created_at).toLocaleDateString()}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}