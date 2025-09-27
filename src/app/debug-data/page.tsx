'use client'

import { useState, useEffect } from 'react'

const SUPABASE_URL = 'https://tdclhoimzksmqmnsaccw.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkY2xob2ltemtzbXFtbnNhY2N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NzAxMjUsImV4cCI6MjA3MjI0NjEyNX0.lkxHRLuT4liiDJWt4AnSk24rFY5E3sceyApZ7kVTGL4'

export default function DebugDataPage() {
  const [results, setResults] = useState<string[]>([])

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testQuery = async (tableName: string, limit = 10) => {
    try {
      addResult(`Testing table: ${tableName}`)

      const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=*&limit=${limit}`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        addResult(`❌ ${tableName}: HTTP ${response.status} - ${response.statusText}`)
        return
      }

      const data = await response.json()
      addResult(`✅ ${tableName}: Found ${data.length} records`)

      if (data.length > 0) {
        addResult(`📝 ${tableName} sample columns: ${Object.keys(data[0]).join(', ')}`)
        addResult(`📄 ${tableName} first record: ${JSON.stringify(data[0], null, 2)}`)
      }

      return data
    } catch (error: any) {
      addResult(`❌ ${tableName} error: ${error.message}`)
    }
  }

  const testCount = async (tableName: string) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=count`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'count=exact'
        }
      })

      if (response.ok) {
        const countHeader = response.headers.get('content-range')
        addResult(`📊 ${tableName} total count: ${countHeader}`)
      }
    } catch (error: any) {
      addResult(`❌ ${tableName} count error: ${error.message}`)
    }
  }

  const runTests = async () => {
    setResults([])
    addResult('🔍 Starting comprehensive data debug...')

    // Test different possible table names
    const tablesToTest = [
      'personal_contacts',
      'contacts',
      'personal_tasks',
      'tasks',
      'meeting_agendas',
      'meetings'
    ]

    for (const table of tablesToTest) {
      await testQuery(table, 5)
      await testCount(table)
      addResult('---')
    }

    addResult('🏁 Debug complete!')
  }

  useEffect(() => {
    runTests()
  }, [])

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🔬 Data Debug Tool</h1>

      <button
        onClick={runTests}
        style={{
          background: '#0066cc',
          color: 'white',
          padding: '0.5rem 1rem',
          border: 'none',
          borderRadius: '4px',
          margin: '1rem 0'
        }}
      >
        🔄 Run Tests Again
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