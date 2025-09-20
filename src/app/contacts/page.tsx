'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Contact } from '@/types/database'
import ContactList from '@/components/ContactList'
import SearchFilter, { FilterOptions } from '@/components/SearchFilter'

export default function ContactsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FilterOptions>({})
  const [bulkSelectMode, setBulkSelectMode] = useState(false)
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleContactSelect = (contact: Contact) => {
    if (!bulkSelectMode) {
      router.push(`/contacts/${contact.id}`)
    }
  }

  const handleCreateNew = () => {
    router.push('/contacts/new')
  }

  const handleContactToggle = (contactId: string) => {
    setSelectedContacts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(contactId)) {
        newSet.delete(contactId)
      } else {
        newSet.add(contactId)
      }
      return newSet
    })
  }

  const handleBulkDelete = async () => {
    if (selectedContacts.size === 0) return

    const confirmMessage = `Are you sure you want to delete ${selectedContacts.size} contact${selectedContacts.size > 1 ? 's' : ''}? This action cannot be undone.`
    if (!confirm(confirmMessage)) return

    try {
      setIsDeleting(true)
      const deletePromises = Array.from(selectedContacts).map(contactId =>
        fetch(`/api/contacts/${contactId}`, { method: 'DELETE' })
      )

      await Promise.all(deletePromises)

      setSelectedContacts(new Set())
      setBulkSelectMode(false)
      // Force refresh the contact list
      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      console.error('Error deleting contacts:', error)
      alert('Failed to delete some contacts. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleBulkSelectMode = () => {
    setBulkSelectMode(!bulkSelectMode)
    setSelectedContacts(new Set())
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contacts</h1>
          <p className="mt-2 text-muted-foreground">Manage your personal relationships</p>
        </div>
        <div className="flex items-center space-x-3">
          {bulkSelectMode && (
            <>
              <span className="text-sm text-muted-foreground">
                {selectedContacts.size} selected
              </span>
              <button
                onClick={handleBulkDelete}
                disabled={selectedContacts.size === 0 || isDeleting}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : `Delete ${selectedContacts.size > 0 ? `(${selectedContacts.size})` : ''}`}
              </button>
            </>
          )}
          <button
            onClick={toggleBulkSelectMode}
            className={`px-4 py-2 rounded-lg ${
              bulkSelectMode
                ? 'bg-muted text-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {bulkSelectMode ? 'Cancel' : 'Bulk Delete'}
          </button>
          <button
            onClick={handleCreateNew}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/80"
          >
            Add Contact
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search and Filter Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-card p-6 rounded-lg border border-border sticky top-4">
            <h2 className="text-lg font-semibold text-foreground mb-4">Search & Filter</h2>
            <SearchFilter
              onSearchChange={setSearchQuery}
              onFilterChange={setFilters}
            />
          </div>
        </div>

        {/* Contact List */}
        <div className="lg:col-span-2">
          <div className="bg-card p-6 rounded-lg border border-border">
            <ContactList
              onContactSelect={handleContactSelect}
              searchQuery={searchQuery}
              filters={filters}
              bulkSelectMode={bulkSelectMode}
              selectedContacts={selectedContacts}
              onContactToggle={handleContactToggle}
              refreshTrigger={refreshTrigger}
            />
          </div>
        </div>
      </div>
    </div>
  )
}