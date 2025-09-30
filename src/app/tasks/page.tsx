'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PersonalTask } from '@/types/database'
import { PersonalTaskService } from '@/services/PersonalTaskService'
import { UrgentTaskService } from '@/services/UrgentTaskService'
import HabitTracker from '@/components/HabitTracker'

interface TasksPageData {
  tasks: PersonalTask[]
  totalCount: number
  stats: {
    total: number
    todo: number
    inProgress: number
    completed: number
    overdue: number
    dueToday: number
  }
}

export default function TasksPage() {
  const router = useRouter()
  const [data, setData] = useState<TasksPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewTaskForm, setShowNewTaskForm] = useState(false)
  const [editingTask, setEditingTask] = useState<PersonalTask | null>(null)
  const [newTask, setNewTask] = useState<{
    title: string
    description: string
    priority: 'medium'
    category: 'work' | 'personal'
    due_date: string
  }>({
    title: '',
    description: '',
    priority: 'medium',
    category: 'personal',
    due_date: ''
  })

  useEffect(() => {
    fetchTasks()
    cleanupOldTasks()
  }, [statusFilter, priorityFilter, searchQuery])

  // Set up periodic cleanup every 15 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      cleanupOldTasks()
    }, 15 * 60 * 1000) // 15 minutes

    return () => clearInterval(interval)
  }, [])

  const cleanupOldTasks = async () => {
    try {
      // Cleanup old completed tasks locally - remove tasks completed more than 24 hours ago
      // This could be implemented in PersonalTaskService if needed
      console.log('Cleanup old tasks - placeholder')
    } catch (err) {
      console.warn('Failed to cleanup old tasks:', err)
    }
  }

  const fetchTasks = async () => {
    try {
      setLoading(true)

      // Get all tasks and filter them client-side
      const allTasks = await PersonalTaskService.getAll()

      // Apply filters
      let filteredTasks = allTasks

      if (statusFilter !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.status === statusFilter)
      }

      if (priorityFilter !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.priority === priorityFilter)
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        filteredTasks = filteredTasks.filter(task =>
          task.title.toLowerCase().includes(query) ||
          (task.description && task.description.toLowerCase().includes(query))
        )
      }

      // Calculate stats
      const stats = {
        total: allTasks.length,
        todo: allTasks.filter(t => t.status === 'todo').length,
        inProgress: allTasks.filter(t => t.status === 'in_progress').length,
        completed: allTasks.filter(t => t.status === 'completed').length,
        overdue: allTasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed').length,
        dueToday: allTasks.filter(t => {
          if (!t.due_date || t.status === 'completed') return false
          const today = new Date().toDateString()
          return new Date(t.due_date).toDateString() === today
        }).length
      }

      setData({
        tasks: filteredTasks,
        totalCount: filteredTasks.length,
        stats
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTask = async () => {
    try {
      await PersonalTaskService.create({
        ...newTask,
        due_date: newTask.due_date || undefined
      })

      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        category: 'personal',
        due_date: ''
      })
      setShowNewTaskForm(false)
      fetchTasks()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task')
    }
  }

  const handleEditTask = (task: PersonalTask) => {
    setEditingTask(task)
    setShowNewTaskForm(false) // Close new task form if open
  }

  const handleUpdateTask = async () => {
    if (!editingTask) return

    try {
      await PersonalTaskService.update(editingTask.id, {
        title: editingTask.title,
        description: editingTask.description,
        priority: editingTask.priority,
        category: editingTask.category,
        due_date: editingTask.due_date || undefined
      })

      setEditingTask(null)
      fetchTasks()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task')
    }
  }

  const handleCancelEdit = () => {
    setEditingTask(null)
  }

  const handleToggleTaskStatus = async (task: PersonalTask) => {
    try {
      const newStatus = task.status === 'completed' ? 'todo' : 'completed'
      await PersonalTaskService.update(task.id, {
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : undefined
      })
      fetchTasks()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task')
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      await PersonalTaskService.delete(taskId)
      fetchTasks()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task')
    }
  }

  const handleMoveToUrgent = async (task: PersonalTask) => {
    try {
      // Move task to urgent list
      await UrgentTaskService.moveTaskToUrgent(
        task.id,
        task.title,
        task.description || undefined
      )

      // Show success message
      alert('Task moved to urgent list!')

      // Refresh tasks
      fetchTasks()

      // Optional: Navigate to urgent tasks page
      // router.push('/urgent-tasks')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to move task to urgent'
      alert(errorMessage)
      setError(errorMessage)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const isOverdue = (task: PersonalTask) => {
    if (!task.due_date || task.status === 'completed') return false
    return new Date(task.due_date) < new Date()
  }

  const shouldHideCompletedTask = (task: PersonalTask) => {
    if (task.status !== 'completed' || !task.completed_at) return false
    const completedDate = new Date(task.completed_at)
    const fourHoursAgo = new Date()
    fourHoursAgo.setHours(fourHoursAgo.getHours() - 4)
    return completedDate < fourHoursAgo
  }

  const filterVisibleTasks = (tasks: PersonalTask[]) => {
    return tasks.filter(task => !shouldHideCompletedTask(task))
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4">
        <div className="animate-pulse space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-destructive p-4 bg-destructive/10 rounded-lg">
          Error: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tasks & Habits</h1>
          <p className="mt-2 text-muted-foreground">Manage your personal to-do list and track daily habits</p>
        </div>
        <button
          onClick={() => setShowNewTaskForm(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/80"
        >
          Add Task
        </button>
      </div>

      {/* New Task Form */}
      {showNewTaskForm && (
        <div className="bg-card p-6 rounded-lg border border-border mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">Add New Task</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">Title</label>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Task title..."
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">Description</label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Task description..."
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Priority</label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Category</label>
              <select
                value={newTask.category}
                onChange={(e) => setNewTask(prev => ({ ...prev, category: e.target.value as 'work' | 'personal' }))}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              >
                <option value="personal">Personal</option>
                <option value="work">Work</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">Due Date</label>
              <input
                type="datetime-local"
                value={newTask.due_date}
                onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={() => setShowNewTaskForm(false)}
              className="px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateTask}
              disabled={!newTask.title.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 disabled:opacity-50"
            >
              Create Task
            </button>
          </div>
        </div>
      )}

      {/* Edit Task Form */}
      {editingTask && (
        <div className="bg-card p-6 rounded-lg border border-border mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">Edit Task</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">Title</label>
              <input
                type="text"
                value={editingTask.title}
                onChange={(e) => setEditingTask(prev => prev ? ({ ...prev, title: e.target.value }) : null)}
                placeholder="Task title..."
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">Description</label>
              <textarea
                value={editingTask.description || ''}
                onChange={(e) => setEditingTask(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                placeholder="Task description..."
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Priority</label>
              <select
                value={editingTask.priority}
                onChange={(e) => setEditingTask(prev => prev ? ({ ...prev, priority: e.target.value as any }) : null)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Category</label>
              <select
                value={editingTask.category || 'personal'}
                onChange={(e) => setEditingTask(prev => prev ? ({ ...prev, category: e.target.value as 'work' | 'personal' }) : null)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              >
                <option value="personal">Personal</option>
                <option value="work">Work</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">Due Date</label>
              <input
                type="datetime-local"
                value={editingTask.due_date ? new Date(editingTask.due_date).toISOString().slice(0, 16) : ''}
                onChange={(e) => setEditingTask(prev => prev ? ({ ...prev, due_date: e.target.value }) : null)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateTask}
              disabled={!editingTask.title.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 disabled:opacity-50"
            >
              Update Task
            </button>
          </div>
        </div>
      )}

      {/* Two-column layout: Tasks and Habits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Tasks */}
        <div className="space-y-6">

          {/* Work Tasks Card */}
          <div className="bg-card p-6 rounded-lg border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">💼 Work Tasks</h3>
            <div className="space-y-3">
              {filterVisibleTasks(data?.tasks || []).filter(task => task.category === 'work').length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                    ? 'No work tasks found matching your filters.'
                    : 'No work tasks yet. Create your first work task!'}
                </div>
              ) : (
                filterVisibleTasks(data?.tasks || []).filter(task => task.category === 'work').map((task) => (
                  <div
                    key={task.id}
                    className={`p-3 border rounded-lg bg-background hover:shadow-sm transition-shadow cursor-pointer ${
                      isOverdue(task) ? 'border-red-300 bg-red-50' : 'border-border'
                    }`}
                    onClick={() => handleEditTask(task)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <input
                          type="checkbox"
                          checked={task.status === 'completed'}
                          onChange={() => handleToggleTaskStatus(task)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <h4
                            className={`font-medium text-foreground ${
                              task.status === 'completed' ? 'line-through text-muted-foreground' : ''
                            }`}
                          >
                            {task.title}
                            {isOverdue(task) && (
                              <span className="ml-2 text-xs text-red-600 font-bold">OVERDUE</span>
                            )}
                          </h4>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                          )}
                          <div className="flex items-center space-x-3 mt-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                              {task.status.replace('_', ' ')}
                            </span>
                            {task.due_date && (
                              <span className="text-xs text-muted-foreground">
                                Due: {formatDate(task.due_date)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {task.status !== 'completed' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMoveToUrgent(task)
                            }}
                            className="text-orange-600 hover:text-orange-800 text-xs bg-orange-100 px-2 py-1 rounded"
                          >
                            🚨 Urgent
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteTask(task.id)
                          }}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Personal Tasks Card */}
          <div className="bg-card p-6 rounded-lg border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">🏠 Personal Tasks</h3>
            <div className="space-y-3">
              {filterVisibleTasks(data?.tasks || []).filter(task => task.category === 'personal').length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                    ? 'No personal tasks found matching your filters.'
                    : 'No personal tasks yet. Create your first personal task!'}
                </div>
              ) : (
                filterVisibleTasks(data?.tasks || []).filter(task => task.category === 'personal').map((task) => (
                  <div
                    key={task.id}
                    className={`p-3 border rounded-lg bg-background hover:shadow-sm transition-shadow cursor-pointer ${
                      isOverdue(task) ? 'border-red-300 bg-red-50' : 'border-border'
                    }`}
                    onClick={() => handleEditTask(task)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <input
                          type="checkbox"
                          checked={task.status === 'completed'}
                          onChange={() => handleToggleTaskStatus(task)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <h4
                            className={`font-medium text-foreground ${
                              task.status === 'completed' ? 'line-through text-muted-foreground' : ''
                            }`}
                          >
                            {task.title}
                            {isOverdue(task) && (
                              <span className="ml-2 text-xs text-red-600 font-bold">OVERDUE</span>
                            )}
                          </h4>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                          )}
                          <div className="flex items-center space-x-3 mt-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                              {task.status.replace('_', ' ')}
                            </span>
                            {task.due_date && (
                              <span className="text-xs text-muted-foreground">
                                Due: {formatDate(task.due_date)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {task.status !== 'completed' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMoveToUrgent(task)
                            }}
                            className="text-orange-600 hover:text-orange-800 text-xs bg-orange-100 px-2 py-1 rounded"
                          >
                            🚨 Urgent
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteTask(task.id)
                          }}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Filters - moved to bottom */}
          <div className="bg-card p-4 rounded-lg border border-border">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Search</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks..."
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  >
                    <option value="all">All Statuses</option>
                    <option value="todo">Todo</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Priority</label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  >
                    <option value="all">All Priorities</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Habits */}
        <div className="bg-card p-6 rounded-lg border border-border">
          <HabitTracker />
        </div>
      </div>
    </div>
  )
}