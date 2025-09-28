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

      // Test 3: Check what tables exist
      setResult(prev => prev + '\n🔍 Checking available tables...')

      try {
        // Try to get schema information
        const { data: tables, error: tablesError } = await supabase
          .rpc('get_schema_tables')
          .single()

        if (tablesError) {
          setResult(prev => prev + `\n⚠️ Could not get table list: ${tablesError.message}`)
        } else {
          setResult(prev => prev + `\n📋 Available tables: ${JSON.stringify(tables)}`)
        }
      } catch (schemaErr) {
        setResult(prev => prev + `\n⚠️ Schema check failed: ${schemaErr}`)
      }

      // Test 4: Try different table names
      const tablesToTry = ['personal_contacts', 'contacts', 'users', 'profiles']

      for (const tableName of tablesToTry) {
        setResult(prev => prev + `\n🔍 Testing table: ${tableName}`)

        try {
          const { data, error, count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact' })
            .limit(1)

          if (error) {
            setResult(prev => prev + `\n❌ ${tableName}: ${error.message}`)
          } else {
            setResult(prev => prev + `\n✅ ${tableName}: Found ${count} records`)
            if (data && data.length > 0) {
              setResult(prev => prev + `\n📝 ${tableName} columns: ${Object.keys(data[0]).join(', ')}`)
              setResult(prev => prev + `\n📄 Sample: ${JSON.stringify(data[0], null, 2)}`)
            }
            break // Found working table
          }
        } catch (tableErr: any) {
          setResult(prev => prev + `\n❌ ${tableName} exception: ${tableErr.message}`)
        }
      }

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
        <details className="mt-2">
          <summary className="cursor-pointer text-sm text-blue-600">Show Full Key (Debug)</summary>
          <div className="mt-2 p-2 bg-gray-200 text-xs font-mono break-all">
            {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'NOT SET'}
          </div>
        </details>
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