'use client'

import { useState, useEffect } from 'react'

interface DayLog {
  date: string
  dayName: string
  dayAbbrev: string
  completed: boolean
  isToday: boolean
}

interface HabitWithWeek {
  id: string
  name: string
  currentStreak: number
  weekLogs: DayLog[]
}

interface HabitTrackerProps {
  userId: string
}

export default function HabitTracker({ userId }: HabitTrackerProps) {
  const [habits, setHabits] = useState<HabitWithWeek[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newHabitName, setNewHabitName] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    loadHabitsWithWeekData()
  }, [])

  async function loadHabitsWithWeekData() {
    try {
      // Get habits from API
      const response = await fetch(`/api/life-coach/habits?userId=${userId}`)
      if (!response.ok) throw new Error('Failed to load habits')

      const data = await response.json()

      // Get last 7 days of logs for each habit
      const habitsWithWeek = await Promise.all(
        data.habits.map(async (habit: any) => {
          const weekLogs = await fetchWeekLogs(habit.id)
          return {
            id: habit.id,
            name: habit.name,
            currentStreak: habit.currentStreak,
            weekLogs
          }
        })
      )

      setHabits(habitsWithWeek)
    } catch (error) {
      console.error('Failed to load habits:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchWeekLogs(habitId: string): Promise<DayLog[]> {
    // Generate last 7 days
    const days: DayLog[] = []
    const today = new Date()

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)

      const dateStr = date.toISOString().split('T')[0]
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const dayName = dayNames[date.getDay()]

      days.push({
        date: dateStr,
        dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
        dayAbbrev: dayName,
        completed: false,
        isToday: i === 0
      })
    }

    // Fetch actual logs from API
    try {
      const response = await fetch(
        `/api/life-coach/habits/logs?habitId=${habitId}&days=7`
      )

      if (response.ok) {
        const data = await response.json()
        const logMap = new Map(data.logs.map((log: any) => [log.log_date, log.completed]))

        days.forEach(day => {
          day.completed = logMap.get(day.date) || false
        })
      }
    } catch (error) {
      console.error('Failed to fetch week logs:', error)
    }

    return days
  }

  async function toggleDay(habitId: string, date: string, currentlyCompleted: boolean) {
    try {
      const response = await fetch('/api/life-coach/habits/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habitId,
          date,
          completed: !currentlyCompleted
        })
      })

      if (!response.ok) throw new Error('Failed to log habit')

      // Update UI
      setHabits(prev =>
        prev.map(habit => {
          if (habit.id === habitId) {
            return {
              ...habit,
              weekLogs: habit.weekLogs.map(day =>
                day.date === date ? { ...day, completed: !currentlyCompleted } : day
              )
            }
          }
          return habit
        })
      )
    } catch (error) {
      console.error('Failed to toggle habit day:', error)
      alert('Failed to update habit. Please try again.')
    }
  }

  async function addHabit() {
    if (!newHabitName.trim()) return

    setAdding(true)
    try {
      const response = await fetch('/api/life-coach/habits/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name: newHabitName,
          type: 'cultivate',
          frequency: 'daily'
        })
      })

      if (!response.ok) throw new Error('Failed to create habit')

      // Reload habits
      await loadHabitsWithWeekData()
      setNewHabitName('')
      setShowAddForm(false)
    } catch (error) {
      console.error('Failed to add habit:', error)
      alert('Failed to create habit. Please try again.')
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-card p-4">
        <div className="text-center text-muted-foreground">Loading habits...</div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-card">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-medium text-foreground">This Week</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          {showAddForm ? 'Cancel' : '+ Add Habit'}
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Add Habit Form */}
        {showAddForm && (
          <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
            <input
              type="text"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              placeholder="Habit name (e.g., Yoga, Spanish practice)"
              className="w-full px-3 py-2 border border-gray-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && addHabit()}
            />
            <button
              onClick={addHabit}
              disabled={adding || !newHabitName.trim()}
              className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {adding ? 'Adding...' : 'Create Habit'}
            </button>
          </div>
        )}

        {habits.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No habits tracked yet. Click "+ Add Habit" to create your first habit!
          </div>
        ) : (
          habits.map(habit => (
            <div key={habit.id} className="space-y-2">
              {/* Habit name and streak */}
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900">{habit.name}</h4>
                {habit.currentStreak > 0 && (
                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-orange-500">🔥</span>
                    <span className="font-medium text-gray-700">{habit.currentStreak}</span>
                  </div>
                )}
              </div>

              {/* Weekly grid */}
              <div className="grid grid-cols-7 gap-1">
                {habit.weekLogs.map(day => (
                  <button
                    key={day.date}
                    onClick={() => toggleDay(habit.id, day.date, day.completed)}
                    className={`
                      flex flex-col items-center justify-center p-2 rounded-md text-xs transition-colors
                      ${day.isToday ? 'ring-2 ring-blue-500' : ''}
                      ${
                        day.completed
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }
                    `}
                  >
                    <span className="font-medium">{day.dayAbbrev}</span>
                    <span className="text-xs mt-0.5">
                      {day.completed ? '✓' : '○'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
