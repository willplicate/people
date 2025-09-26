'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function StaticTestPage() {
  const [contacts, setContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const testSupabaseConnection = async () => {
      try {
        setLoading(true)

        // Test direct Supabase connection
        const { data, error } = await supabase
          .from('personal_contacts')
          .select('id, first_name, last_name')
          .limit(5)

        if (error) {
          throw error
        }

        setContacts(data || [])
        setError(null)
      } catch (err: any) {
        setError(err.message || 'Failed to connect to database')
        console.error('Supabase connection error:', err)
      } finally {
        setLoading(false)
      }
    }

    testSupabaseConnection()
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          🧪 Static Export Test - Direct Supabase Connection
        </h1>

        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <h2 className="font-semibold text-blue-800">Test Status</h2>
            <p className="text-blue-700 mt-1">
              This page tests if we can connect directly to Supabase from a static site (no API routes)
            </p>
          </div>

          {loading && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded">
              <p className="text-gray-600">⏳ Testing Supabase connection...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded">
              <h3 className="font-semibold text-red-800">❌ Connection Failed</h3>
              <p className="text-red-700 mt-1">{error}</p>
              <p className="text-sm text-red-600 mt-2">
                This might be due to:
                <br />• Missing environment variables
                <br />• CORS settings in Supabase
                <br />• Network/DNS issues
              </p>
            </div>
          )}

          {!loading && !error && (
            <div className="p-4 bg-green-50 border border-green-200 rounded">
              <h3 className="font-semibold text-green-800">✅ Connection Successful!</h3>
              <p className="text-green-700 mt-1">
                Found {contacts.length} contacts in database
              </p>
              {contacts.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-green-800 mb-2">Sample contacts:</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    {contacts.map((contact) => (
                      <li key={contact.id}>
                        • {contact.first_name} {contact.last_name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded">
            <h3 className="font-semibold text-gray-800 mb-2">Environment Info</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
              <p><strong>Supabase Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</p>
              <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <a
            href="/"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}