'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestSupabasePage() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    setResult('Testing...')

    try {
      // Test 1: Basic connection
      console.log('Environment check:')
      console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log('Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      console.log('Key length:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length)

      setResult(prev => prev + '\n✅ Environment variables loaded')

      // Test 2: Check if we can reach Supabase at all
      setResult(prev => prev + '\n🔍 Testing basic connectivity...')

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
          }
        })

        setResult(prev => prev + `\n✅ Basic fetch response: ${response.status}`)

        if (!response.ok) {
          const errorText = await response.text()
          setResult(prev => prev + `\n❌ HTTP Error: ${errorText}`)
        }
      } catch (fetchErr: any) {
        setResult(prev => prev + `\n❌ Fetch failed: ${fetchErr.message}`)
      }

      // Test 3: Try Supabase client query
      setResult(prev => prev + '\n🔍 Testing Supabase client...')

      const { data, error, count } = await supabase
        .from('personal_contacts')
        .select('*', { count: 'exact' })
        .limit(1)

      if (error) {
        setResult(prev => prev + `\n❌ Supabase error: ${error.message}`)
        setResult(prev => prev + `\n❌ Error code: ${error.code}`)
        setResult(prev => prev + `\n❌ Error hint: ${error.hint}`)
        setResult(prev => prev + `\n❌ Error details: ${error.details}`)
        return
      }

      setResult(prev => prev + `\n✅ Query successful`)
      setResult(prev => prev + `\n📊 Total contacts: ${count}`)
      setResult(prev => prev + `\n📝 Sample data: ${JSON.stringify(data, null, 2)}`)

    } catch (err: any) {
      setResult(prev => prev + `\n❌ Exception: ${err.message}`)
      setResult(prev => prev + `\n❌ Stack: ${err.stack}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    testConnection()
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>

      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="font-semibold mb-2">Environment Variables:</h2>
        <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET'}</p>
        <p>Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'}</p>
        <p>Key Length: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0}</p>
      </div>

      <button
        onClick={testConnection}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        {loading ? 'Testing...' : 'Test Connection'}
      </button>

      <pre className="bg-black text-green-400 p-4 rounded whitespace-pre-wrap">
        {result}
      </pre>
    </div>
  )
}