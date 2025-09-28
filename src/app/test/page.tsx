'use client'

import { useState } from 'react'
import { testSupabaseConnection, testAllTables } from '@/lib/test-connection'

export default function TestPage() {
  const [connectionStatus, setConnectionStatus] = useState<string>('Not tested')
  const [tableResults, setTableResults] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleTestConnection = async () => {
    setIsLoading(true)
    setConnectionStatus('Testing...')
    
    const success = await testSupabaseConnection()
    setConnectionStatus(success ? '✅ Connected' : '❌ Failed')
    
    const results = await testAllTables()
    setTableResults(results)
    
    setIsLoading(false)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Supabase Connection Test</h1>
      
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          <p className="mb-4">Status: <span className="font-mono">{connectionStatus}</span></p>
          
          <button
            onClick={handleTestConnection}
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-4 py-2 rounded"
          >
            {isLoading ? 'Testing...' : 'Test Connection'}
          </button>
        </div>

        {Object.keys(tableResults).length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Table Access Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(tableResults).map(([table, success]) => (
                <div key={table} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="font-mono text-sm">{table}</span>
                  <span className={success ? 'text-green-600' : 'text-red-600'}>
                    {success ? '✅' : '❌'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Environment Check</h2>
          <div className="space-y-2 font-mono text-sm">
            <p>
              <span className="font-semibold">Supabase URL:</span>{' '}
              {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}
            </p>
            <p>
              <span className="font-semibold">Supabase Anon Key:</span>{' '}
              {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}