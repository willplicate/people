'use client'

import { useState } from 'react'
import { Interaction, CreateInteractionInput } from '@/types/database'

interface InteractionFormProps {
  contactId: string
  interaction?: Interaction
  onSave: (interaction: Interaction) => void
  onCancel: () => void
  isLoading?: boolean
}

export default function InteractionForm({ contactId, interaction, onSave, onCancel, isLoading = false }: InteractionFormProps) {
  const [formData, setFormData] = useState<CreateInteractionInput>({
    contact_id: contactId,
    type: interaction?.type || 'call',
    notes: interaction?.notes || '',
    interaction_date: interaction?.interaction_date
      ? new Date(interaction.interaction_date).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.notes.trim()) {
      newErrors.notes = 'Notes are required'
    }

    if (!formData.interaction_date) {
      newErrors.interaction_date = 'Interaction date is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      const method = interaction ? 'PUT' : 'POST'
      const url = interaction
        ? `/api/interactions/${interaction.id}`
        : `/api/contacts/${contactId}/interactions`

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save interaction')
      }

      const savedInteraction = await response.json()
      onSave(savedInteraction)
    } catch (error) {
      console.error('Error saving interaction:', error)
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to save interaction' })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">
            Interaction Type
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="call">Phone Call</option>
            <option value="text">Text Message</option>
            <option value="email">Email</option>
            <option value="meetup">In-Person Meetup</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="interaction_date" className="block text-sm font-medium text-gray-700">
            Date & Time
          </label>
          <input
            type="datetime-local"
            id="interaction_date"
            name="interaction_date"
            value={formData.interaction_date}
            onChange={handleInputChange}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
              errors.interaction_date ? 'border-red-300' : ''
            }`}
            disabled={isLoading}
          />
          {errors.interaction_date && (
            <p className="mt-1 text-sm text-red-600">{errors.interaction_date}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notes *
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          value={formData.notes}
          onChange={handleInputChange}
          placeholder="What did you talk about? How are they doing?"
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
            errors.notes ? 'border-red-300' : ''
          }`}
          disabled={isLoading}
        />
        {errors.notes && (
          <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
        )}
      </div>

      {errors.submit && (
        <div className="text-red-600 text-sm">{errors.submit}</div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : interaction ? 'Update Interaction' : 'Save Interaction'}
        </button>
      </div>
    </form>
  )
}