'use client'

import { useState, useEffect } from 'react'

export default function DebugJSONPage() {
  const [results, setResults] = useState<string[]>([])

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testDirectSupabaseCall = async () => {
    try {
      addResult('🔍 Testing direct Supabase REST API calls...')

      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
      const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!SUPABASE_URL || !SUPABASE_KEY) {
        addResult('❌ Missing environment variables')
        addResult(`URL: ${SUPABASE_URL ? '✅ Set' : '❌ Missing'}`)
        addResult(`Key: ${SUPABASE_KEY ? '✅ Set' : '❌ Missing'}`)
        return
      }

      addResult(`🔗 URL: ${SUPABASE_URL}`)
      addResult(`🔑 Key length: ${SUPABASE_KEY.length}`)

      // Test contacts endpoint
      addResult('📡 Testing contacts API...')
      const contactsResponse = await fetch(`${SUPABASE_URL}/rest/v1/personal_contacts?select=*&limit=5`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        }
      })

      addResult(`📊 Contacts Response Status: ${contactsResponse.status}`)
      addResult(`📊 Contacts Content-Type: ${contactsResponse.headers.get('content-type')}`)

      if (!contactsResponse.ok) {
        const errorText = await contactsResponse.text()
        addResult(`❌ Contacts Error Response: ${errorText.substring(0, 200)}...`)
        return
      }

      const contactsText = await contactsResponse.text()
      addResult(`📄 Contacts Raw Response (first 200 chars): ${contactsText.substring(0, 200)}...`)

      try {
        const contactsData = JSON.parse(contactsText)
        addResult(`✅ Contacts JSON parsed successfully: ${contactsData.length} records`)
      } catch (parseError: any) {
        addResult(`❌ Contacts JSON parse error: ${parseError.message}`)
        addResult(`🔍 Response starts with: "${contactsText.substring(0, 50)}"`)
      }

      // Test tasks endpoint
      addResult('📡 Testing tasks API...')
      const tasksResponse = await fetch(`${SUPABASE_URL}/rest/v1/personal_tasks?select=*&limit=5`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        }
      })

      addResult(`📊 Tasks Response Status: ${tasksResponse.status}`)
      addResult(`📊 Tasks Content-Type: ${tasksResponse.headers.get('content-type')}`)

      if (!tasksResponse.ok) {
        const errorText = await tasksResponse.text()
        addResult(`❌ Tasks Error Response: ${errorText.substring(0, 200)}...`)
        return
      }

      const tasksText = await tasksResponse.text()
      addResult(`📄 Tasks Raw Response (first 200 chars): ${tasksText.substring(0, 200)}...`)

      try {
        const tasksData = JSON.parse(tasksText)
        addResult(`✅ Tasks JSON parsed successfully: ${tasksData.length} records`)
      } catch (parseError: any) {
        addResult(`❌ Tasks JSON parse error: ${parseError.message}`)
        addResult(`🔍 Response starts with: "${tasksText.substring(0, 50)}"`)
      }

      // Test meetings endpoint
      addResult('📡 Testing meetings API...')
      const meetingsResponse = await fetch(`${SUPABASE_URL}/rest/v1/meeting_agendas?select=*&limit=5`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        }
      })

      addResult(`📊 Meetings Response Status: ${meetingsResponse.status}`)
      addResult(`📊 Meetings Content-Type: ${meetingsResponse.headers.get('content-type')}`)

      if (!meetingsResponse.ok) {
        const errorText = await meetingsResponse.text()
        addResult(`❌ Meetings Error Response: ${errorText.substring(0, 200)}...`)
        return
      }

      const meetingsText = await meetingsResponse.text()
      addResult(`📄 Meetings Raw Response (first 200 chars): ${meetingsText.substring(0, 200)}...`)

      try {
        const meetingsData = JSON.parse(meetingsText)
        addResult(`✅ Meetings JSON parsed successfully: ${meetingsData.length} records`)
      } catch (parseError: any) {
        addResult(`❌ Meetings JSON parse error: ${parseError.message}`)
        addResult(`🔍 Response starts with: "${meetingsText.substring(0, 50)}"`)
      }

    } catch (error: any) {
      addResult(`❌ Overall test error: ${error.message}`)
    }
  }

  const testSupabaseClient = async () => {
    try {
      addResult('🔍 Testing Supabase client import...')

      // Dynamic import to test if it works
      const { supabase } = await import('@/lib/supabase')
      addResult('✅ Supabase client imported successfully')

      addResult('📡 Testing client query...')
      const { data, error } = await supabase
        .from('personal_contacts')
        .select('id, first_name')
        .limit(3)

      if (error) {
        addResult(`❌ Client query error: ${JSON.stringify(error)}`)
        return
      }

      addResult(`✅ Client query successful: ${data?.length || 0} records`)
      if (data && data.length > 0) {
        addResult(`📄 Sample record: ${JSON.stringify(data[0])}`)
      }

    } catch (error: any) {
      addResult(`❌ Supabase client test error: ${error.message}`)
      addResult(`🔍 Error stack: ${error.stack?.substring(0, 300)}...`)
    }
  }

  const runAllTests = async () => {
    setResults([])
    addResult('🚀 Starting JSON/API debugging...')
    addResult('---')

    await testSupabaseClient()
    addResult('---')
    await testDirectSupabaseCall()
    addResult('---')
    addResult('🏁 All tests complete!')
  }

  useEffect(() => {
    runAllTests()
  }, [])

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🔬 JSON Debug Tool</h1>
      <p>This tool investigates the "Unexpected token '&lt;', \"&lt;!DOCTYPE\"" JSON parsing errors.</p>

      <button
        onClick={runAllTests}
        style={{
          background: '#dc3545',
          color: 'white',
          padding: '0.5rem 1rem',
          border: 'none',
          borderRadius: '4px',
          margin: '1rem 0'
        }}
      >
        🔄 Run All Tests
      </button>

      <div style={{
        background: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '1rem',
        fontFamily: 'monospace',
        fontSize: '14px',
        maxHeight: '70vh',
        overflow: 'auto'
      }}>
        {results.map((result, index) => (
          <div key={index} style={{ marginBottom: '0.5rem' }}>
            {result}
          </div>
        ))}
      </div>
    </div>
  )
}