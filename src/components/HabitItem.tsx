'use client'

import { useState } from 'react'
import { Habit } from '@/types/database'

interface HabitItemProps {
  habit: Habit & { isCompleted?: boolean }
  onToggleComplete: (habitId: string, isCompleted: boolean) => Promise<void>
  onEdit?: (habit: Habit) => void
  onDelete?: (habitId: string) => void
  isLoading?: boolean
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function HabitItem({
  habit,
  onToggleComplete,
  onEdit,
  onDelete,
  isLoading = false
}: HabitItemProps) {
  const [isToggling, setIsToggling] = useState(false)

  const handleToggle = async () => {
    if (isToggling) return

    setIsToggling(true)
    try {
      await onToggleComplete(habit.id, !habit.isCompleted)
    } catch (error) {
      console.error('Failed to toggle habit:', error)
    } finally {
      setIsToggling(false)
    }
  }

  const getFrequencyDisplay = () => {
    switch (habit.frequency_type) {
      case 'daily':
        return 'Daily'
      case 'weekly':
        return 'Weekly'
      case 'monthly':
        return 'Monthly'
      case 'specific_days':
        if (habit.frequency_days && habit.frequency_days.length > 0) {
          return habit.frequency_days
            .sort()
            .map(day => DAY_NAMES[day])
            .join(', ')
        }
        return 'Specific days'
      default:
        return habit.frequency_type
    }
  }

  return (
    <div className={`
      flex items-center justify-between p-4 border rounded-lg transition-all duration-200
      ${habit.isCompleted
        ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
        : 'bg-background border-border hover:bg-muted/30'
      }
      ${!habit.is_active ? 'opacity-60' : ''}
    `}>
      <div className="flex items-center space-x-4 flex-1">
        {/* Completion Checkbox */}
        <button
          onClick={handleToggle}
          disabled={isToggling || isLoading || !habit.is_active}
          className={`
            h-6 w-6 rounded border-2 flex items-center justify-center transition-all duration-200
            ${habit.isCompleted
              ? 'bg-green-600 border-green-600 text-white hover:bg-green-700'
              : 'border-gray-300 hover:border-green-500 hover:bg-green-50 dark:border-gray-600 dark:hover:border-green-400'
            }
            ${isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${!habit.is_active ? 'cursor-not-allowed' : ''}
          `}
        >
          {habit.isCompleted && (
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {isToggling && (
            <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
          )}
        </button>

        {/* Habit Info */}
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className={`font-medium ${habit.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {habit.name}
            </h3>
            {!habit.is_active && (
              <span className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded-full dark:bg-gray-700 dark:text-gray-400">
                Inactive
              </span>
            )}
          </div>
          {habit.description && (
            <p className={`text-sm mt-1 ${habit.isCompleted ? 'line-through text-muted-foreground' : 'text-muted-foreground'}`}>
              {habit.description}
            </p>
          )}
          <div className="flex items-center space-x-4 mt-2">
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              {getFrequencyDisplay()}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {(onEdit || onDelete) && (
        <div className="flex items-center space-x-2 ml-4">
          {onEdit && (
            <button
              onClick={() => onEdit(habit)}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              title="Edit habit"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(habit.id)}
              className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
              title="Delete habit"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  )
}