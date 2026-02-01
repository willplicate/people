'use client'

import { useState } from 'react'
import { PersonalEncounter, CreatePersonalEncounterInput } from '@/types/database'

interface PersonalEncounterFormProps {
  userId: string
  encounter?: PersonalEncounter
  onSave: (encounter: PersonalEncounter) => void
  onCancel: () => void
}

export default function PersonalEncounterForm({ userId, encounter, onSave, onCancel }: PersonalEncounterFormProps) {
  const [formData, setFormData] = useState<CreatePersonalEncounterInput>({
    encounter_date: encounter?.encounter_date
      ? new Date(encounter.encounter_date).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    partner_description: encounter?.partner_description || '',
    location: encounter?.location || '',
    private_notes: encounter?.private_notes || ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.encounter_date) {
      newErrors.encounter_date = 'Date & time is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    try {
      const method = encounter ? 'PATCH' : 'POST'
      const url = encounter
        ? `/api/encounters/${encounter.id}`
        : `/api/encounters`

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...formData }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save entry')
      }

      const { encounter: savedEncounter } = await response.json()
      onSave(savedEncounter)

    } catch (error) {
      console.error('Error saving entry:', error)
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to save entry' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="encounter_date" className="block text-sm font-medium text-foreground mb-1">
          Date & Time *
        </label>
        <input
          type="datetime-local"
          id="encounter_date"
          name="encounter_date"
          value={formData.encounter_date}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-border rounded-card bg-background text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary"
          disabled={isLoading}
        />
        {errors.encounter_date && (
          <p className="mt-1 text-sm text-red-600">{errors.encounter_date}</p>
        )}
      </div>

      <div>
        <label htmlFor="partner_description" className="block text-sm font-medium text-foreground mb-1">
          Partner
        </label>
        <input
          type="text"
          id="partner_description"
          name="partner_description"
          value={formData.partner_description}
          onChange={handleInputChange}
          placeholder="Name or description (optional)"
          className="w-full px-3 py-2 border border-border rounded-card bg-background text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary"
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-foreground mb-1">
          Location
        </label>
        <input
          type="text"
          id="location"
          name="location"
          value={formData.location}
          onChange={handleInputChange}
          placeholder="Where this happened (optional)"
          className="w-full px-3 py-2 border border-border rounded-card bg-background text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary"
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="private_notes" className="block text-sm font-medium text-foreground mb-1">
          Private Notes
        </label>
        <textarea
          id="private_notes"
          name="private_notes"
          rows={4}
          value={formData.private_notes}
          onChange={handleInputChange}
          placeholder="Private notes..."
          className="w-full px-3 py-2 border border-border rounded-card bg-background text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary resize-y"
          disabled={isLoading}
        />
      </div>

      {errors.submit && (
        <div className="p-3 rounded-card bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{errors.submit}</p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-foreground bg-muted border border-border rounded-card hover:bg-muted/80 transition-colors"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-card hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : encounter ? 'Update Entry' : 'Save Entry'}
        </button>
      </div>
    </form>
  )
}
