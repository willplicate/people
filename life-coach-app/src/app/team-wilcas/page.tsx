'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

type Task = {
  id: string
  title: string
  description: string | null
  assigned_to: 'Will' | 'Jucas' | 'Either'
  completed: boolean
  completed_at: string | null
  created_at: string
}

export default function TeamWilcasPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [newTaskAssignee, setNewTaskAssignee] = useState<'Will' | 'Jucas' | 'Either'>('Either')
  const [isAdding, setIsAdding] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)

  useEffect(() => {
    loadTasks()
  }, [showCompleted])

  async function loadTasks() {
    try {
      const url = showCompleted
        ? '/api/team-wilcas/tasks'
        : '/api/team-wilcas/tasks?completed=false'

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks || [])
      }
    } catch (error) {
      console.error('Failed to load tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  async function addTask() {
    if (!newTaskTitle.trim()) return

    setIsAdding(true)
    try {
      const response = await fetch('/api/team-wilcas/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          description: newTaskDescription.trim() || null,
          assigned_to: newTaskAssignee
        })
      })

      if (response.ok) {
        setNewTaskTitle('')
        setNewTaskDescription('')
        setNewTaskAssignee('Either')
        await loadTasks()
      }
    } catch (error) {
      console.error('Failed to add task:', error)
    } finally {
      setIsAdding(false)
    }
  }

  async function toggleTask(taskId: string, completed: boolean) {
    try {
      const response = await fetch('/api/team-wilcas/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, completed: !completed })
      })

      if (response.ok) {
        await loadTasks()
      }
    } catch (error) {
      console.error('Failed to toggle task:', error)
    }
  }

  async function changeAssignee(taskId: string, newAssignee: string) {
    try {
      const response = await fetch('/api/team-wilcas/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, assigned_to: newAssignee })
      })

      if (response.ok) {
        await loadTasks()
      }
    } catch (error) {
      console.error('Failed to change assignee:', error)
    }
  }

  async function deleteTask(taskId: string) {
    if (!confirm('Delete this task?')) return

    try {
      const response = await fetch(`/api/team-wilcas/tasks?taskId=${taskId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadTasks()
      }
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }

  const getAssigneeColor = (assignee: string) => {
    switch (assignee) {
      case 'Will': return '#3b82f6' // Blue
      case 'Jucas': return '#ec4899' // Pink
      case 'Either': return '#10b981' // Green
      default: return '#6b7280' // Gray
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      paddingBottom: '2rem'
    }}>
      {/* Header with Image */}
      <div style={{
        width: '100%',
        backgroundColor: 'white',
        borderBottom: '2px solid #e5e7eb',
        marginBottom: '1rem'
      }}>
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          position: 'relative',
          height: '340px'
        }}>
          <Image
            src="/team-wilcas-16-9.jpeg"
            alt="Team Wilcas"
            fill
            style={{ objectFit: 'contain' }}
            priority
          />
        </div>
      </div>

      {/* Content */}
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '0 1rem'
      }}>
        {/* Toggle View */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1rem',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => setShowCompleted(false)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: !showCompleted ? '#3b82f6' : 'white',
              color: !showCompleted ? 'white' : '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Active
          </button>
          <button
            onClick={() => setShowCompleted(true)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: showCompleted ? '#3b82f6' : 'white',
              color: showCompleted ? 'white' : '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Completed
          </button>
        </div>

        {/* Add Task Form */}
        {!showCompleted && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && addTask()}
              placeholder="What needs to be done?"
              disabled={isAdding}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                marginBottom: '0.5rem',
                outline: 'none'
              }}
            />

            <textarea
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              placeholder="Details (optional)"
              disabled={isAdding}
              rows={2}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                marginBottom: '0.5rem',
                outline: 'none',
                resize: 'vertical'
              }}
            />

            <div style={{
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center'
            }}>
              <select
                value={newTaskAssignee}
                onChange={(e) => setNewTaskAssignee(e.target.value as any)}
                disabled={isAdding}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="Either">Either of us</option>
                <option value="Will">Will</option>
                <option value="Jucas">Jucas</option>
              </select>

              <button
                onClick={addTask}
                disabled={isAdding || !newTaskTitle.trim()}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: isAdding || !newTaskTitle.trim() ? '#e5e7eb' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: isAdding || !newTaskTitle.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                {isAdding ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        )}

        {/* Task List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            Loading tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            {showCompleted ? 'No completed tasks yet!' : 'No active tasks. Add one above!'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {tasks.map(task => (
              <div
                key={task.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  borderLeft: `4px solid ${getAssigneeColor(task.assigned_to)}`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id, task.completed)}
                    style={{
                      width: '1.25rem',
                      height: '1.25rem',
                      marginTop: '0.125rem',
                      cursor: 'pointer',
                      accentColor: getAssigneeColor(task.assigned_to)
                    }}
                  />

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: 500,
                      color: task.completed ? '#9ca3af' : '#111827',
                      textDecoration: task.completed ? 'line-through' : 'none',
                      marginBottom: task.description ? '0.25rem' : 0
                    }}>
                      {task.title}
                    </div>

                    {task.description && (
                      <div style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        marginBottom: '0.5rem',
                        textDecoration: task.completed ? 'line-through' : 'none'
                      }}>
                        {task.description}
                      </div>
                    )}

                    {/* Assignee & Delete */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginTop: '0.5rem'
                    }}>
                      <select
                        value={task.assigned_to}
                        onChange={(e) => changeAssignee(task.id, e.target.value)}
                        disabled={task.completed}
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          backgroundColor: 'white',
                          color: getAssigneeColor(task.assigned_to),
                          fontWeight: 500,
                          cursor: task.completed ? 'not-allowed' : 'pointer',
                          opacity: task.completed ? 0.5 : 1
                        }}
                      >
                        <option value="Either">Either</option>
                        <option value="Will">Will</option>
                        <option value="Jucas">Jucas</option>
                      </select>

                      <button
                        onClick={() => deleteTask(task.id)}
                        style={{
                          marginLeft: 'auto',
                          color: '#9ca3af',
                          fontSize: '1.25rem',
                          fontWeight: 'bold',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0 0.25rem',
                          lineHeight: 1
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
