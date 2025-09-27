'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Contact {
  id: string
  first_name: string
  last_name?: string
  email?: string
  phone?: string
  created_at: string
}

interface Task {
  id: string
  title: string
  completed: boolean
  priority: string
  created_at: string
}

interface Meeting {
  id: string
  title: string
  agenda_items: any[]
  created_at: string
}

export default function SimpleCRMPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [activeTab, setActiveTab] = useState<'contacts' | 'tasks' | 'meetings'>('contacts')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newContact, setNewContact] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: ''
  })

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('personal_contacts')
        .select('id, first_name, last_name, email, phone, created_at')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setContacts(data || [])
    } catch (err: any) {
      setError(err.message)
    }
  }

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('personal_tasks')
        .select('id, title, completed, priority, created_at')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setTasks(data || [])
    } catch (err: any) {
      setError(err.message)
    }
  }

  const fetchMeetings = async () => {
    try {
      const { data, error } = await supabase
        .from('meeting_agendas')
        .select('id, title, agenda_items, created_at')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setMeetings(data || [])
    } catch (err: any) {
      setError(err.message)
    }
  }

  const fetchAllData = async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([fetchContacts(), fetchTasks(), fetchMeetings()])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addContact = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newContact.first_name.trim()) {
      alert('First name is required')
      return
    }

    try {
      const { data, error } = await supabase
        .from('personal_contacts')
        .insert([{
          first_name: newContact.first_name.trim(),
          last_name: newContact.last_name.trim() || null,
          email: newContact.email.trim() || null,
          phone: newContact.phone.trim() || null
        }])
        .select()
        .single()

      if (error) throw error

      setContacts(prev => [data, ...prev])
      setNewContact({ first_name: '', last_name: '', email: '', phone: '' })
      alert('Contact added successfully!')
    } catch (err: any) {
      alert('Error adding contact: ' + err.message)
    }
  }

  useEffect(() => {
    fetchAllData()
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          📱 Simple Personal CRM
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <h2 className="font-semibold text-green-800 mb-2">✅ Working Features</h2>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Direct Supabase connection</li>
              <li>• View all your CRM data</li>
              <li>• Add new contacts</li>
              <li>• Mobile-friendly design</li>
              <li>• Tabbed interface</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <h2 className="font-semibold text-blue-800 mb-2">📋 Your Data</h2>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Contacts: {contacts.length}</li>
              <li>• Tasks: {tasks.length}</li>
              <li>• Meetings: {meetings.length}</li>
              <li>• Status: {error ? '❌ Error' : loading ? '⏳ Loading' : '✅ Connected'}</li>
            </ul>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mt-6">
          <button
            onClick={() => setActiveTab('contacts')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'contacts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            👥 Contacts ({contacts.length})
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'tasks'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            ✅ Tasks ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('meetings')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'meetings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📝 Meetings ({meetings.length})
          </button>
        </div>
      </div>

      {/* Add Contact Form - Only show on contacts tab */}
      {activeTab === 'contacts' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">➕ Add New Contact</h2>
          <form onSubmit={addContact} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="First Name *"
              value={newContact.first_name}
              onChange={(e) => setNewContact(prev => ({ ...prev, first_name: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Last Name"
              value={newContact.last_name}
              onChange={(e) => setNewContact(prev => ({ ...prev, last_name: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="email"
              placeholder="Email"
              value={newContact.email}
              onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="tel"
              placeholder="Phone"
              value={newContact.phone}
              onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
              >
                Add Contact
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Content Area */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {loading && (
          <div className="text-center py-8">
            <p className="text-gray-600">⏳ Loading data...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
            <p className="text-red-700">❌ Error: {error}</p>
            <button
              onClick={fetchAllData}
              className="mt-2 text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* Contacts Tab */}
        {activeTab === 'contacts' && !loading && !error && (
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">👥 Your Contacts</h2>
            {contacts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No contacts yet. Add your first contact above!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {contacts.map((contact) => (
                  <div key={contact.id} className="border border-gray-200 rounded p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {contact.first_name} {contact.last_name}
                        </h3>
                        {contact.email && (
                          <p className="text-sm text-blue-600">📧 {contact.email}</p>
                        )}
                        {contact.phone && (
                          <p className="text-sm text-green-600">📞 {contact.phone}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(contact.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && !loading && !error && (
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">✅ Your Tasks</h2>
            {tasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No tasks found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="border border-gray-200 rounded p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-3">
                        <div className={`w-4 h-4 rounded border-2 mt-1 ${
                          task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'
                        }`}>
                          {task.completed && <div className="text-white text-xs">✓</div>}
                        </div>
                        <div>
                          <h3 className={`font-medium ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                            {task.title}
                          </h3>
                          <p className="text-sm text-gray-500">Priority: {task.priority}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(task.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Meetings Tab */}
        {activeTab === 'meetings' && !loading && !error && (
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📝 Your Meetings</h2>
            {meetings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No meetings found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {meetings.map((meeting) => (
                  <div key={meeting.id} className="border border-gray-200 rounded p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{meeting.title}</h3>
                        <p className="text-sm text-gray-600">
                          {meeting.agenda_items?.length || 0} agenda items
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(meeting.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          This is a simplified version that works without API routes.
        </p>
        <Link
          href="/health"
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Health Check →
        </Link>
      </div>
    </div>
  )
}