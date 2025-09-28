'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ContactForm from '@/components/ContactForm'
import CSVImport from '@/components/CSVImport'
import { Contact } from '@/types/database'

export default function NewContactPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single')

  const handleSave = (contact: Contact) => {
    // Navigate to the new contact's detail page
    router.push(`/contacts/${contact.id}`)
  }

  const handleCancel = () => {
    router.push('/contacts')
  }

  const handleBack = () => {
    router.push('/contacts')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={handleBack}
          className="inline-flex items-center text-primary hover:text-primary/80"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Contacts
        </button>
      </div>

      <div className="bg-card p-6 rounded-card shadow-card">
        <h1 className="text-2xl font-bold text-foreground mb-6">Add New Contact</h1>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-card">
          <button
            onClick={() => setActiveTab('single')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'single'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Single Contact
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'bulk'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Bulk Import (CSV)
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'single' ? (
          <div>
            <p className="text-muted-foreground mb-6">
              Create a new contact to track your personal relationships and stay connected.
            </p>
            <ContactForm
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </div>
        ) : (
          <div>
            <p className="text-muted-foreground mb-6">
              Import multiple contacts at once using a CSV file. Perfect for adding many contacts quickly.
            </p>
            <CSVImport />
          </div>
        )}
      </div>
    </div>
  )
}