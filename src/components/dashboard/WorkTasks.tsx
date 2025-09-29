'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PersonalTaskService } from '@/services/PersonalTaskService'
import { PersonalTask } from '@/types/database'

export default function WorkTasks() {
  const router = useRouter()
  const [workTasks, setWorkTasks] = useState<PersonalTask[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTasks() {
      try {
        const tasks = await PersonalTaskService.getAll({
          status: 'todo',
          category: 'work',
          limit: 5
        })
        setWorkTasks(tasks)
      } catch (error) {
        console.error('Failed to load work tasks:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTasks()
  }, [])

  const handleTaskClick = () => {
    router.push('/tasks')
  }

  const handleTaskComplete = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await PersonalTaskService.update(taskId, {
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      // Remove the task from local state immediately
      setWorkTasks(prev => prev.filter(task => task.id !== taskId))
    } catch (error) {
      console.error('Failed to complete task:', error)
    }
  }

  const handleViewAll = () => {
    router.push('/tasks')
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-card">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-foreground">Work Tasks</h2>
          <button className="text-tertiary text-sm font-medium">View All</button>
        </div>
        <div className="p-4 text-center text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-card">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-foreground">Work Tasks</h2>
        <button
          onClick={handleViewAll}
          className="text-tertiary text-sm font-medium hover:text-tertiary/80"
        >
          View All
        </button>
      </div>

      <div className="p-4 space-y-3">
        {workTasks.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No work tasks
          </div>
        ) : (
          workTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-md transition-colors cursor-pointer"
              onClick={handleTaskClick}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  task.priority === 'high' ? 'bg-destructive' :
                  task.priority === 'medium' ? 'bg-yellow-500' :
                  'bg-tertiary'
                }`}></div>
                <div>
                  <h3 className="font-medium text-foreground">{task.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {task.due_date
                      ? `Due ${new Date(task.due_date).toLocaleDateString()}`
                      : 'No due date'
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => handleTaskComplete(task.id, e)}
                className="text-gray-400 hover:text-green-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}