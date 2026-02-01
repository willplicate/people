'use client'

import { useState } from 'react'
import ReminderList from '@/components/ReminderList'

export default function RemindersPage() {
  const [showDismissed, setShowDismissed] = useState(false)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reminders</h1>
        <p className="mt-2 text-gray-600">
          Stay on top of your relationships with automated reminders
        </p>
      </div>

      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showDismissed"
              checked={showDismissed}
              onChange={(e) => setShowDismissed(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="showDismissed" className="ml-2 text-sm text-gray-900">
              Show dismissed reminders
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reminder Types Info */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Reminder Types</h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <div className="font-medium text-sm">Stay in Touch</div>
                <div className="text-xs text-gray-600">Based on communication frequency</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div>
                <div className="font-medium text-sm">Birthday Soon</div>
                <div className="text-xs text-gray-600">7-day advance warning</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <div>
                <div className="font-medium text-sm">Birthday Today</div>
                <div className="text-xs text-gray-600">On the special day</div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="font-medium text-sm text-gray-900 mb-2">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => window.location.href = '/contacts'}
                className="block w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded"
              >
                View All Contacts
              </button>
              <button
                onClick={() => window.location.href = '/contacts/new'}
                className="block w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded"
              >
                Add New Contact
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="block w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Reminder List */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {showDismissed ? 'All Reminders' : 'Active Reminders'}
              </h2>
            </div>

            <ReminderList showDismissed={showDismissed} />
          </div>
        </div>
      </div>
    </div>
  )
}