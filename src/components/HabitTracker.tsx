'use client'

import { useState, useEffect } from 'react'
import { Habit, CreateHabitInput, UpdateHabitInput } from '@/types/database'
import HabitItem from './HabitItem'
import HabitForm from './HabitForm'

export default function HabitTracker() {
  const [habits, setHabits] = useState<Array<Habit & { isCompleted: boolean }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    fetchTodaysHabits()
  }, [])

  const fetchTodaysHabits = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/habits?today=true')
      if (!response.ok) {
        throw new Error('Failed to fetch habits')
      }

      const data = await response.json()
      setHabits(data.habits || [])
    } catch (err) {
      console.error('Error fetching habits:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch habits')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleComplete = async (habitId: string, isCompleted: boolean) => {
    const today = new Date().toISOString().split('T')[0]

    try {
      if (isCompleted) {
        // Mark as completed
        const response = await fetch(`/api/habits/${habitId}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed_date: today })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to complete habit')
        }
      } else {
        // Mark as incomplete
        const response = await fetch(`/api/habits/${habitId}/complete?date=${today}`, {
          method: 'DELETE'
        })

        if (!response.ok) {
          throw new Error('Failed to uncomplete habit')
        }
      }

      // Update local state
      setHabits(prev =>
        prev.map(habit =>
          habit.id === habitId
            ? { ...habit, isCompleted }
            : habit
        )
      )
    } catch (error) {
      console.error('Error toggling habit completion:', error)
      throw error // Re-throw to be handled by HabitItem
    }
  }

  const handleCreateHabit = async (data: CreateHabitInput) => {
    try {
      setFormLoading(true)

      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create habit')
      }

      setShowForm(false)
      await fetchTodaysHabits() // Refresh the list
    } catch (error) {
      console.error('Error creating habit:', error)
      alert(error instanceof Error ? error.message : 'Failed to create habit')
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdateHabit = async (data: UpdateHabitInput) => {
    if (!editingHabit) return

    try {
      setFormLoading(true)

      const response = await fetch(`/api/habits/${editingHabit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update habit')
      }

      setEditingHabit(null)
      await fetchTodaysHabits() // Refresh the list
    } catch (error) {
      console.error('Error updating habit:', error)
      alert(error instanceof Error ? error.message : 'Failed to update habit')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteHabit = async (habitId: string) => {
    if (!confirm('Are you sure you want to delete this habit? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/habits/${habitId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete habit')
      }

      await fetchTodaysHabits() // Refresh the list
    } catch (error) {
      console.error('Error deleting habit:', error)
      alert('Failed to delete habit. Please try again.')
    }
  }

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit)
    setShowForm(false) // Close create form if open
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingHabit(null)
  }

  const completedCount = habits.filter(habit => habit.isCompleted).length
  const totalCount = habits.length

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">🎯 Today&apos;s Habits</h2>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">🎯 Today&apos;s Habits</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchTodaysHabits}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">🎯 Today&apos;s Habits</h2>
          {totalCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {completedCount} of {totalCount} completed
            </p>
          )}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/80 transition-colors"
        >
          Add Habit
        </button>
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
      )}

      {/* Habit Form */}
      {(showForm || editingHabit) && (
        <HabitForm
          habit={editingHabit || undefined}
          onSubmit={editingHabit ? handleUpdateHabit : handleCreateHabit}
          onCancel={handleCancelForm}
          isLoading={formLoading}
        />
      )}

      {/* Habits List */}
      <div className="space-y-3">
        {habits.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-lg">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-lg font-medium text-foreground mb-2">No habits for today</h3>
            <p className="text-muted-foreground mb-4">
              Start building positive habits by adding your first one.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/80 transition-colors"
            >
              Add Your First Habit
            </button>
          </div>
        ) : (
          habits.map((habit) => (
            <HabitItem
              key={habit.id}
              habit={habit}
              onToggleComplete={handleToggleComplete}
              onEdit={handleEditHabit}
              onDelete={handleDeleteHabit}
              isLoading={loading}
            />
          ))
        )}
      </div>

      {/* Footer info */}
      {habits.length > 0 && (
        <div className="text-center text-sm text-muted-foreground pt-4 border-t border-border">
          💡 Habits are shown based on their frequency settings. Complete them to build streaks!
        </div>
      )}
    </div>
  )
}