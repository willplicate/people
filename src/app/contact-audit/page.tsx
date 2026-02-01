'use client'

import { useState, useEffect } from 'react'
import { ContactService } from '@/services/ContactService'
import { ReminderService } from '@/services/ReminderService'
import { ReminderCalculatorService } from '@/services/ReminderCalculatorService'
import { AutomatedReminderService } from '@/services/AutomatedReminderService'
import { Contact, Reminder } from '@/types/database'

interface ContactAudit {
  contact: Contact
  needsReminder: boolean
  hasReminder: boolean
  reminderDetails: {
    nextDueDate: Date
    daysOverdue: number
    existingReminders: Reminder[]
    lastContactDays: number | null
  }
}

export default function ContactAuditPage() {
  const [audits, setAudits] = useState<ContactAudit[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'missing' | 'overdue' | 'weekly'>('missing')
  const [generating, setGenerating] = useState(false)
  const [results, setResults] = useState<string[]>([])

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    loadAudit()
  }, [])

  const loadAudit = async () => {
    try {
      setLoading(true)
      const [contacts, allReminders] = await Promise.all([
        ContactService.getAll(),
        ReminderService.getAll()
      ])

      const auditResults: ContactAudit[] = []

      for (const contact of contacts) {
        // Skip contacts without communication frequency or paused reminders
        if (!contact.communication_frequency || contact.reminders_paused) {
          continue
        }

        const needsReminder = ReminderCalculatorService.needsCommunicationReminder(contact)
        const nextDueDate = ReminderCalculatorService.calculateNextReminderDate(
          contact.communication_frequency,
          contact.last_contacted_at
        )

        const daysOverdue = contact.last_contacted_at
          ? ReminderCalculatorService.daysOverdue(contact.communication_frequency, contact.last_contacted_at)
          : 0

        const lastContactDays = contact.last_contacted_at
          ? Math.floor((Date.now() - new Date(contact.last_contacted_at).getTime()) / (1000 * 60 * 60 * 24))
          : null

        // Get existing reminders for this contact
        const existingReminders = allReminders.filter(r => r.contact_id === contact.id)
        const hasReminder = existingReminders.some(r => r.status === 'pending')

        auditResults.push({
          contact,
          needsReminder,
          hasReminder,
          reminderDetails: {
            nextDueDate,
            daysOverdue,
            existingReminders,
            lastContactDays
          }
        })
      }

      // Sort by most problematic first
      auditResults.sort((a, b) => {
        // Contacts needing reminders but missing them first
        if (a.needsReminder && !a.hasReminder && (!b.needsReminder || b.hasReminder)) return -1
        if ((!a.needsReminder || a.hasReminder) && b.needsReminder && !b.hasReminder) return 1

        // Then by days overdue
        return b.reminderDetails.daysOverdue - a.reminderDetails.daysOverdue
      })

      setAudits(auditResults)

      // Log summary
      const totalWithFrequency = auditResults.length
      const needingReminders = auditResults.filter(a => a.needsReminder).length
      const missingReminders = auditResults.filter(a => a.needsReminder && !a.hasReminder).length
      const weeklyContacts = auditResults.filter(a => a.contact.communication_frequency === 'weekly').length

      addResult(`Audit complete: ${totalWithFrequency} contacts with communication frequency`)
      addResult(`${needingReminders} contacts need reminders`)
      addResult(`${missingReminders} contacts need reminders but DON'T HAVE THEM`)
      addResult(`${weeklyContacts} weekly contacts total`)

      if (missingReminders > 0) {
        addResult(`❌ PROBLEM: ${missingReminders} contacts are missing reminders!`)
        const missingList = auditResults.filter(a => a.needsReminder && !a.hasReminder)
        missingList.forEach(audit => {
          addResult(`  - ${audit.contact.first_name} ${audit.contact.last_name}: ${audit.reminderDetails.daysOverdue} days overdue`)
        })
      }

    } catch (error) {
      addResult(`Error during audit: ${error}`)
    }
    setLoading(false)
  }

  const generateMissingReminders = async () => {
    setGenerating(true)
    try {
      addResult('🔧 Generating missing reminders...')
      const result = await AutomatedReminderService.generateUpcomingReminders()
      addResult(`✅ Generated ${result.created} reminders, skipped ${result.skipped}`)

      // Reload audit
      await loadAudit()
    } catch (error) {
      addResult(`❌ Error generating reminders: ${error}`)
    }
    setGenerating(false)
  }

  const refreshAllReminders = async () => {
    setGenerating(true)
    try {
      addResult('🔄 Refreshing ALL reminders (deleting old, creating new)...')
      const result = await AutomatedReminderService.refreshAllReminders()
      addResult(`✅ Deleted ${result.deleted} old reminders, created ${result.created} new ones`)

      // Reload audit
      await loadAudit()
    } catch (error) {
      addResult(`❌ Error refreshing reminders: ${error}`)
    }
    setGenerating(false)
  }

  const filteredAudits = audits.filter(audit => {
    switch (filter) {
      case 'missing': return audit.needsReminder && !audit.hasReminder
      case 'overdue': return audit.reminderDetails.daysOverdue > 0
      case 'weekly': return audit.contact.communication_frequency === 'weekly'
      default: return true
    }
  })

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center">Loading contact audit...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Contact Reminder Audit</h1>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{audits.length}</div>
          <div className="text-sm text-gray-600">Contacts with Frequency</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-red-600">
            {audits.filter(a => a.needsReminder && !a.hasReminder).length}
          </div>
          <div className="text-sm text-gray-600">Missing Reminders</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-orange-600">
            {audits.filter(a => a.reminderDetails.daysOverdue > 0).length}
          </div>
          <div className="text-sm text-gray-600">Overdue</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">
            {audits.filter(a => a.contact.communication_frequency === 'weekly').length}
          </div>
          <div className="text-sm text-gray-600">Weekly Contacts</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={generateMissingReminders}
          disabled={generating}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {generating ? 'Generating...' : 'Generate Missing Reminders'}
        </button>
        <button
          onClick={refreshAllReminders}
          disabled={generating}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {generating ? 'Refreshing...' : 'Refresh ALL Reminders'}
        </button>
        <button
          onClick={() => setResults([])}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Clear Log
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'missing', label: 'Missing Reminders', count: audits.filter(a => a.needsReminder && !a.hasReminder).length },
          { key: 'overdue', label: 'Overdue', count: audits.filter(a => a.reminderDetails.daysOverdue > 0).length },
          { key: 'weekly', label: 'Weekly', count: audits.filter(a => a.contact.communication_frequency === 'weekly').length },
          { key: 'all', label: 'All', count: audits.length }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`px-4 py-2 rounded ${
              filter === tab.key
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Contact List */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Due</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reminders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAudits.map(audit => (
                <tr key={audit.contact.id} className={`${
                  audit.needsReminder && !audit.hasReminder ? 'bg-red-50' : ''
                }`}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {audit.contact.first_name} {audit.contact.last_name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {audit.contact.communication_frequency}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {audit.reminderDetails.lastContactDays !== null
                      ? `${audit.reminderDetails.lastContactDays} days ago`
                      : 'Never'
                    }
                  </td>
                  <td className="px-4 py-3">
                    {audit.needsReminder && !audit.hasReminder ? (
                      <span className="text-red-600 font-medium">❌ MISSING REMINDER</span>
                    ) : audit.reminderDetails.daysOverdue > 0 ? (
                      <span className="text-orange-600 font-medium">{audit.reminderDetails.daysOverdue} days overdue</span>
                    ) : audit.hasReminder ? (
                      <span className="text-green-600">✅ Has reminder</span>
                    ) : (
                      <span className="text-gray-500">Up to date</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {audit.reminderDetails.nextDueDate.toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {audit.reminderDetails.existingReminders.length} total
                    {audit.reminderDetails.existingReminders.filter(r => r.status === 'pending').length > 0 && (
                      <span className="ml-1 text-green-600">({audit.reminderDetails.existingReminders.filter(r => r.status === 'pending').length} pending)</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Debug Log */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">Audit Log</h3>
        <div className="max-h-64 overflow-y-auto bg-gray-100 p-3 rounded text-sm font-mono">
          {results.length === 0 ? (
            <div className="text-gray-500">No messages yet...</div>
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