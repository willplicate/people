'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function DebugTabsPage() {
  const [results, setResults] = useState<string[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [meetings, setMeetings] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'contacts' | 'tasks' | 'meetings'>('contacts')

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const debugContactsTab = async () => {
    try {
      addResult('🔍 Testing contacts tab data loading...')

      // Test the exact same query as in simple page
      const result = await supabase
        .from('personal_contacts')
        .select('id, first_name, last_name, nickname, birthday, communication_frequency, last_contacted_at, created_at, updated_at, notes')
        .order('created_at', { ascending: false })
        .limit(50)

      if (result.error) {
        addResult(`❌ Contacts query error: ${JSON.stringify(result.error)}`)
        return
      }

      addResult(`✅ Contacts query successful: ${result.data?.length || 0} records`)
      setContacts(result.data || [])

      if (result.data && result.data.length > 0) {
        addResult(`📄 First contact: ${JSON.stringify(result.data[0], null, 2)}`)
      }

      // Test getting all contacts count
      const countResult = await supabase
        .from('personal_contacts')
        .select('id', { count: 'exact', head: true })

      addResult(`📊 Total contacts count: ${countResult.count}`)

    } catch (error: any) {
      addResult(`❌ Contacts tab error: ${error.message}`)
    }
  }

  const debugTasksTab = async () => {
    try {
      addResult('🔍 Testing tasks tab data loading...')

      const { data, error } = await supabase
        .from('personal_tasks')
        .select('id, title, description, priority, status, due_date, completed_at, category, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        addResult(`❌ Tasks query error: ${JSON.stringify(error)}`)
        return
      }

      addResult(`✅ Tasks query successful: ${data?.length || 0} records`)

      // Transform status to completed boolean for display
      const transformedTasks = (data || []).map(task => ({
        ...task,
        completed: task.status === 'completed' || task.completed_at !== null
      }))

      setTasks(transformedTasks)

      if (data && data.length > 0) {
        addResult(`📄 First task: ${JSON.stringify(data[0], null, 2)}`)
        addResult(`📄 First transformed task: ${JSON.stringify(transformedTasks[0], null, 2)}`)
      }

    } catch (error: any) {
      addResult(`❌ Tasks tab error: ${error.message}`)
    }
  }

  const debugMeetingsTab = async () => {
    try {
      addResult('🔍 Testing meetings tab data loading...')

      const { data, error } = await supabase
        .from('meeting_agendas')
        .select('id, title, attendees, meeting_date, agenda, notes, fireflies_link, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        addResult(`❌ Meetings query error: ${JSON.stringify(error)}`)
        return
      }

      addResult(`✅ Meetings query successful: ${data?.length || 0} records`)

      // Transform agenda to agenda_items for display compatibility
      const transformedMeetings = (data || []).map(meeting => ({
        ...meeting,
        agenda_items: meeting.agenda ? meeting.agenda.split('\n').filter(item => item.trim()) : []
      }))

      setMeetings(transformedMeetings)

      if (data && data.length > 0) {
        addResult(`📄 First meeting: ${JSON.stringify(data[0], null, 2)}`)
        addResult(`📄 First transformed meeting: ${JSON.stringify(transformedMeetings[0], null, 2)}`)
      }

    } catch (error: any) {
      addResult(`❌ Meetings tab error: ${error.message}`)
    }
  }

  const testSupabaseConnection = async () => {
    try {
      addResult('🔍 Testing basic Supabase connection...')

      // Test connection with a simple query
      const { data, error } = await supabase
        .from('personal_contacts')
        .select('count')
        .limit(1)

      if (error) {
        addResult(`❌ Connection error: ${JSON.stringify(error)}`)
        return false
      }

      addResult(`✅ Supabase connection working`)
      return true
    } catch (error: any) {
      addResult(`❌ Connection test failed: ${error.message}`)
      return false
    }
  }

  const runAllTests = async () => {
    setResults([])
    addResult('🚀 Starting comprehensive tab debugging...')
    addResult('---')

    const connectionOk = await testSupabaseConnection()
    if (!connectionOk) {
      addResult('🛑 Stopping tests due to connection failure')
      return
    }

    addResult('---')
    await debugContactsTab()
    addResult('---')
    await debugTasksTab()
    addResult('---')
    await debugMeetingsTab()
    addResult('---')
    addResult('🏁 All tests complete!')
  }

  useEffect(() => {
    runAllTests()
  }, [])

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🔬 Tab Debug Tool</h1>

      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={runAllTests}
          style={{
            background: '#0066cc',
            color: 'white',
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '4px',
            marginRight: '1rem'
          }}
        >
          🔄 Run All Tests
        </button>

        <button
          onClick={debugContactsTab}
          style={{
            background: '#28a745',
            color: 'white',
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '4px',
            marginRight: '1rem'
          }}
        >
          👥 Test Contacts Only
        </button>

        <button
          onClick={debugTasksTab}
          style={{
            background: '#ffc107',
            color: 'black',
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '4px',
            marginRight: '1rem'
          }}
        >
          ✅ Test Tasks Only
        </button>

        <button
          onClick={debugMeetingsTab}
          style={{
            background: '#dc3545',
            color: 'white',
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          📝 Test Meetings Only
        </button>
      </div>

      {/* Tab Navigation - same as simple page */}
      <div style={{ borderBottom: '1px solid #dee2e6', marginBottom: '2rem' }}>
        <button
          onClick={() => setActiveTab('contacts')}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            borderBottom: activeTab === 'contacts' ? '2px solid #007bff' : '2px solid transparent',
            background: 'none',
            color: activeTab === 'contacts' ? '#007bff' : '#6c757d',
            marginRight: '1rem'
          }}
        >
          👥 Contacts ({contacts.length})
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            borderBottom: activeTab === 'tasks' ? '2px solid #007bff' : '2px solid transparent',
            background: 'none',
            color: activeTab === 'tasks' ? '#007bff' : '#6c757d',
            marginRight: '1rem'
          }}
        >
          ✅ Tasks ({tasks.length})
        </button>
        <button
          onClick={() => setActiveTab('meetings')}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            borderBottom: activeTab === 'meetings' ? '2px solid #007bff' : '2px solid transparent',
            background: 'none',
            color: activeTab === 'meetings' ? '#007bff' : '#6c757d'
          }}
        >
          📝 Meetings ({meetings.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'contacts' && (
        <div style={{ marginBottom: '2rem' }}>
          <h2>👥 Contacts Tab ({contacts.length})</h2>
          {contacts.length === 0 ? (
            <p>No contacts loaded</p>
          ) : (
            <div>
              {contacts.slice(0, 5).map((contact) => (
                <div key={contact.id} style={{
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  padding: '1rem',
                  marginBottom: '0.5rem',
                  background: '#f8f9fa'
                }}>
                  <h3>{contact.first_name} {contact.last_name}</h3>
                  {contact.nickname && <p>Nickname: {contact.nickname}</p>}
                  {contact.birthday && <p>🎂 {contact.birthday}</p>}
                  {contact.communication_frequency && <p>📅 {contact.communication_frequency}</p>}
                  {contact.notes && <p>📝 {contact.notes}</p>}
                </div>
              ))}
              {contacts.length > 5 && <p>... and {contacts.length - 5} more</p>}
            </div>
          )}
        </div>
      )}

      {activeTab === 'tasks' && (
        <div style={{ marginBottom: '2rem' }}>
          <h2>✅ Tasks Tab ({tasks.length})</h2>
          {tasks.length === 0 ? (
            <p>No tasks loaded</p>
          ) : (
            <div>
              {tasks.slice(0, 5).map((task) => (
                <div key={task.id} style={{
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  padding: '1rem',
                  marginBottom: '0.5rem',
                  background: '#f8f9fa'
                }}>
                  <h3>{task.title}</h3>
                  <p>Status: {task.status} | Completed: {task.completed ? 'Yes' : 'No'}</p>
                  {task.priority && <p>Priority: {task.priority}</p>}
                  {task.description && <p>Description: {task.description}</p>}
                </div>
              ))}
              {tasks.length > 5 && <p>... and {tasks.length - 5} more</p>}
            </div>
          )}
        </div>
      )}

      {activeTab === 'meetings' && (
        <div style={{ marginBottom: '2rem' }}>
          <h2>📝 Meetings Tab ({meetings.length})</h2>
          {meetings.length === 0 ? (
            <p>No meetings loaded</p>
          ) : (
            <div>
              {meetings.slice(0, 5).map((meeting) => (
                <div key={meeting.id} style={{
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  padding: '1rem',
                  marginBottom: '0.5rem',
                  background: '#f8f9fa'
                }}>
                  <h3>{meeting.title}</h3>
                  {meeting.meeting_date && <p>📅 {meeting.meeting_date}</p>}
                  <p>Agenda items: {meeting.agenda_items?.length || 0}</p>
                  {meeting.notes && <p>Notes: {meeting.notes}</p>}
                </div>
              ))}
              {meetings.length > 5 && <p>... and {meetings.length - 5} more</p>}
            </div>
          )}
        </div>
      )}

      {/* Debug Output */}
      <div style={{
        background: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '1rem',
        fontFamily: 'monospace',
        fontSize: '14px',
        maxHeight: '40vh',
        overflow: 'auto'
      }}>
        <h3>Debug Output:</h3>
        {results.map((result, index) => (
          <div key={index} style={{ marginBottom: '0.5rem' }}>
            {result}
          </div>
        ))}
      </div>
    </div>
  )
}