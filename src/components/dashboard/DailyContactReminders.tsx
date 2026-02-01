'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ContactService } from '@/services/ContactService'
import { Contact } from '@/types/database'
import { getWhatsAppLinkForContact } from '@/lib/whatsapp'

interface ContactWithPhone {
  contact: Contact
  primaryPhone: string
}

export default function DailyContactReminders() {
  const [contacts, setContacts] = useState<ContactWithPhone[]>([])
  const [loading, setLoading] = useState(true)
  const [clickedContacts, setClickedContacts] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadContacts()
  }, [])

  async function loadContacts() {
    try {
      const contactsWithPhone = await ContactService.getContactsWithPrimaryPhone()
      setContacts(contactsWithPhone)
    } catch (error) {
      console.error('Failed to load daily contact reminders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWhatsAppClick = (contactId: string) => {
    // Track that WhatsApp link was clicked
    setClickedContacts(prev => new Set(prev).add(contactId))
  }

  const handleMarkContacted = async (contactId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      // Update last contacted date
      await ContactService.updateLastContactedAt(contactId)

      // Remove from the list
      setContacts(prev => prev.filter(item => item.contact.id !== contactId))
      setClickedContacts(prev => {
        const newSet = new Set(prev)
        newSet.delete(contactId)
        return newSet
      })
    } catch (error) {
      console.error('Failed to mark contact as contacted:', error)
      alert('Failed to update contact. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-card">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-foreground">Daily Contact Reminders</h2>
        </div>
        <div className="p-4 text-center text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-card">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-foreground">Daily Contact Reminders</h2>
        <span className="text-sm text-muted-foreground">
          {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="p-4 space-y-4">
        {contacts.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            All caught up! No contacts need reaching out today.
          </div>
        ) : (
          contacts.map((item) => {
            const whatsappLink = getWhatsAppLinkForContact(item.contact, item.primaryPhone)
            const hasClicked = clickedContacts.has(item.contact.id)
            const isMissingBirthday = !item.contact.birthday

            return (
              <div
                key={item.contact.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
              >
                {/* Left: Contact Info */}
                <div className="flex items-center space-x-3 flex-1">
                  <Link
                    href={`/contacts/${item.contact.id}`}
                    className="flex items-center space-x-3 flex-1 group"
                  >
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center group-hover:bg-primary/80 transition-colors">
                      <span className="text-sm font-medium text-primary-foreground">
                        {item.contact.first_name?.[0]}{item.contact.last_name?.[0]}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {item.contact.first_name} {item.contact.last_name}
                        </h3>
                        {isMissingBirthday && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                            No birthday
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.primaryPhone}
                      </p>
                    </div>
                  </Link>
                </div>

                {/* Right: Action Buttons */}
                <div className="flex items-center space-x-2">
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleWhatsAppClick(item.contact.id)}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded transition-colors"
                    style={{ backgroundColor: '#16a34a', color: 'white' }}
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </a>

                  {hasClicked && (
                    <button
                      onClick={(e) => handleMarkContacted(item.contact.id, e)}
                      className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Mark contacted
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
