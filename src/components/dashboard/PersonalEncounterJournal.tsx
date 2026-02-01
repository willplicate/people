'use client'

import { useState, useEffect } from 'react'
import { PersonalEncounter } from '@/types/database'
import PersonalEncounterForm from './PersonalEncounterForm'

interface PersonalEncounterJournalProps {
  userId: string
}

export default function PersonalEncounterJournal({ userId }: PersonalEncounterJournalProps) {
  const [encounters, setEncounters] = useState<PersonalEncounter[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingEncounter, setEditingEncounter] = useState<PersonalEncounter | undefined>(undefined)

  useEffect(() => {
    fetchEncounters()
  }, [])

  const fetchEncounters = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/encounters?limit=3')

      if (!response.ok) {
        throw new Error('Failed to fetch encounters')
      }

      const { encounters: data } = await response.json()
      setEncounters(data)
    } catch (error) {
      console.error('Error fetching encounters:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (savedEncounter: PersonalEncounter) => {
    // Refresh the list
    await fetchEncounters()
    setShowForm(false)
    setEditingEncounter(undefined)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingEncounter(undefined)
  }

  const handleEdit = (encounter: PersonalEncounter) => {
    setEditingEncounter(encounter)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) {
      return
    }

    try {
      const response = await fetch(`/api/encounters/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete encounter')
      }

      // Refresh the list
      await fetchEncounters()
    } catch (error) {
      console.error('Error deleting encounter:', error)
      alert('Failed to delete entry')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="bg-card p-6 rounded-card shadow-card animate-pulse">
        <div className="h-6 bg-muted rounded w-1/2 mb-4"></div>
        <div className="h-24 bg-muted rounded mb-3"></div>
        <div className="h-24 bg-muted rounded"></div>
      </div>
    )
  }

  return (
    <div className="bg-card p-6 rounded-card shadow-card hover:shadow-card-hover transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-foreground flex items-center gap-2">
          <span>🔒</span>
          <span>Personal Journal</span>
        </h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-1 text-sm font-medium text-primary-foreground bg-primary rounded-card hover:bg-primary/90 transition-colors"
          >
            + Add Entry
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-4 p-4 border border-border rounded-card bg-background/50">
          <PersonalEncounterForm
            userId={userId}
            encounter={editingEncounter}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      )}

      {encounters.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No entries yet</p>
          <p className="text-xs mt-1">Click "Add Entry" to create your first entry</p>
        </div>
      ) : (
        <div className="space-y-3">
          {encounters.map((encounter) => (
            <div
              key={encounter.id}
              className="p-4 border border-border rounded-card bg-background/30 hover:bg-background/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(encounter.encounter_date)}
                  </p>
                  {encounter.partner_description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {encounter.partner_description}
                    </p>
                  )}
                  {encounter.location && (
                    <p className="text-xs text-muted-foreground mt-1">
                      📍 {encounter.location}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 ml-2">
                  <button
                    onClick={() => handleEdit(encounter)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(encounter.id)}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {encounter.private_notes && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {encounter.private_notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {encounters.length > 0 && (
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Showing {encounters.length} most recent {encounters.length === 1 ? 'entry' : 'entries'}
          </p>
        </div>
      )}
    </div>
  )
}
