'use client'

import { useState } from 'react'

export default function TestCleanPage() {
  const [result, setResult] = useState<string>('Click the button to test Supabase')

  const testSupabase = async () => {
    try {
      setResult('🚀 Testing Supabase...')
      console.log('🚀 Testing Supabase...')

      // Dynamic import to avoid any build-time issues
      const { supabase } = await import('@/lib/supabase')

      const { data, error } = await supabase
        .from('personal_contacts')
        .select('id, first_name, last_name')
        .limit(5)

      if (error) {
        console.error('❌ Error:', error)
        setResult(`❌ Error: ${error.message}`)
        return
      }

      console.log('✅ Success:', data)
      setResult(`✅ Success! Loaded ${data?.length || 0} contacts:\n${JSON.stringify(data, null, 2)}`)
    } catch (err: any) {
      console.error('❌ Exception:', err)
      setResult(`❌ Exception: ${err.message}`)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">🧪 Ultra Clean Test</h1>
      <button
        onClick={testSupabase}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        Test Supabase Connection
      </button>
      <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
        {result}
      </pre>
    </div>
  )
}