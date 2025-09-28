'use client'

import { useState } from 'react'

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

interface ShoppingList {
  id: string
  name: string
  items?: ShoppingItem[]
  created_at: string
  updated_at?: string
}

interface ShoppingItem {
  id: string
  name: string
  quantity?: number
  completed: boolean
  shopping_list_id: string
  created_at: string
}

export default function SimpleV3Page() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([])
  const [activeTab, setActiveTab] = useState<'contacts' | 'tasks' | 'meetings' | 'shopping' | 'urgent'>('contacts')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Helper functions for dashboard cards
  const getUpcomingTasks = () => {
    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

    return tasks.filter(task => {
      if (task.completed || !task.due_date) return false
      const dueDate = new Date(task.due_date)
      return dueDate >= today && dueDate <= nextWeek
    }).slice(0, 5)
  }

  const getContactsToContact = () => {
    const today = new Date()

    return contacts.filter(contact => {
      if (!contact.communication_frequency || !contact.last_contacted_at) return false

      const lastContact = new Date(contact.last_contacted_at)
      const daysSinceContact = Math.floor((today.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24))

      const frequencyDays = {
        'daily': 1,
        'weekly': 7,
        'biweekly': 14,
        'monthly': 30,
        'quarterly': 90,
        'annually': 365
      }[contact.communication_frequency] || 30

      return daysSinceContact >= frequencyDays
    }).slice(0, 5)
  }

  const getUpcomingBirthdays = () => {
    if (!contacts.length) return []

    const today = new Date()
    const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)

    return contacts.filter(contact => {
      if (!contact.birthday) return false

      const birthday = new Date(contact.birthday)
      const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate())

      if (thisYearBirthday < today) {
        thisYearBirthday.setFullYear(today.getFullYear() + 1)
      }

      return thisYearBirthday >= today && thisYearBirthday <= nextMonth
    }).slice(0, 5)
  }

  const getUrgentTasks = () => {
    return tasks.filter(task =>
      !task.completed &&
      (task.priority === 'high' || task.priority === 'urgent')
    ).slice(0, 10)
  }

  const loadAllData = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log('🚀 Loading all CRM data...')

      // Dynamic import to avoid any caching issues
      const { supabase } = await import('@/lib/supabase')

      // Load contacts
      console.log('📱 Loading contacts...')
      const contactsResult = await supabase
        .from('personal_contacts')
        .select('id, first_name, last_name, nickname, birthday, communication_frequency, last_contacted_at, created_at, updated_at, notes')
        .order('created_at', { ascending: false })
        .limit(200)

      if (contactsResult.error) {
        throw new Error(`Contacts: ${contactsResult.error.message}`)
      }

      setContacts(contactsResult.data || [])
      console.log(`✅ Loaded ${contactsResult.data?.length || 0} contacts`)

      // Load tasks
      console.log('✅ Loading tasks...')
      const tasksResult = await supabase
        .from('personal_tasks')
        .select('id, title, description, priority, status, due_date, completed_at, category, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(100)

      if (tasksResult.error) {
        throw new Error(`Tasks: ${tasksResult.error.message}`)
      }

      // Transform tasks
      const transformedTasks = (tasksResult.data || []).map(task => ({
        ...task,
        completed: task.status === 'completed' || task.completed_at !== null
      }))

      setTasks(transformedTasks)
      console.log(`✅ Loaded ${tasksResult.data?.length || 0} tasks`)

      // Load meetings
      console.log('📝 Loading meetings...')
      const meetingsResult = await supabase
        .from('meeting_agendas')
        .select('id, title, attendees, meeting_date, agenda, notes, fireflies_link, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(50)

      if (meetingsResult.error) {
        throw new Error(`Meetings: ${meetingsResult.error.message}`)
      }

      // Transform meetings
      const transformedMeetings = (meetingsResult.data || []).map(meeting => ({
        ...meeting,
        agenda_items: meeting.agenda ? meeting.agenda.split('\n').filter(item => item.trim()) : []
      }))

      setMeetings(transformedMeetings)
      console.log(`✅ Loaded ${meetingsResult.data?.length || 0} meetings`)

      // Load shopping lists
      console.log('🛒 Loading shopping lists...')
      const shoppingResult = await supabase
        .from('personal_shopping_lists')
        .select(`
          id,
          name,
          created_at,
          updated_at,
          personal_shopping_items (
            id,
            name,
            quantity,
            completed,
            shopping_list_id,
            created_at
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20)

      if (shoppingResult.error) {
        console.warn('Shopping lists not available:', shoppingResult.error.message)
        setShoppingLists([])
      } else {
        // Transform shopping data
        const transformedShopping = (shoppingResult.data || []).map(list => ({
          ...list,
          items: list.personal_shopping_items || []
        }))
        setShoppingLists(transformedShopping)
        console.log(`✅ Loaded ${shoppingResult.data?.length || 0} shopping lists`)
      }

      console.log('🎉 All data loaded successfully!')
    } catch (err: any) {
      console.error('❌ Error loading data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          📱 Simple Personal CRM v3
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <h2 className="font-semibold text-green-800 mb-2">✅ Status</h2>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Contacts: {contacts.length}</li>
              <li>• Tasks: {tasks.length}</li>
              <li>• Meetings: {meetings.length}</li>
              <li>• Shopping Lists: {shoppingLists.length}</li>
              <li>• {error ? '❌ Error' : loading ? '⏳ Loading' : '✅ Ready'}</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <h2 className="font-semibold text-blue-800 mb-2">🔧 Actions</h2>
            <button
              onClick={loadAllData}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-300"
            >
              {loading ? '⏳ Loading...' : '📥 Load All Data'}
            </button>
          </div>
        </div>

        {/* Dashboard Cards - Only show when data is loaded */}
        {(contacts.length > 0 || tasks.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Upcoming Tasks */}
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">📅 Due This Week</h3>
              {getUpcomingTasks().length === 0 ? (
                <p className="text-sm text-yellow-600">No tasks due this week</p>
              ) : (
                <div className="space-y-1">
                  {getUpcomingTasks().map(task => (
                    <div key={task.id} className="text-sm">
                      <div className="font-medium text-yellow-800">{task.title}</div>
                      <div className="text-yellow-600">
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Contacts to Contact */}
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <h3 className="font-semibold text-blue-800 mb-2">💬 Follow Up</h3>
              {getContactsToContact().length === 0 ? (
                <p className="text-sm text-blue-600">All contacts up to date</p>
              ) : (
                <div className="space-y-1">
                  {getContactsToContact().map(contact => (
                    <div key={contact.id} className="text-sm">
                      <div className="font-medium text-blue-800">
                        {contact.first_name} {contact.last_name}
                      </div>
                      <div className="text-blue-600">{contact.communication_frequency}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Birthdays */}
            <div className="bg-purple-50 border border-purple-200 rounded p-4">
              <h3 className="font-semibold text-purple-800 mb-2">🎂 Birthdays</h3>
              {getUpcomingBirthdays().length === 0 ? (
                <p className="text-sm text-purple-600">No birthdays this month</p>
              ) : (
                <div className="space-y-1">
                  {getUpcomingBirthdays().map(contact => (
                    <div key={contact.id} className="text-sm">
                      <div className="font-medium text-purple-800">
                        {contact.first_name} {contact.last_name}
                      </div>
                      <div className="text-purple-600">
                        {contact.birthday ? new Date(contact.birthday).toLocaleDateString() : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
            <p className="text-red-700">❌ Error: {error}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
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
          <button
            onClick={() => setActiveTab('shopping')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'shopping'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            🛒 Shopping ({shoppingLists.length})
          </button>
          <button
            onClick={() => setActiveTab('urgent')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'urgent'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            🚨 Urgent ({getUrgentTasks().length})
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {/* Contacts Tab */}
        {activeTab === 'contacts' && (
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">👥 Your Contacts</h2>
            {contacts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No contacts loaded. Click "Load All Data" above.</p>
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
        {activeTab === 'tasks' && (
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">✅ Your Tasks</h2>
            {tasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No tasks loaded. Click "Load All Data" above.</p>
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
                          {task.priority && (
                            <p className="text-sm text-gray-500">Priority: {task.priority}</p>
                          )}
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
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
        {activeTab === 'meetings' && (
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📝 Your Meetings</h2>
            {meetings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No meetings loaded. Click "Load All Data" above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {meetings.map((meeting) => (
                  <div key={meeting.id} className="border border-gray-200 rounded p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{meeting.title}</h3>
                        {meeting.meeting_date && (
                          <p className="text-sm text-blue-600">📅 {new Date(meeting.meeting_date).toLocaleDateString()}</p>
                        )}
                        <p className="text-sm text-gray-600">
                          {meeting.agenda_items?.length || 0} agenda items
                        </p>
                        {meeting.notes && (
                          <p className="text-sm text-gray-600 mt-1">{meeting.notes.substring(0, 100)}...</p>
                        )}
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

        {/* Shopping Tab */}
        {activeTab === 'shopping' && (
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">🛒 Shopping Lists</h2>
            {shoppingLists.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No shopping lists loaded. Click "Load All Data" above.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {shoppingLists.map((list) => (
                  <div key={list.id} className="border border-gray-200 rounded p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-medium text-gray-900">{list.name}</h3>
                      <span className="text-xs text-gray-500">
                        {list.created_at ? new Date(list.created_at).toLocaleDateString() : ''}
                      </span>
                    </div>
                    {list.items && list.items.length > 0 ? (
                      <div className="space-y-1">
                        {list.items.map((item) => (
                          <div key={item.id} className="flex items-center space-x-2">
                            <div className={`w-4 h-4 rounded border-2 ${
                              item.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'
                            }`}>
                              {item.completed && <div className="text-white text-xs">✓</div>}
                            </div>
                            <span className={`text-sm ${item.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                              {item.name}
                              {item.quantity && item.quantity > 1 && ` (${item.quantity})`}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No items in this list</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Urgent Tasks Tab */}
        {activeTab === 'urgent' && (
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">🚨 Urgent Tasks</h2>
            {getUrgentTasks().length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No urgent tasks. Great job! 🎉</p>
              </div>
            ) : (
              <div className="space-y-3">
                {getUrgentTasks().map((task) => (
                  <div key={task.id} className="border border-red-200 rounded p-4 bg-red-50">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-3">
                        <div className={`w-4 h-4 rounded border-2 mt-1 ${
                          task.completed ? 'bg-green-500 border-green-500' : 'border-red-400'
                        }`}>
                          {task.completed && <div className="text-white text-xs">✓</div>}
                        </div>
                        <div>
                          <h3 className={`font-medium ${task.completed ? 'text-gray-500 line-through' : 'text-red-800'}`}>
                            {task.title}
                          </h3>
                          <div className="flex items-center space-x-4 mt-1">
                            {task.priority && (
                              <span className={`text-xs px-2 py-1 rounded ${
                                task.priority === 'urgent' ? 'bg-red-600 text-white' : 'bg-orange-200 text-orange-800'
                              }`}>
                                {task.priority.toUpperCase()}
                              </span>
                            )}
                            {task.due_date && (
                              <span className="text-sm text-red-600">
                                Due: {new Date(task.due_date).toLocaleDateString()}
                              </span>
                            )}
                            {task.category && (
                              <span className="text-sm text-gray-600">{task.category}</span>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
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
      </div>
    </div>
  )
}