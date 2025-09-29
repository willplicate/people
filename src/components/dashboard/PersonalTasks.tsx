'use client'

import { useState, useEffect } from 'react'
import { PersonalTaskService } from '@/services/PersonalTaskService'
import { PersonalTask } from '@/types/database'

export default function PersonalTasks() {
  const [personalTasks, setPersonalTasks] = useState<PersonalTask[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTasks() {
      try {
        const tasks = await PersonalTaskService.getAll({
          status: 'todo',
          category: 'personal',
          limit: 5
        })
        setPersonalTasks(tasks)
      } catch (error) {
        console.error('Failed to load personal tasks:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTasks()
  }, [])

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-card">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-foreground">Personal Tasks</h2>
          <button className="text-tertiary text-sm font-medium">View All</button>
        </div>
        <div className="p-4 text-center text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-card">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-foreground">Personal Tasks</h2>
        <button className="text-tertiary text-sm font-medium">View All</button>
      </div>

      <div className="p-4 space-y-3">
        {personalTasks.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No personal tasks
          </div>
        ) : (
          personalTasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-md transition-colors">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  task.priority === 'high' ? 'bg-destructive' :
                  task.priority === 'medium' ? 'bg-yellow-500' :
                  'bg-secondary'
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
              <button className="text-gray-400 hover:text-gray-600">
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