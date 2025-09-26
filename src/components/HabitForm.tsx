'use client'

import { useState, useEffect } from 'react'
import { Habit, CreateHabitInput, UpdateHabitInput } from '@/types/database'

interface HabitFormProps {
  habit?: Habit
  onSubmit: (data: CreateHabitInput | UpdateHabitInput) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

const DAY_NAMES = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
]

export default function HabitForm({
  habit,
  onSubmit,
  onCancel,
  isLoading = false
}: HabitFormProps) {
  const [formData, setFormData] = useState({
    name: habit?.name || '',
    description: habit?.description || '',
    frequency_type: habit?.frequency_type || 'daily' as const,
    frequency_days: habit?.frequency_days || [] as number[],
    is_active: habit?.is_active !== undefined ? habit.is_active : true,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Clear previous errors
    setErrors({})

    // Validation
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Habit name is required'
    }

    if (formData.frequency_type === 'specific_days' && formData.frequency_days.length === 0) {
      newErrors.frequency_days = 'Please select at least one day'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Prepare submission data
    const submitData: CreateHabitInput | UpdateHabitInput = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      frequency_type: formData.frequency_type,
      frequency_days: formData.frequency_type === 'specific_days' ? formData.frequency_days : null,
      is_active: formData.is_active,
    }

    try {
      await onSubmit(submitData)
    } catch (error) {
      console.error('Failed to submit habit:', error)
    }
  }

  const handleFrequencyTypeChange = (type: typeof formData.frequency_type) => {
    setFormData(prev => ({
      ...prev,
      frequency_type: type,
      frequency_days: type === 'specific_days' ? prev.frequency_days : []
    }))
  }

  const handleDayToggle = (dayValue: number) => {
    setFormData(prev => ({
      ...prev,
      frequency_days: prev.frequency_days.includes(dayValue)
        ? prev.frequency_days.filter(d => d !== dayValue)
        : [...prev.frequency_days, dayValue].sort()
    }))
  }

  return (
    <div className="bg-card p-6 rounded-lg border border-border">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        {habit ? 'Edit Habit' : 'Add New Habit'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Habit Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
            Habit Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Drink 8 glasses of water"
            className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
              errors.name ? 'border-red-500' : 'border-border'
            }`}
            disabled={isLoading}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
            Description (optional)
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Add any notes about this habit..."
            rows={2}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isLoading}
          />
        </div>

        {/* Frequency Type */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Frequency *
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'daily' as const, label: 'Daily' },
              { value: 'weekly' as const, label: 'Weekly' },
              { value: 'monthly' as const, label: 'Monthly' },
              { value: 'specific_days' as const, label: 'Specific Days' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleFrequencyTypeChange(option.value)}
                className={`p-3 text-sm border rounded-lg transition-colors ${
                  formData.frequency_type === option.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-border hover:bg-muted'
                }`}
                disabled={isLoading}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Specific Days Selection */}
        {formData.frequency_type === 'specific_days' && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Select Days *
            </label>
            <div className="grid grid-cols-7 gap-2">
              {DAY_NAMES.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => handleDayToggle(day.value)}
                  className={`p-2 text-sm border rounded-lg transition-colors ${
                    formData.frequency_days.includes(day.value)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-foreground border-border hover:bg-muted'
                  }`}
                  disabled={isLoading}
                  title={day.label}
                >
                  {day.short}
                </button>
              ))}
            </div>
            {errors.frequency_days && (
              <p className="mt-1 text-sm text-red-600">{errors.frequency_days}</p>
            )}
          </div>
        )}

        {/* Active Status */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            disabled={isLoading}
          />
          <label htmlFor="is_active" className="text-sm text-foreground">
            Active (habit will be shown in daily list)
          </label>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Saving...' : (habit ? 'Update Habit' : 'Create Habit')}
          </button>
        </div>
      </form>
    </div>
  )
}