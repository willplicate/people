'use client'

import { useState, useEffect } from 'react'
import { Contact, ContactInfo } from '@/types/database'
import { ContactService } from '@/services/ContactService'
import { FilterOptions } from './SearchFilter'

interface ContactListProps {
  onContactSelect?: (contact: Contact) => void
  searchQuery?: string
  filters?: FilterOptions
  selectedContactId?: string
  bulkSelectMode?: boolean
  selectedContacts?: Set<string>
  onContactToggle?: (contactId: string) => void
  refreshTrigger?: number
  pageSize?: number
  onContactsLoaded?: (contactIds: string[]) => void
}

type ContactWithInfo = Contact & {
  contactInfo?: {
    phone?: ContactInfo
    email?: ContactInfo
    address?: ContactInfo
  }
}

export default function ContactList({
  onContactSelect,
  searchQuery = '',
  filters = {},
  selectedContactId,
  bulkSelectMode = false,
  selectedContacts = new Set(),
  onContactToggle,
  refreshTrigger = 0,
  pageSize = 25,
  onContactsLoaded,
}: ContactListProps) {
  const [contacts, setContacts] = useState<ContactWithInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [hasNextPage, setHasNextPage] = useState(false)

  useEffect(() => {
    setCurrentPage(1) // Reset to first page when search/filters change
    fetchContacts(1)
  }, [searchQuery, filters, refreshTrigger, pageSize])

  useEffect(() => {
    fetchContacts(currentPage)
  }, [currentPage])

  const fetchContacts = async (page: number = currentPage) => {
    try {
      setLoading(true)

      // Get all contacts using ContactService
      const allContacts = await ContactService.getAll()

      // Apply filters
      let filteredContacts = allContacts

      // Search filter
      if (searchQuery) {
        filteredContacts = filteredContacts.filter(contact => {
          const searchTerm = searchQuery.toLowerCase()
          return (
            contact.first_name?.toLowerCase().includes(searchTerm) ||
            contact.last_name?.toLowerCase().includes(searchTerm) ||
            contact.nickname?.toLowerCase().includes(searchTerm) ||
            contact.notes?.toLowerCase().includes(searchTerm)
          )
        })
      }

      // Christmas list filter
      if (filters.christmasList !== undefined) {
        filteredContacts = filteredContacts.filter(contact =>
          contact.christmas_list === filters.christmasList
        )
      }

      // Communication frequency filter
      if (filters.communicationFrequency) {
        filteredContacts = filteredContacts.filter(contact =>
          contact.communication_frequency === filters.communicationFrequency
        )
      }

      // Reminders paused filter
      if (filters.remindersPaused !== undefined) {
        filteredContacts = filteredContacts.filter(contact =>
          contact.reminders_paused === filters.remindersPaused
        )
      }

      // No frequency filter
      if (filters.noFrequency !== undefined) {
        filteredContacts = filteredContacts.filter(contact => {
          const hasNoFreq = !contact.communication_frequency
          return hasNoFreq === filters.noFrequency
        })
      }

      const totalCount = filteredContacts.length
      setTotalCount(totalCount)

      // Apply pagination
      const startIndex = (page - 1) * pageSize
      const endIndex = startIndex + pageSize
      const paginatedContacts = filteredContacts.slice(startIndex, endIndex)

      setHasNextPage(endIndex < totalCount)

      // Process contacts without contact info for now (performance)
      const processedContacts = paginatedContacts.map((contact: Contact) => ({
        ...contact,
        contactInfo: {} // Empty for now - improves performance dramatically
      }))

      setContacts(processedContacts)

      // Notify parent of loaded contact IDs for select all functionality
      if (onContactsLoaded) {
        onContactsLoaded(processedContacts.map((contact: Contact) => contact.id))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch contacts')
    } finally {
      setLoading(false)
    }
  }

  const getContactDisplayName = (contact: Contact) => {
    if (contact.nickname) {
      return `${contact.first_name} "${contact.nickname}" ${contact.last_name || ''}`
    }
    return `${contact.first_name} ${contact.last_name || ''}`.trim()
  }

  const formatLastContacted = (lastContactedAt?: string) => {
    if (!lastContactedAt) return 'Never'
    const date = new Date(lastContactedAt)
    return date.toLocaleDateString()
  }

  const getCommunicationFrequencyLabel = (frequency?: string) => {
    if (!frequency) return 'No frequency set'
    return frequency.charAt(0).toUpperCase() + frequency.slice(1)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-muted h-20 rounded-lg"></div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-destructive p-4 bg-destructive/10 rounded-lg">
        Error: {error}
      </div>
    )
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  if (contacts.length === 0) {
    return (
      <div className="text-muted-foreground text-center py-8">
        {searchQuery
          ? 'No contacts found matching your search.'
          : 'No contacts yet. Create your first contact!'}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Top Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, totalCount)} of {totalCount}{' '}
            contacts
          </div>

          <div className="flex items-center space-x-2">
            {/* First page */}
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="px-2 py-1 text-sm border border-border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              title="First page"
            >
              ««
            </button>

            {/* Previous page */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {/* Page input for quick navigation */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Page</span>
              <input
                type="number"
                min="1"
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const page = parseInt(e.target.value)
                  if (page >= 1 && page <= totalPages) {
                    handlePageChange(page)
                  }
                }}
                className="w-16 px-2 py-1 text-sm border border-border rounded text-center focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="text-sm text-muted-foreground">of {totalPages}</span>
            </div>

            {/* Next page */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>

            {/* Last page */}
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2 py-1 text-sm border border-border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              title="Last page"
            >
              »»
            </button>
          </div>
        </div>
      )}

      {/* Contact List */}
      <div className="space-y-2">
        {contacts.map((contact) => (
          <div
            key={contact.id}
            onClick={() => {
              if (bulkSelectMode) {
                onContactToggle?.(contact.id)
              } else {
                onContactSelect?.(contact)
              }
            }}
            className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted ${
              bulkSelectMode && selectedContacts.has(contact.id)
                ? 'border-primary bg-primary/10'
                : selectedContactId === contact.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-start space-x-3 flex-1">
                {bulkSelectMode && (
                  <input
                    type="checkbox"
                    checked={selectedContacts.has(contact.id)}
                    onChange={(e) => {
                      e.stopPropagation()
                      onContactToggle?.(contact.id)
                    }}
                    className="mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">
                    {getContactDisplayName(contact)}
                  </h3>
                  <div className="mt-1 text-sm text-muted-foreground space-y-1">
                    <div>
                      Frequency:{' '}
                      {getCommunicationFrequencyLabel(
                        contact.communication_frequency
                      )}
                    </div>
                    <div>
                      Last contacted:{' '}
                      {formatLastContacted(contact.last_contacted_at)}
                    </div>
                    {contact.birthday && (
                      <div>Birthday: {contact.birthday}</div>
                    )}
                    {contact.contactInfo?.phone && (
                      <div className="flex items-center space-x-1">
                        <span>📞</span>
                        <a
                          href={`tel:${contact.contactInfo.phone.value}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {contact.contactInfo.phone.value}
                        </a>
                      </div>
                    )}
                    {contact.contactInfo?.email && (
                      <div className="flex items-center space-x-1">
                        <span>✉️</span>
                        <a
                          href={`mailto:${contact.contactInfo.email.value}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {contact.contactInfo.email.value}
                        </a>
                      </div>
                    )}
                    {contact.contactInfo?.address && (
                      <div className="flex items-start space-x-1">
                        <span>📍</span>
                        <span className="text-gray-600 text-xs">
                          {contact.contactInfo.address.value}
                        </span>
                      </div>
                    )}
                  </div>
                  {contact.notes && (
                    <div className="mt-2 text-sm text-muted-foreground truncate">
                      {contact.notes}
                    </div>
                  )}
                </div>
              </div>
              {contact.reminders_paused && (
                <div className="ml-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Paused
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Pagination - Simplified */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6 p-2 bg-muted/20 rounded">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm border border-border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          <span className="px-3 py-1 text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm border border-border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
