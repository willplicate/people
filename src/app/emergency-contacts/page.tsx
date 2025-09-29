'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Contact, ContactInfo } from '@/types/database'
import { ContactService } from '@/services/ContactService'
import { ContactInfoService } from '@/services/ContactInfoService'

interface EmergencyContactWithInfo extends Contact {
  contactInfo?: ContactInfo[]
}

export default function EmergencyContactsPage() {
  const router = useRouter()
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContactWithInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEmergencyContacts()
  }, [])

  const fetchEmergencyContacts = async () => {
    try {
      setLoading(true)

      // Get all contacts
      const allContacts = await ContactService.getAll()

      // Filter for emergency contacts only
      const emergencyContacts = allContacts.filter(contact => contact.is_emergency)

      // Get contact info for each emergency contact
      const contactsWithInfo = await Promise.all(
        emergencyContacts.map(async (contact) => {
          try {
            const contactInfo = await ContactInfoService.getByContactId(contact.id)
            return {
              ...contact,
              contactInfo
            }
          } catch (error) {
            console.warn(`Failed to get contact info for ${contact.first_name}:`, error)
            return {
              ...contact,
              contactInfo: []
            }
          }
        })
      )

      setEmergencyContacts(contactsWithInfo)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch emergency contacts')
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

  const formatContactInfo = (contactInfo: ContactInfo[]) => {
    if (!contactInfo || contactInfo.length === 0) return null

    return contactInfo.map((info) => (
      <div key={info.id} className="flex items-center space-x-2">
        <span className="text-xs px-2 py-1 bg-muted rounded text-muted-foreground capitalize">
          {info.type} ({info.label})
        </span>
        <span className="font-medium text-foreground">{info.value}</span>
        {info.is_primary && (
          <span className="text-xs text-primary">Primary</span>
        )}
      </div>
    ))
  }

  const handleContactClick = (contact: Contact) => {
    router.push(`/contacts/${contact.id}`)
  }

  const handleCallContact = (phoneNumber: string) => {
    window.location.href = `tel:${phoneNumber}`
  }

  const handleEmailContact = (email: string) => {
    window.location.href = `mailto:${email}`
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">🚨 Emergency Contacts</h1>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-muted h-32 rounded-card"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">🚨 Emergency Contacts</h1>
        <div className="text-destructive p-4 bg-destructive/10 rounded-card">
          Error: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center">
          🚨 Emergency Contacts
        </h1>
        <p className="mt-2 text-muted-foreground">
          Quick access to important contacts for emergency situations
        </p>
      </div>

      {emergencyContacts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏥</div>
          <h3 className="text-lg font-medium text-foreground mb-2">No Emergency Contacts</h3>
          <p className="text-muted-foreground mb-6">
            Mark contacts as emergency contacts to see them here for quick access.
          </p>
          <button
            onClick={() => router.push('/contacts')}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-card hover:bg-primary/80"
          >
            Manage Contacts
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {emergencyContacts.map((contact) => (
            <div
              key={contact.id}
              className="bg-card p-6 rounded-card shadow-card border-2 border-destructive/20 hover:border-destructive/40 transition-colors"
            >
              {/* Emergency Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-destructive text-destructive-foreground">
                  🚨 EMERGENCY
                </span>
                <button
                  onClick={() => handleContactClick(contact)}
                  className="text-sm text-primary hover:text-primary/80"
                >
                  View Details →
                </button>
              </div>

              {/* Contact Name */}
              <h2 className="text-xl font-bold text-foreground mb-3">
                {getContactDisplayName(contact)}
              </h2>

              {/* Contact Information */}
              <div className="space-y-3">
                {contact.contactInfo && contact.contactInfo.length > 0 ? (
                  <div className="space-y-2">
                    {contact.contactInfo.map((info) => (
                      <div key={info.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs px-2 py-1 bg-muted rounded text-muted-foreground capitalize">
                            {info.type} ({info.label})
                          </span>
                          <span className="font-medium text-foreground">{info.value}</span>
                        </div>
                        <div className="flex space-x-2">
                          {info.type === 'phone' && (
                            <button
                              onClick={() => handleCallContact(info.value)}
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                            >
                              📞 Call
                            </button>
                          )}
                          {info.type === 'email' && (
                            <button
                              onClick={() => handleEmailContact(info.value)}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                            >
                              ✉️ Email
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">No contact information available</p>
                )}
              </div>

              {/* Notes */}
              {contact.notes && (
                <div className="mt-4 p-3 bg-muted rounded text-sm text-muted-foreground">
                  <strong>Notes:</strong> {contact.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Quick Add Emergency Contact */}
      <div className="mt-8 text-center">
        <button
          onClick={() => router.push('/contacts/new')}
          className="bg-secondary text-secondary-foreground px-6 py-3 rounded-card hover:bg-secondary/80"
        >
          Add New Emergency Contact
        </button>
      </div>
    </div>
  )
}