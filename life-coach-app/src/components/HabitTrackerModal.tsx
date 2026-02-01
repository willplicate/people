'use client'

import { useState, useEffect } from 'react'
import { LifeHabit, LifeHabitLog } from '@/types/database'

interface HabitTrackerModalProps {
  userId: string
  isOpen: boolean
  onClose: () => void
}

export default function HabitTrackerModal({ userId, isOpen, onClose }: HabitTrackerModalProps) {
  const [habits, setHabits] = useState<LifeHabit[]>([])
  const [habitLogs, setHabitLogs] = useState<Map<string, LifeHabitLog[]>>(new Map())
  const [loading, setLoading] = useState(true)
  const [weekStart, setWeekStart] = useState<Date>(getMonday(new Date()))
  const [newHabitName, setNewHabitName] = useState('')
  const [newHabitType, setNewHabitType] = useState<'cultivate' | 'eliminate' | 'limit'>('cultivate')
  const [newHabitFrequency, setNewHabitFrequency] = useState<'daily' | 'weekly'>('daily')
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadHabitsAndLogs()
    }
  }, [isOpen, weekStart])

  function getMonday(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  async function loadHabitsAndLogs() {
    setLoading(true)
    try {
      // Load habits
      const habitsResponse = await fetch(`/api/life-coach/habits?userId=${userId}`)
      if (!habitsResponse.ok) {
        throw new Error('Failed to load habits')
      }
      const habitsData = await habitsResponse.json()
      const loadedHabits = habitsData.habits || []
      setHabits(loadedHabits)

      // Load logs for each habit for the current week
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)

      const startDateStr = weekStart.toISOString().split('T')[0]
      const endDateStr = weekEnd.toISOString().split('T')[0]

      const logsMap = new Map<string, LifeHabitLog[]>()

      for (const habit of loadedHabits) {
        try {
          const logsResponse = await fetch(
            `/api/life-coach/habit-logs?habitId=${habit.id}&startDate=${startDateStr}&endDate=${endDateStr}`
          )
          if (logsResponse.ok) {
            const logsData = await logsResponse.json()
            logsMap.set(habit.id, logsData.logs || [])
          }
        } catch (error) {
          console.error(`Failed to load logs for habit ${habit.id}:`, error)
          logsMap.set(habit.id, [])
        }
      }

      setHabitLogs(logsMap)
    } catch (error) {
      console.error('Failed to load habits and logs:', error)
    } finally {
      setLoading(false)
    }
  }

  async function addHabit() {
    if (!newHabitName.trim()) return

    setIsAdding(true)
    try {
      const response = await fetch('/api/life-coach/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name: newHabitName.trim(),
          type: newHabitType,
          frequency: newHabitFrequency,
          target_count: 1
        })
      })

      if (response.ok) {
        setNewHabitName('')
        setNewHabitType('cultivate')
        setNewHabitFrequency('daily')
        await loadHabitsAndLogs()
      }
    } catch (error) {
      console.error('Failed to add habit:', error)
    } finally {
      setIsAdding(false)
    }
  }

  async function deleteHabit(habitId: string) {
    if (!confirm('Delete this habit?')) return

    try {
      const response = await fetch(`/api/life-coach/habits?habitId=${habitId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadHabitsAndLogs()
      }
    } catch (error) {
      console.error('Failed to delete habit:', error)
    }
  }

  function getDayDate(dayIndex: number): string {
    const date = new Date(weekStart)
    date.setDate(date.getDate() + dayIndex)
    return date.toISOString().split('T')[0]
  }

  function isHabitChecked(habitId: string, dayIndex: number): boolean {
    const logs = habitLogs.get(habitId) || []
    const dateStr = getDayDate(dayIndex)
    const log = logs.find(l => l.log_date === dateStr)
    return log?.completed || false
  }

  async function toggleHabit(habitId: string, dayIndex: number, currentValue: boolean) {
    const dateStr = getDayDate(dayIndex)
    const newValue = !currentValue

    try {
      const response = await fetch('/api/life-coach/habit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habitId,
          logDate: dateStr,
          completed: newValue
        })
      })

      if (response.ok) {
        // Update local state optimistically
        const logs = habitLogs.get(habitId) || []
        const existingLogIndex = logs.findIndex(l => l.log_date === dateStr)

        if (existingLogIndex >= 0) {
          logs[existingLogIndex] = { ...logs[existingLogIndex], completed: newValue }
        } else {
          const responseData = await response.json()
          logs.push(responseData.log)
        }

        const newLogsMap = new Map(habitLogs)
        newLogsMap.set(habitId, logs)
        setHabitLogs(newLogsMap)
      }
    } catch (error) {
      console.error('Failed to toggle habit:', error)
    }
  }

  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998
        }}
      />

      {/* Sidebar Panel */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '400px',
        maxWidth: '90vw',
        backgroundColor: 'white',
        boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.1)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: 'white',
          flexShrink: 0
        }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827' }}>
            This Week
          </h2>
          <button
            onClick={onClose}
            style={{
              color: '#9ca3af',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              lineHeight: 1,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0 0.5rem'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#4b5563'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
          {/* Add New Habit */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <input
                type="text"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addHabit()}
                placeholder="New habit..."
                disabled={isAdding}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
              />

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  value={newHabitType}
                  onChange={(e) => setNewHabitType(e.target.value as 'cultivate' | 'eliminate' | 'limit')}
                  disabled={isAdding}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="cultivate">Cultivate</option>
                  <option value="eliminate">Eliminate</option>
                  <option value="limit">Limit</option>
                </select>

                <select
                  value={newHabitFrequency}
                  onChange={(e) => setNewHabitFrequency(e.target.value as 'daily' | 'weekly')}
                  disabled={isAdding}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>

                <button
                  onClick={addHabit}
                  disabled={isAdding || !newHabitName.trim()}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: isAdding || !newHabitName.trim() ? '#e5e7eb' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: isAdding || !newHabitName.trim() ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isAdding ? '...' : 'Add'}
                </button>
              </div>
            </div>
          </div>

          {/* Habits List */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>Loading...</div>
          ) : habits.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>No habits yet. Add one above!</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {habits.map(habit => (
                <div key={habit.id} style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: '1rem' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.25rem'
                  }}>
                    <div>
                      <div style={{ fontWeight: 500, color: '#111827' }}>
                        {habit.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.125rem' }}>
                        {habit.type} · {habit.frequency}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteHabit(habit.id)}
                      style={{
                        color: '#9ca3af',
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                        lineHeight: 1,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0 0.25rem'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                      title="Delete habit"
                    >
                      ×
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem' }}>
                    {weekDays.map((day, idx) => {
                      const isChecked = isHabitChecked(habit.id, idx)
                      return (
                        <div key={idx} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                            {day}
                          </div>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleHabit(habit.id, idx, isChecked)}
                            style={{
                              width: '1.25rem',
                              height: '1.25rem',
                              cursor: 'pointer',
                              accentColor: '#3b82f6'
                            }}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <div style={{
          borderTop: '1px solid #e5e7eb',
          padding: '1rem 1.5rem',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <a
            href="/team-wilcas"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem',
              backgroundColor: '#f9fafb',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              color: '#374151',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
          >
            <span>✅</span>
            <span>Team Wilcas Tasks</span>
          </a>

          <a
            href="/admin"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem',
              backgroundColor: '#f9fafb',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              color: '#374151',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
          >
            <span>⚙️</span>
            <span>Admin Settings</span>
          </a>
        </div>
      </div>
    </>
  )
}
