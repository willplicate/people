'use client'

import { useState, useEffect } from 'react'
import { Contact, ContactInfo, Interaction } from '@/types/database'
import InteractionForm from './InteractionForm'

interface ContactDetailProps {
  contactId: string
  onEdit?: (contact: Contact) => void
  onDelete?: () => void
}

export default function ContactDetail({ contactId, onEdit, onDelete }: ContactDetailProps) {
  const [contact, setContact] = useState<Contact | null>(null)
  const [contactInfo, setContactInfo] = useState<ContactInfo[]>([])
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddInteraction, setShowAddInteraction] = useState(false)
  const [deletingContact, setDeletingContact] = useState(false)

  useEffect(() => {
    if (contactId) {
      fetchContactDetails()
    }
  }, [contactId])

  const fetchContactDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch contact details
      const contactResponse = await fetch(`/api/contacts/${contactId}`)
      if (!contactResponse.ok) {
        throw new Error('Failed to fetch contact details')
      }
      const contactData = await contactResponse.json()
      setContact(contactData)

      // Fetch contact info
      const infoResponse = await fetch(`/api/contacts/${contactId}/contact-info`)
      if (infoResponse.ok) {
        const infoData = await infoResponse.json()
        setContactInfo(infoData.contactInfo || [])
      }

      // Fetch interactions
      const interactionsResponse = await fetch(`/api/contacts/${contactId}/interactions`)
      if (interactionsResponse.ok) {
        const interactionsData = await interactionsResponse.json()
        setInteractions(interactionsData.interactions || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch contact details')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteContact = async () => {
    if (!contact || !confirm(`Are you sure you want to delete ${contact.first_name}? This action cannot be undone.`)) {
      return
    }

    try {
      setDeletingContact(true)
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete contact')
      }

      onDelete?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete contact')
    } finally {
      setDeletingContact(false)
    }
  }

  const handleInteractionAdded = (newInteraction: Interaction) => {
    setInteractions(prev => [newInteraction, ...prev])
    setShowAddInteraction(false)
    // Refresh contact to get updated last_contacted_at
    fetchContactDetails()
  }

  const getContactDisplayName = (contact: Contact) => {
    if (contact.nickname) {
      return `${contact.first_name} "${contact.nickname}" ${contact.last_name || ''}`
    }
    return `${contact.first_name} ${contact.last_name || ''}`.trim()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const groupContactInfoByType = (contactInfo: ContactInfo[]) => {
    return contactInfo.reduce((acc, info) => {
      if (!acc[info.type]) {
        acc[info.type] = []
      }
      acc[info.type].push(info)
      return acc
    }, {} as Record<string, ContactInfo[]>)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-gray-200 h-8 rounded"></div>
        <div className="animate-pulse bg-gray-200 h-32 rounded"></div>
        <div className="animate-pulse bg-gray-200 h-48 rounded"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-600 p-4 bg-red-50 rounded-lg">
        Error: {error}
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="text-gray-500 text-center py-8">
        Contact not found
      </div>
    )
  }

  const groupedContactInfo = groupContactInfoByType(contactInfo)

  return (
    <div className="space-y-6">
      {/* Contact Header */}
      <div className="bg-card p-6 rounded-card shadow-card">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">
              {getContactDisplayName(contact)}
              {contact.reminders_paused && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Paused
                </span>
              )}
            </h1>
            <div className="mt-2 space-y-1 text-muted-foreground">
              {contact.birthday && (
                <div>Birthday: {contact.birthday}</div>
              )}
              {contact.communication_frequency && (
                <div>Frequency: {contact.communication_frequency}</div>
              )}
              {contact.last_contacted_at && (
                <div>Last contacted: {formatDate(contact.last_contacted_at)}</div>
              )}
            </div>
            {contact.notes && (
              <div className="mt-3 p-3 bg-muted rounded text-muted-foreground">
                {contact.notes}
              </div>
            )}
          </div>
          <div className="ml-4 space-x-2">
            <button
              onClick={() => contact && onEdit?.(contact)}
              className="px-3 py-2 text-sm font-medium text-primary bg-primary/10 rounded hover:bg-primary/20"
            >
              Edit
            </button>
            <button
              onClick={handleDeleteContact}
              disabled={deletingContact}
              className="px-3 py-2 text-sm font-medium text-destructive bg-destructive/10 rounded hover:bg-destructive/20 disabled:opacity-50"
            >
              {deletingContact ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      {contactInfo.length > 0 && (
        <div className="bg-card p-6 rounded-card shadow-card">
          <h2 className="text-lg font-semibold text-foreground mb-4">Contact Information</h2>
          <div className="space-y-4">
            {Object.entries(groupedContactInfo).map(([type, infos]) => (
              <div key={type}>
                <h3 className="text-sm font-medium text-muted-foreground capitalize mb-2">{type}</h3>
                <div className="space-y-2">
                  {infos.map((info) => (
                    <div key={info.id} className="flex items-center justify-between p-3 bg-muted rounded">
                      <div>
                        <div className="font-medium text-foreground">{info.value}</div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {info.label} {info.is_primary && '(Primary)'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactions */}
      <div className="bg-card p-6 rounded-card shadow-card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-foreground">Interactions</h2>
          <button
            onClick={() => setShowAddInteraction(true)}
            className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded hover:bg-primary/80"
          >
            Add Interaction
          </button>
        </div>

        {showAddInteraction && (
          <div className="mb-6 p-4 border border-border rounded-card">
            <InteractionForm
              contactId={contactId}
              onSave={handleInteractionAdded}
              onCancel={() => setShowAddInteraction(false)}
            />
          </div>
        )}

        {interactions.length === 0 ? (
          <div className="text-muted-foreground text-center py-4">
            No interactions recorded yet.
          </div>
        ) : (
          <div className="space-y-3">
            {interactions.map((interaction) => (
              <div key={interaction.id} className="p-4 border border-border rounded-card">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                        {interaction.type}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatDateTime(interaction.interaction_date)}
                      </span>
                    </div>
                    <div className="mt-2 text-foreground">
                      {interaction.notes}
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