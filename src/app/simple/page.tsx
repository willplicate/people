'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Contact {
  id: string
  first_name: string
  last_name?: string
  email?: string
  phone?: string
  created_at: string
}

export default function SimpleCRMPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newContact, setNewContact] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: ''
  })

  const fetchContacts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('personal_contacts')
        .select('id, first_name, last_name, email, phone, created_at')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setContacts(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addContact = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newContact.first_name.trim()) {
      alert('First name is required')
      return
    }

    try {
      const { data, error } = await supabase
        .from('personal_contacts')
        .insert([{
          first_name: newContact.first_name.trim(),
          last_name: newContact.last_name.trim() || null,
          email: newContact.email.trim() || null,
          phone: newContact.phone.trim() || null
        }])
        .select()
        .single()

      if (error) throw error

      setContacts(prev => [data, ...prev])
      setNewContact({ first_name: '', last_name: '', email: '', phone: '' })
      alert('Contact added successfully!')
    } catch (err: any) {
      alert('Error adding contact: ' + err.message)
    }
  }

  useEffect(() => {
    fetchContacts()
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          📱 Simple Personal CRM
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <h2 className="font-semibold text-green-800 mb-2">✅ Working Features</h2>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Direct Supabase connection</li>
              <li>• Client-side data fetching</li>
              <li>• Add new contacts</li>
              <li>• View contact list</li>
              <li>• Mobile-friendly design</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <h2 className="font-semibold text-blue-800 mb-2">📋 Quick Stats</h2>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Total contacts: {contacts.length}</li>
              <li>• Status: {error ? '❌ Error' : loading ? '⏳ Loading' : '✅ Connected'}</li>
              <li>• Database: Supabase</li>
              <li>• Hosting: Netlify</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Add Contact Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">➕ Add New Contact</h2>
        <form onSubmit={addContact} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="First Name *"
            value={newContact.first_name}
            onChange={(e) => setNewContact(prev => ({ ...prev, first_name: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <input
            type="text"
            placeholder="Last Name"
            value={newContact.last_name}
            onChange={(e) => setNewContact(prev => ({ ...prev, last_name: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="email"
            placeholder="Email"
            value={newContact.email}
            onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="tel"
            placeholder="Phone"
            value={newContact.phone}
            onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              Add Contact
            </button>
          </div>
        </form>
      </div>

      {/* Contacts List */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">👥 Your Contacts</h2>

        {loading && (
          <div className="text-center py-8">
            <p className="text-gray-600">⏳ Loading contacts...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
            <p className="text-red-700">❌ Error: {error}</p>
            <button
              onClick={fetchContacts}
              className="mt-2 text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && contacts.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600">No contacts yet. Add your first contact above!</p>
          </div>
        )}

        {!loading && !error && contacts.length > 0 && (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <div key={contact.id} className="border border-gray-200 rounded p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {contact.first_name} {contact.last_name}
                    </h3>
                    {contact.email && (
                      <p className="text-sm text-blue-600">📧 {contact.email}</p>
                    )}
                    {contact.phone && (
                      <p className="text-sm text-green-600">📞 {contact.phone}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(contact.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          This is a simplified version that works without API routes.
        </p>
        <Link
          href="/health"
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Health Check →
        </Link>
      </div>
    </div>
  )
}