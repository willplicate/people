'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Contact } from '@/types/database'
import { ContactService } from '@/services/ContactService'
import ContactForm from '@/components/ContactForm'

interface ContactDetailClientProps {
  contact: Contact
}

export default function ContactDetailClient({ contact: initialContact }: ContactDetailClientProps) {
  const router = useRouter()
  const [contact, setContact] = useState<Contact>(initialContact)

  const handleSave = async (updatedContact: Contact) => {
    // Contact has been saved, update local state
    setContact(updatedContact)

    // Navigate back to contacts list
    router.push('/contacts')
  }

  const handleCancel = () => {
    router.push('/contacts')
  }

  const handleBack = () => {
    router.push('/contacts')
  }

  const handleDelete = async () => {
    const confirmMessage = `Are you sure you want to delete ${contact.first_name} ${contact.last_name || ''}? This action cannot be undone.`
    if (!confirm(confirmMessage)) return

    try {
      await ContactService.delete(contact.id)
      router.push('/contacts')
    } catch (err) {
      alert('Failed to delete contact. Please try again.')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={handleBack}
          className="inline-flex items-center text-primary hover:text-primary/80"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Contacts
        </button>

        <button
          onClick={handleDelete}
          className="text-destructive hover:text-destructive/80 text-sm font-medium"
        >
          Delete Contact
        </button>
      </div>

      <div className="bg-card p-6 rounded-card shadow-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Edit Contact
            </h1>
            <p className="text-muted-foreground mt-1">
              {contact.first_name} {contact.last_name || ''}
            </p>
          </div>
        </div>

        <div className="border-b border-border mb-6"></div>

        <ContactForm
          contact={contact}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}