'use client'

import { useState, useEffect } from 'react'
import { ContactService } from '@/services/ContactService'
import { ReminderService } from '@/services/ReminderService'
import { ReminderCalculatorService } from '@/services/ReminderCalculatorService'
import { AutomatedReminderService } from '@/services/AutomatedReminderService'
import { Contact, Reminder } from '@/types/database'

export default function ReminderDebugPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [generating, setGenerating] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [results, setResults] = useState<string[]>([])
  const [stats, setStats] = useState<any>(null)

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [contactsData, remindersData] = await Promise.all([
        ContactService.getAll(),
        ReminderService.getAll()
      ])

      setContacts(contactsData)
      setReminders(remindersData)

      // Get specific Aaron info
      const aaron = contactsData.find(c =>
        c.first_name.toLowerCase().includes('aaron') ||
        c.last_name?.toLowerCase().includes('aaron')
      )

      if (aaron) {
        addResult(`Found Aaron: ${aaron.first_name} ${aaron.last_name || ''}`)
        addResult(`Communication frequency: ${aaron.communication_frequency || 'none set'}`)
        addResult(`Last contacted: ${aaron.last_contacted_at || 'never'}`)
        addResult(`Reminders paused: ${aaron.reminders_paused ? 'yes' : 'no'}`)

        if (aaron.communication_frequency) {
          const needsReminder = ReminderCalculatorService.needsCommunicationReminder(aaron)
          addResult(`Needs reminder: ${needsReminder ? 'YES' : 'no'}`)

          if (aaron.last_contacted_at) {
            const daysOverdue = ReminderCalculatorService.daysOverdue(
              aaron.communication_frequency,
              aaron.last_contacted_at
            )
            addResult(`Days overdue: ${daysOverdue}`)
          }

          const nextReminderDate = ReminderCalculatorService.calculateNextReminderDate(
            aaron.communication_frequency,
            aaron.last_contacted_at
          )
          addResult(`Next reminder should be: ${nextReminderDate.toLocaleDateString()}`)

          // Check existing reminders for Aaron
          const aaronReminders = remindersData.filter(r => r.contact_id === aaron.id)
          addResult(`Existing reminders for Aaron: ${aaronReminders.length}`)
          aaronReminders.forEach(reminder => {
            addResult(`  - ${reminder.status} reminder scheduled for ${new Date(reminder.scheduled_for).toLocaleDateString()}`)
          })
        }
      } else {
        addResult('Aaron not found in contacts')
      }

    } catch (error) {
      addResult(`Error loading data: ${error}`)
    }
  }

  const generateReminders = async () => {
    setGenerating(true)
    try {
      addResult('Starting reminder generation...')
      const result = await AutomatedReminderService.generateUpcomingReminders()
      addResult(`Generated ${result.created} new reminders, skipped ${result.skipped}`)

      // Reload data to see changes
      await loadData()
    } catch (error) {
      addResult(`Error generating reminders: ${error}`)
    }
    setGenerating(false)
  }

  const refreshAllReminders = async () => {
    setRefreshing(true)
    try {
      addResult('Refreshing all reminders (this will delete existing pending reminders)...')
      const result = await AutomatedReminderService.refreshAllReminders()
      addResult(`Deleted ${result.deleted} old reminders, created ${result.created} new ones for ${result.contacts} contacts`)

      // Reload data to see changes
      await loadData()
    } catch (error) {
      addResult(`Error refreshing reminders: ${error}`)
    }
    setRefreshing(false)
  }

  const getStats = async () => {
    try {
      const statsData = await AutomatedReminderService.getReminderStats()
      setStats(statsData)
      addResult(`Stats loaded: ${statsData.pending} pending, ${statsData.overdue} overdue, ${statsData.scheduled} scheduled`)
    } catch (error) {
      addResult(`Error loading stats: ${error}`)
    }
  }

  const contactsWithFrequency = contacts.filter(c => c.communication_frequency && !c.reminders_paused)
  const contactsNeedingReminders = contactsWithFrequency.filter(c =>
    ReminderCalculatorService.needsCommunicationReminder(c)
  )

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Contact Reminder Debug</h1>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{contacts.length}</div>
          <div className="text-sm text-gray-600">Total Contacts</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">{contactsWithFrequency.length}</div>
          <div className="text-sm text-gray-600">With Reminder Frequency</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-red-600">{contactsNeedingReminders.length}</div>
          <div className="text-sm text-gray-600">Need Reminders Now</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-purple-600">{reminders.filter(r => r.status === 'pending').length}</div>
          <div className="text-sm text-gray-600">Pending Reminders</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={generateReminders}
          disabled={generating}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {generating ? 'Generating...' : 'Generate Missing Reminders'}
        </button>
        <button
          onClick={refreshAllReminders}
          disabled={refreshing}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {refreshing ? 'Refreshing...' : 'Refresh All Reminders'}
        </button>
        <button
          onClick={getStats}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Get Stats
        </button>
        <button
          onClick={() => setResults([])}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Clear Log
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold mb-2">Reminder Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>Pending: {stats.pending}</div>
            <div>Overdue: {stats.overdue}</div>
            <div>Scheduled: {stats.scheduled}</div>
            <div>Weekly: {stats.byFrequency.weekly}</div>
            <div>Monthly: {stats.byFrequency.monthly}</div>
          </div>
        </div>
      )}

      {/* Contacts Needing Reminders */}
      {contactsNeedingReminders.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold mb-2">Contacts Needing Reminders ({contactsNeedingReminders.length})</h3>
          <div className="space-y-2">
            {contactsNeedingReminders.map(contact => {
              const daysOverdue = contact.communication_frequency && contact.last_contacted_at
                ? ReminderCalculatorService.daysOverdue(contact.communication_frequency, contact.last_contacted_at)
                : 0

              return (
                <div key={contact.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <strong>{contact.first_name} {contact.last_name}</strong>
                    <span className="ml-2 text-sm text-gray-600">
                      ({contact.communication_frequency})
                    </span>
                  </div>
                  <div className="text-sm">
                    {daysOverdue > 0 ? (
                      <span className="text-red-600">{daysOverdue} days overdue</span>
                    ) : (
                      <span className="text-green-600">Due now</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Debug Log */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">Debug Log</h3>
        <div className="max-h-96 overflow-y-auto bg-gray-100 p-3 rounded text-sm font-mono">
          {results.length === 0 ? (
            <div className="text-gray-500">No debug messages yet...</div>
          ) : (
            results.map((result, i) => (
              <div key={i} className="mb-1">{result}</div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}