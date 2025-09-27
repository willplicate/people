'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Contact {
  id: string
  first_name: string
  last_name?: string
  nickname?: string
  birthday?: string
  communication_frequency?: string
  last_contacted_at?: string
  notes?: string
  created_at: string
  updated_at?: string
}

interface Task {
  id: string
  title: string
  description?: string
  priority?: string
  status: string
  due_date?: string
  completed_at?: string
  category?: string
  completed: boolean
  created_at: string
  updated_at?: string
}

interface Meeting {
  id: string
  title: string
  attendees?: string[]
  meeting_date?: string
  agenda?: string
  agenda_items: any[]
  notes?: string
  fireflies_link?: string
  created_at: string
  updated_at?: string
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
    nickname: '',
    notes: ''
  })

  const fetchContacts = async () => {
    try {
      console.log('Fetching contacts...')

      // Use the correct schema from debug data
      const result = await supabase
        .from('personal_contacts')
        .select('id, first_name, last_name, nickname, birthday, communication_frequency, last_contacted_at, created_at, updated_at, notes')
        .order('created_at', { ascending: false })
        .limit(50)

      if (result.error) {
        console.error('Contacts query error:', result.error)
        throw new Error(`Could not load contacts: ${result.error.message}`)
      }

      setContacts(result.data || [])
      console.log(`Successfully loaded ${result.data?.length || 0} contacts from 154 total`)
    } catch (err: any) {
      console.error('Fetch contacts error:', err)
      setError(`Contacts: ${err.message}`)
    }
  }

  const fetchTasks = async () => {
    try {
      console.log('Fetching tasks...')
      const { data, error } = await supabase
        .from('personal_tasks')
        .select('id, title, description, priority, status, due_date, completed_at, category, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Tasks error:', error)
        setTasks([])
        return
      }

      // Transform status to completed boolean for display
      const transformedTasks = (data || []).map(task => ({
        ...task,
        completed: task.status === 'completed' || task.completed_at !== null
      }))

      setTasks(transformedTasks)
      console.log(`Successfully loaded ${data?.length || 0} tasks from 19 total`)
    } catch (err: any) {
      console.error('Fetch tasks error:', err)
      setTasks([])
    }
  }

  const fetchMeetings = async () => {
    try {
      console.log('Fetching meetings...')
      const { data, error } = await supabase
        .from('meeting_agendas')
        .select('id, title, attendees, meeting_date, agenda, notes, fireflies_link, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Meetings error:', error)
        setMeetings([])
        return
      }

      // Transform agenda to agenda_items for display compatibility
      const transformedMeetings = (data || []).map(meeting => ({
        ...meeting,
        agenda_items: meeting.agenda ? meeting.agenda.split('\n').filter(item => item.trim()) : []
      }))

      setMeetings(transformedMeetings)
      console.log(`Successfully loaded ${data?.length || 0} meetings from 7 total`)
    } catch (err: any) {
      console.error('Fetch meetings error:', err)
      setMeetings([])
    }
  }

  const fetchAllData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Run all fetches in parallel - we know the connection works from test page
      await Promise.all([fetchContacts(), fetchTasks(), fetchMeetings()])
    } catch (err: any) {
      console.error('Fetch all data error:', err)
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
          nickname: newContact.nickname.trim() || null,
          notes: newContact.notes.trim() || null
        }])
        .select()
        .single()

      if (error) throw error

      setContacts(prev => [data, ...prev])
      setNewContact({ first_name: '', last_name: '', nickname: '', notes: '' })
      alert('Contact added successfully!')
    } catch (err: any) {
      alert('Error adding contact: ' + err.message)
    }
  }

  useEffect(() => {
    console.log('Simple page mounting, starting data fetch...')
    fetchAllData()
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          📱 Simple Personal CRM v2
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
            <h2 className="font-semibold text-blue-800 mb-2">📋 Connection Info</h2>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Contacts: {contacts.length}</li>
              <li>• Tasks: {tasks.length}</li>
              <li>• Meetings: {meetings.length}</li>
              <li>• Status: {error ? '❌ Error' : loading ? '⏳ Loading' : '✅ Connected'}</li>
              <li>• URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</li>
              <li>• Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</li>
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
              type="text"
              placeholder="Nickname"
              value={newContact.nickname}
              onChange={(e) => setNewContact(prev => ({ ...prev, nickname: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <textarea
              placeholder="Notes"
              value={newContact.notes}
              onChange={(e) => setNewContact(prev => ({ ...prev, notes: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
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
            <details className="mt-2">
              <summary className="text-sm text-red-600 cursor-pointer">Debug Info</summary>
              <div className="mt-2 text-xs text-red-600 font-mono bg-red-100 p-2 rounded">
                <p>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
                <p>Has Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Yes' : 'No'}</p>
                <p>Key Length: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0}</p>
              </div>
            </details>
            <button
              onClick={fetchAllData}
              className="mt-2 text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* Contacts Tab */}
        {activeTab === 'contacts' && !loading && (
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
                          {contact.nickname && contact.nickname !== contact.first_name && (
                            <span className="text-sm text-gray-500 ml-2">({contact.nickname})</span>
                          )}
                        </h3>
                        {contact.birthday && (
                          <p className="text-sm text-purple-600">🎂 {contact.birthday}</p>
                        )}
                        {contact.communication_frequency && (
                          <p className="text-sm text-green-600">📅 {contact.communication_frequency}</p>
                        )}
                        {contact.last_contacted_at && (
                          <p className="text-sm text-blue-600">💬 Last: {new Date(contact.last_contacted_at).toLocaleDateString()}</p>
                        )}
                        {contact.notes && (
                          <p className="text-sm text-gray-600 mt-1 italic">{contact.notes}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {contact.created_at ? new Date(contact.created_at).toLocaleDateString() : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && !loading && (
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
                            {task.title || task.name || 'Task'}
                          </h3>
                          {task.priority && (
                            <p className="text-sm text-gray-500">Priority: {task.priority}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {task.created_at ? new Date(task.created_at).toLocaleDateString() : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Meetings Tab */}
        {activeTab === 'meetings' && !loading && (
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
                        <h3 className="font-medium text-gray-900">{meeting.title || meeting.name || 'Meeting'}</h3>
                        <p className="text-sm text-gray-600">
                          {meeting.agenda_items?.length || 0} agenda items
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {meeting.created_at ? new Date(meeting.created_at).toLocaleDateString() : ''}
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