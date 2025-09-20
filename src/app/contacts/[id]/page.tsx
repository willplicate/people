'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import ContactDetail from '@/components/ContactDetail'
import ContactForm from '@/components/ContactForm'
import { Contact } from '@/types/database'

export default function ContactDetailPage() {
  const router = useRouter()
  const params = useParams()
  const contactId = params.id as string
  const [isEditing, setIsEditing] = useState(false)
  const [contact, setContact] = useState<Contact | null>(null)
  const [editLoading, setEditLoading] = useState(false)

  const handleEdit = (contactData: Contact) => {
    setContact(contactData)
    setIsEditing(true)
  }

  const handleSave = async (updatedContact: Contact) => {
    try {
      setEditLoading(true)
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedContact),
      })

      if (!response.ok) {
        throw new Error('Failed to update contact')
      }

      const savedContact = await response.json()
      setContact(savedContact)
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating contact:', error)
      // You might want to show an error message to the user here
    } finally {
      setEditLoading(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const handleDelete = () => {
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

      {isEditing ? (
        <div className="bg-card p-6 rounded-card shadow-card">
          <h1 className="text-2xl font-bold text-foreground mb-6">Edit Contact</h1>
          <ContactForm
            contact={contact}
            onSave={handleSave}
            onCancel={handleCancel}
            isLoading={editLoading}
          />
        </div>
      ) : (
        <ContactDetail
          contactId={contactId}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}