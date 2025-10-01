'use client'

import { useState, useEffect } from 'react'
import { DashboardService } from '@/services/DashboardService'
import { ContactService } from '@/services/ContactService'
import { ReminderService } from '@/services/ReminderService'
import { AutomatedReminderService } from '@/services/AutomatedReminderService'
import { Contact, Reminder } from '@/types/database'

interface ContactWithReminder {
  contact: Contact
  reminder: Reminder
  daysOverdue: number
}

export default function UpcomingContacts() {
  const [contacts, setContacts] = useState<ContactWithReminder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadContacts() {
      try {
        // Get both overdue and upcoming reminders
        const [needingAttention, upcomingReminders] = await Promise.all([
          DashboardService.getContactsNeedingAttention(),
          DashboardService.getUpcomingReminders(7) // Next 7 days
        ])

        // Combine overdue and upcoming reminders
        const allRelevantContacts: ContactWithReminder[] = [
          ...needingAttention.overdueReminders,
          ...upcomingReminders.map(item => ({
            contact: item.contact,
            reminder: item.reminder,
            daysOverdue: Math.floor((Date.now() - new Date(item.reminder.scheduled_for).getTime()) / (1000 * 60 * 60 * 24))
          }))
        ]

        // Remove duplicates and sort by urgency (most overdue first, then soonest due)
        const uniqueContacts = allRelevantContacts
          .filter((item, index, arr) =>
            arr.findIndex(other => other.contact.id === item.contact.id) === index
          )
          .sort((a, b) => {
            // Overdue items first (positive daysOverdue)
            if (a.daysOverdue > 0 && b.daysOverdue <= 0) return -1
            if (b.daysOverdue > 0 && a.daysOverdue <= 0) return 1
            // Among overdue items, most overdue first
            if (a.daysOverdue > 0 && b.daysOverdue > 0) return b.daysOverdue - a.daysOverdue
            // Among upcoming items, soonest first (least negative)
            return a.daysOverdue - b.daysOverdue
          })

        setContacts(uniqueContacts.slice(0, 5)) // Show top 5
      } catch (error) {
        console.error('Failed to load contacts:', error)
      } finally {
        setLoading(false)
      }
    }

    loadContacts()
  }, [])

  const handleMarkContacted = async (contactId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      // Find the reminder ID and contact for this contact
      const contactItem = contacts.find(item => item.contact.id === contactId)
      const reminderId = contactItem?.reminder.id
      const contact = contactItem?.contact

      // Update last contacted date to now
      await ContactService.updateLastContactedAt(contactId)

      // Dismiss the associated reminder so it doesn't reappear
      if (reminderId) {
        await ReminderService.dismiss(reminderId)
      }

      // Generate a new reminder for the next contact date
      if (contact) {
        const updatedContact = await ContactService.getById(contactId)
        if (updatedContact) {
          await AutomatedReminderService.generateReminderForContact(updatedContact)
        }
      }

      // Remove from the list immediately
      setContacts(prev => prev.filter(item => item.contact.id !== contactId))
    } catch (error) {
      console.error('Failed to mark contact as contacted:', error)
      alert('Failed to update contact. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-card">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-foreground">Upcoming Contacts</h2>
          <button className="text-tertiary text-sm font-medium">View All</button>
        </div>
        <div className="p-4 text-center text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-card">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-foreground">Upcoming Contacts</h2>
        <button className="text-tertiary text-sm font-medium">View All</button>
      </div>

      <div className="p-4 space-y-4">
        {contacts.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            All contacts up to date!
          </div>
        ) : (
          contacts.map((item) => (
            <div key={item.contact.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3 flex-1">
                <input
                  type="checkbox"
                  onChange={(e) => handleMarkContacted(item.contact.id, e as any)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  title="Mark as contacted"
                />
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-foreground">
                    {item.contact.first_name?.[0]}{item.contact.last_name?.[0]}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">
                    {item.contact.first_name} {item.contact.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {item.contact.last_contacted_at
                      ? `Last contacted ${Math.floor((Date.now() - new Date(item.contact.last_contacted_at).getTime()) / (1000 * 60 * 60 * 24))} days ago`
                      : 'Never contacted'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`text-sm font-medium whitespace-nowrap ${
                  item.daysOverdue > 0
                    ? 'text-destructive'
                    : item.daysOverdue === 0
                      ? 'text-orange-600'
                      : 'text-blue-600'
                }`}>
                  {item.daysOverdue > 0
                    ? `${item.daysOverdue} days overdue`
                    : item.daysOverdue === 0
                      ? 'Due today'
                      : `Due in ${Math.abs(item.daysOverdue)} days`
                  }
                </span>
                <button
                  onClick={(e) => handleMarkContacted(item.contact.id, e)}
                  className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                  title="Mark as contacted"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}