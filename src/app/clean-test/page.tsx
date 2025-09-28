'use client'

import { useState, useEffect } from 'react'

// Inline Supabase client to avoid any dependencies
async function testSupabase() {
  const url = 'https://tdclhoimzksmqmnsaccw.supabase.co'
  const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkY2xob2ltemtzbXFtbnNhY2N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NzAxMjUsImV4cCI6MjA3MjI0NjEyNX0.lkxHRLuT4liiDJWt4AnSk24rFY5E3sceyApZ7kVTGL4'

  try {
    const response = await fetch(`${url}/rest/v1/personal_contacts?select=*&limit=5`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return { success: true, data, count: data.length }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export default function CleanTestPage() {
  const [result, setResult] = useState<string>('Loading...')

  useEffect(() => {
    async function test() {
      console.log('Testing clean connection...')
      const result = await testSupabase()

      if (result.success) {
        setResult(`✅ Success! Found ${result.count} contacts`)
        console.log('Clean test data:', result.data)
      } else {
        setResult(`❌ Failed: ${result.error}`)
        console.error('Clean test error:', result.error)
      }
    }

    test()
  }, [])

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🧪 Clean Connection Test</h1>
      <div style={{
        background: '#f5f5f5',
        padding: '1rem',
        borderRadius: '8px',
        fontFamily: 'monospace',
        margin: '1rem 0'
      }}>
        {result}
      </div>
      <p>This page has zero dependencies and should work without any NextAuth errors.</p>
    </div>
  )
}