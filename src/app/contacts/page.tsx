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
  const [isUpdatingFrequency, setIsUpdatingFrequency] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [allContactsOnPage, setAllContactsOnPage] = useState<Set<string>>(new Set())

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

  const handleRandomizeExistingDates = async () => {
    const confirmMessage = `This will randomize the last contact dates for ALL contacts that have a communication frequency but no last contact date. This spreads out future reminders. Continue?`
    if (!confirm(confirmMessage)) return

    try {
      setIsUpdatingFrequency(true)

      // Fetch all contacts that need date randomization
      const response = await fetch('/api/contacts')
      const data = await response.json()
      const contactsNeedingDates = data.contacts.filter((contact: any) =>
        contact.communication_frequency && !contact.last_contacted_at
      )

      if (contactsNeedingDates.length === 0) {
        alert('No contacts found that need date randomization.')
        setIsUpdatingFrequency(false)
        return
      }

      // Update each contact with a random date
      const updatePromises = contactsNeedingDates.map((contact: any) => {
        const frequencyDays = {
          weekly: 7,
          monthly: 30,
          quarterly: 90,
          biannually: 180,
          annually: 365
        }

        const maxDaysBack = frequencyDays[contact.communication_frequency as keyof typeof frequencyDays] || 365
        const randomDaysBack = Math.floor(Math.random() * maxDaysBack)
        const randomDate = new Date()
        randomDate.setDate(randomDate.getDate() - randomDaysBack)

        return fetch(`/api/contacts/${contact.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            last_contacted_at: randomDate.toISOString()
          })
        })
      })

      await Promise.all(updatePromises)

      alert(`Successfully randomized dates for ${contactsNeedingDates.length} contacts!`)
      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      console.error('Error randomizing dates:', error)
      alert('Failed to randomize some dates. Please try again.')
    } finally {
      setIsUpdatingFrequency(false)
    }
  }

  const handleBulkFrequencyUpdate = async (frequency: string) => {
    if (selectedContacts.size === 0) return

    const frequencyLabel = frequency === '' ? 'remove frequency' : `set frequency to ${frequency}`
    const confirmMessage = `Are you sure you want to ${frequencyLabel} for ${selectedContacts.size} contact${selectedContacts.size > 1 ? 's' : ''}?${frequency !== '' ? ' This will randomize their last contact dates to spread out reminders.' : ''}`
    if (!confirm(confirmMessage)) return

    try {
      setIsUpdatingFrequency(true)

      // Generate random dates for each contact to spread out reminders
      const contactUpdates = Array.from(selectedContacts).map(contactId => {
        let updateData: any = {
          communication_frequency: frequency === '' ? undefined : frequency
        }

        // If setting a frequency (not removing), randomize the last contact date
        if (frequency !== '') {
          const frequencyDays = {
            weekly: 7,
            monthly: 30,
            quarterly: 90,
            biannually: 180,
            annually: 365
          }

          const maxDaysBack = frequencyDays[frequency as keyof typeof frequencyDays] || 365

          // Random date between 0 and maxDaysBack ago
          const randomDaysBack = Math.floor(Math.random() * maxDaysBack)
          const randomDate = new Date()
          randomDate.setDate(randomDate.getDate() - randomDaysBack)

          updateData.last_contacted_at = randomDate.toISOString()
        }

        return fetch(`/api/contacts/${contactId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData)
        })
      })

      await Promise.all(contactUpdates)

      setSelectedContacts(new Set())
      setBulkSelectMode(false)
      // Force refresh the contact list
      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      console.error('Error updating contact frequencies:', error)
      alert('Failed to update some contact frequencies. Please try again.')
    } finally {
      setIsUpdatingFrequency(false)
    }
  }

  const handleBulkPauseUpdate = async (shouldPause: boolean) => {
    if (selectedContacts.size === 0) return

    const action = shouldPause ? 'pause' : 'unpause'
    const confirmMessage = `Are you sure you want to ${action} reminders for ${selectedContacts.size} contact${selectedContacts.size > 1 ? 's' : ''}?`
    if (!confirm(confirmMessage)) return

    try {
      setIsUpdatingFrequency(true)

      const contactUpdates = Array.from(selectedContacts).map(contactId => {
        return fetch(`/api/contacts/${contactId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reminders_paused: shouldPause
          })
        })
      })

      await Promise.all(contactUpdates)

      setSelectedContacts(new Set())
      setBulkSelectMode(false)
      // Force refresh the contact list
      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      console.error('Error updating reminder status:', error)
      alert('Failed to update some contact reminder statuses. Please try again.')
    } finally {
      setIsUpdatingFrequency(false)
    }
  }

  const toggleBulkSelectMode = () => {
    setBulkSelectMode(!bulkSelectMode)
    setSelectedContacts(new Set())
  }

  const handleSelectAll = () => {
    setSelectedContacts(new Set(allContactsOnPage))
  }

  const handleDeselectAll = () => {
    setSelectedContacts(new Set())
  }

  const areAllSelected = allContactsOnPage.size > 0 && selectedContacts.size === allContactsOnPage.size &&
    Array.from(allContactsOnPage).every(id => selectedContacts.has(id))

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

              {/* Select All / Deselect All */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={areAllSelected ? handleDeselectAll : handleSelectAll}
                  disabled={allContactsOnPage.size === 0}
                  className="px-3 py-1 text-sm bg-muted text-foreground rounded hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {areAllSelected ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {/* Bulk Frequency Update */}
              <div className="flex items-center space-x-2">
                <label className="text-sm text-muted-foreground">Set frequency:</label>
                <select
                  onChange={(e) => {
                    if (e.target.value && selectedContacts.size > 0) {
                      handleBulkFrequencyUpdate(e.target.value)
                      e.target.value = '' // Reset dropdown
                    }
                  }}
                  disabled={selectedContacts.size === 0 || isUpdatingFrequency}
                  className="px-3 py-1 text-sm border border-border rounded bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                  defaultValue=""
                >
                  <option value="">Choose frequency...</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="biannually">Biannually</option>
                  <option value="annually">Annually</option>
                  <option value="">Remove frequency</option>
                </select>
                {isUpdatingFrequency && (
                  <span className="text-sm text-muted-foreground">Updating...</span>
                )}
              </div>

              {/* Bulk Pause/Unpause */}
              <div className="flex items-center space-x-2">
                <label className="text-sm text-muted-foreground">Reminders:</label>
                <select
                  onChange={(e) => {
                    if (e.target.value && selectedContacts.size > 0) {
                      handleBulkPauseUpdate(e.target.value === 'pause')
                      e.target.value = '' // Reset dropdown
                    }
                  }}
                  disabled={selectedContacts.size === 0 || isUpdatingFrequency}
                  className="px-3 py-1 text-sm border border-border rounded bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                  defaultValue=""
                >
                  <option value="">Choose action...</option>
                  <option value="pause">Pause reminders</option>
                  <option value="unpause">Unpause reminders</option>
                </select>
              </div>

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
            {bulkSelectMode ? 'Cancel' : 'Bulk Actions'}
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

            {/* Page Size Selector */}
            <div className="mt-6 pt-4 border-t border-border">
              <label className="block text-sm font-medium text-foreground mb-2">
                Contacts per page
              </label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
                <option value={200}>200 per page</option>
                <option value={500}>500 per page</option>
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                Choose how many contacts to display on each page
              </p>
            </div>

            {/* Randomize Existing Dates */}
            <div className="mt-6 pt-4 border-t border-border">
              <label className="block text-sm font-medium text-foreground mb-2">
                Fix existing contacts
              </label>
              <button
                onClick={handleRandomizeExistingDates}
                disabled={isUpdatingFrequency}
                className="w-full px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdatingFrequency ? 'Updating...' : 'Randomize dates for contacts without last contact date'}
              </button>
              <p className="mt-1 text-xs text-muted-foreground">
                Spreads out reminders for contacts that have frequency but no last contact date
              </p>
            </div>
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
              pageSize={pageSize}
              onContactsLoaded={(contactIds) => setAllContactsOnPage(new Set(contactIds))}
            />
          </div>
        </div>
      </div>
    </div>
  )
}