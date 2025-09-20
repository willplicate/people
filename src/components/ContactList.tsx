'use client'

import { useState, useEffect } from 'react'
import { Contact, ContactInfo } from '@/types/database'
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
  }, [searchQuery, filters, refreshTrigger])

  useEffect(() => {
    fetchContacts(currentPage)
  }, [currentPage])

  const fetchContacts = async (page: number = currentPage) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) {
        params.append('search', searchQuery)
      }
      if (filters.christmasList !== undefined) {
        params.append('christmasList', filters.christmasList.toString())
      }
      if (filters.communicationFrequency) {
        params.append('communicationFrequency', filters.communicationFrequency)
      }
      if (filters.remindersPaused !== undefined) {
        params.append('remindersPaused', filters.remindersPaused.toString())
      }

      // Add pagination parameters
      params.append('limit', pageSize.toString())
      params.append('offset', ((page - 1) * pageSize).toString())

      const response = await fetch(`/api/contacts?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch contacts')
      }

      const data = await response.json()
      const contactsData = data.contacts || []
      const totalCount = data.totalCount || contactsData.length

      setTotalCount(totalCount)
      setHasNextPage(contactsData.length === pageSize)

      // For now, skip contact info loading to improve performance
      // We can add contact info later with proper batch loading or joins
      setContacts(
        contactsData.map((contact: Contact) => ({
          ...contact,
          contactInfo: {} // Empty for now - improves performance dramatically
        }))
      )
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
      {/* Pagination Info */}
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <div>
          Showing {(currentPage - 1) * pageSize + 1} to{' '}
          {Math.min(currentPage * pageSize, totalCount)} of {totalCount}{' '}
          contacts
        </div>
        <div>
          Page {currentPage} of {totalPages}
        </div>
      </div>

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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm border border-border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-2 text-sm border rounded-md ${
                    currentPage === pageNum
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm border border-border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
