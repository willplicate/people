'use client'

import { useState, useEffect } from 'react'
import { PersonalTask } from '@/types/database'
import { SpreadsheetItem } from '@/types/unified'
import { PersonalTaskService } from '@/services/PersonalTaskService'
import { taskToSpreadsheetItem, tasksToSpreadsheetItems } from '@/adapters/taskAdapter'
import SpreadsheetList from '@/components/unified/SpreadsheetList'
import DetailModal from '@/components/unified/DetailModal'
import AddButton from '@/components/unified/AddButton'
import { CheckCircleIcon } from '@heroicons/react/24/outline'

export default function TasksPage() {
  const [tasks, setTasks] = useState<PersonalTask[]>([])
  const [items, setItems] = useState<SpreadsheetItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<PersonalTask | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [isCreateMode, setIsCreateMode] = useState(false)
  const [filterStatus, setFilterStatus] = useState<PersonalTask['status'] | 'all'>('todo')

  // Load tasks
  useEffect(() => {
    loadTasks()
  }, [filterStatus])

  const loadTasks = async () => {
    try {
      setLoading(true)
      const fetchedTasks = await PersonalTaskService.getAll({
        status: filterStatus === 'all' ? undefined : filterStatus,
      })
      setTasks(fetchedTasks)
      setItems(tasksToSpreadsheetItems(fetchedTasks))
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRowClick = (item: SpreadsheetItem) => {
    const task = item.metadata as PersonalTask
    setSelectedTask(task)
    setIsCreateMode(false)
    setModalOpen(true)
  }

  const handleAddClick = () => {
    setSelectedTask(null)
    setIsCreateMode(true)
    setModalOpen(true)
  }

  const handleQuickComplete = async (item: SpreadsheetItem) => {
    const task = item.metadata as PersonalTask
    if (task.status === 'todo' || task.status === 'in_progress') {
      try {
        await PersonalTaskService.markCompleted(task.id)
        await loadTasks() // Reload to show updated status
      } catch (error) {
        console.error('Error completing task:', error)
      }
    }
  }

  const handleBulkComplete = async (items: SpreadsheetItem[]) => {
    try {
      const incompleteTasks = items
        .map(item => item.metadata as PersonalTask)
        .filter(task => task.status === 'todo' || task.status === 'in_progress')

      await Promise.all(incompleteTasks.map(task => PersonalTaskService.markCompleted(task.id)))
      await loadTasks()
    } catch (error) {
      console.error('Error completing tasks:', error)
    }
  }

  const handleBulkDelete = async (items: SpreadsheetItem[]) => {
    try {
      const taskIds = items.map(item => (item.metadata as PersonalTask).id)
      await Promise.all(taskIds.map(id => PersonalTaskService.delete(id)))
      await loadTasks()
    } catch (error) {
      console.error('Error deleting tasks:', error)
    }
  }

  const handleSave = async () => {
    setModalOpen(false)
    await loadTasks() // Reload tasks after save
  }

  const handleDelete = async (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await PersonalTaskService.delete(taskId)
        setModalOpen(false)
        await loadTasks()
      } catch (error) {
        console.error('Error deleting task:', error)
      }
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Filters */}
      <div className="px-3 py-1.5 bg-white border-b border-gray-200 flex gap-1.5 flex-shrink-0">
        {(['all', 'todo', 'in_progress', 'completed', 'cancelled'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`
              px-3 py-1 rounded text-xs font-medium transition-colors
              ${
                filterStatus === status
                  ? 'bg-tertiary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-hidden">
        <SpreadsheetList
          items={items}
          onRowClick={handleRowClick}
          showCheckbox={true}
          onBulkComplete={handleBulkComplete}
          onBulkDelete={handleBulkDelete}
          showDelete={true}
          onDelete={(item) => {
            const task = item.metadata as PersonalTask
            handleDelete(task.id)
          }}
          loading={loading}
          emptyTitle="No tasks found"
          emptyDescription="Get started by creating your first task"
          emptyIcon={<CheckCircleIcon className="h-12 w-12" />}
          actions={[
            { label: 'Complete', value: 'complete' },
            { label: 'Edit', value: 'edit' },
            { label: 'Delete', value: 'delete' },
          ]}
          onActionClick={(item, action) => {
            if (action === 'complete') {
              handleQuickComplete(item)
            } else if (action === 'edit') {
              handleRowClick(item)
            } else if (action === 'delete') {
              const task = item.metadata as PersonalTask
              handleDelete(task.id)
            }
          }}
        />
      </div>

      {/* Add Button */}
      <AddButton onClick={handleAddClick} label="Add Task" />

      {/* Detail/Create Modal */}
      <DetailModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isCreateMode ? 'Create Task' : 'Task Details'}
      >
        <TaskForm
          task={isCreateMode ? null : selectedTask}
          onSave={handleSave}
          onCancel={() => setModalOpen(false)}
          onDelete={selectedTask ? () => handleDelete(selectedTask.id) : undefined}
        />
      </DetailModal>
    </div>
  )
}

// Task Form Component
interface TaskFormProps {
  task: PersonalTask | null
  onSave: () => void
  onCancel: () => void
  onDelete?: () => void
}

function TaskForm({ task, onSave, onCancel, onDelete }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [priority, setPriority] = useState<PersonalTask['priority']>(task?.priority || 'medium')
  const [status, setStatus] = useState<PersonalTask['status']>(task?.status || 'todo')
  const [category, setCategory] = useState<PersonalTask['category']>(task?.category || 'personal')
  const [dueDate, setDueDate] = useState(task?.due_date ? task.due_date.split('T')[0] : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      if (task) {
        // Update existing task
        await PersonalTaskService.update(task.id, {
          title,
          description: description || undefined,
          priority,
          status,
          category,
          due_date: dueDate || undefined,
        })
      } else {
        // Create new task
        await PersonalTaskService.create({
          title,
          description: description || undefined,
          priority,
          status,
          category,
          due_date: dueDate || undefined,
          tags: [],
        })
      }
      onSave()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-tertiary focus:border-tertiary"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-tertiary focus:border-tertiary"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as PersonalTask['priority'])}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-tertiary focus:border-tertiary"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as PersonalTask['status'])}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-tertiary focus:border-tertiary"
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={category || 'personal'}
            onChange={(e) => setCategory(e.target.value as PersonalTask['category'])}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-tertiary focus:border-tertiary"
          >
            <option value="personal">Personal</option>
            <option value="work">Work</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Due Date
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-tertiary focus:border-tertiary"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-tertiary text-white px-4 py-2 rounded-md hover:bg-tertiary/90 disabled:opacity-50"
        >
          {saving ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete
          </button>
        )}
      </div>
    </form>
  )
}
