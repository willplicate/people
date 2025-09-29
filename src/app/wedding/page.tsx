'use client'

import { useState, useEffect } from 'react'
import { WeddingGuestService, WeddingGuest } from '@/services/WeddingGuestService'

export default function WeddingPage() {
  const [guests, setGuests] = useState<WeddingGuest[]>([])
  const [stats, setStats] = useState({
    total: 0,
    attending: 0,
    notAttending: 0,
    pending: 0,
    maybe: 0,
    totalGuests: 0
  })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'attending' | 'not_attending' | 'maybe'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadData()
  }, [filter, searchQuery])

  const loadData = async () => {
    try {
      setLoading(true)
      const [guestsData, statsData] = await Promise.all([
        WeddingGuestService.getAll({
          rsvpStatus: filter === 'all' ? undefined : filter,
          search: searchQuery || undefined
        }),
        WeddingGuestService.getStats()
      ])
      setGuests(guestsData)
      setStats(statsData)
    } catch (error) {
      console.error('Failed to load wedding data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (guestId: string, newStatus: 'pending' | 'attending' | 'not_attending' | 'maybe') => {
    try {
      await WeddingGuestService.update(guestId, { rsvp_status: newStatus })
      loadData()
    } catch (error) {
      console.error('Failed to update guest status:', error)
    }
  }

  const handleDelete = async (guestId: string) => {
    if (!confirm('Are you sure you want to delete this RSVP?')) return

    try {
      await WeddingGuestService.delete(guestId)
      loadData()
    } catch (error) {
      console.error('Failed to delete guest:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'attending': return 'bg-green-100 text-green-800'
      case 'not_attending': return 'bg-red-100 text-red-800'
      case 'maybe': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading wedding RSVPs...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Wedding RSVPs</h1>
        <p className="text-gray-600 mt-2">Track guest responses for your wedding</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total RSVPs</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-800">{stats.attending}</div>
          <div className="text-sm text-green-600">Attending</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-red-800">{stats.notAttending}</div>
          <div className="text-sm text-red-600">Not Attending</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-800">{stats.maybe}</div>
          <div className="text-sm text-yellow-600">Maybe</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-800">{stats.pending}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-800">{stats.totalGuests}</div>
          <div className="text-sm text-blue-600">Total Guests</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="flex flex-wrap gap-2">
          {(['all', 'pending', 'attending', 'not_attending', 'maybe'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-tertiary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search guests..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tertiary"
        />
      </div>

      {/* Guest List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {guests.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No RSVPs found
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {guests.map((guest) => (
              <div key={guest.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">{guest.guest_name}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(guest.rsvp_status)}`}>
                        {guest.rsvp_status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      {guest.email && <div>📧 {guest.email}</div>}
                      {guest.phone && <div>📱 {guest.phone}</div>}
                      {guest.number_of_guests > 1 && (
                        <div>👥 {guest.number_of_guests} guests</div>
                      )}
                      {guest.plus_one_name && (
                        <div>➕ Plus one: {guest.plus_one_name}</div>
                      )}
                      {guest.dietary_restrictions && (
                        <div>🍽️ Dietary: {guest.dietary_restrictions}</div>
                      )}
                      {guest.message && (
                        <div className="mt-2 p-2 bg-gray-50 rounded italic">
                          "{guest.message}"
                        </div>
                      )}
                      <div className="text-xs text-gray-400">
                        RSVP'd: {guest.rsvp_date ? new Date(guest.rsvp_date).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="ml-4 flex flex-col space-y-2">
                    <select
                      value={guest.rsvp_status}
                      onChange={(e) => handleStatusUpdate(guest.id, e.target.value as any)}
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-tertiary"
                    >
                      <option value="pending">Pending</option>
                      <option value="attending">Attending</option>
                      <option value="not_attending">Not Attending</option>
                      <option value="maybe">Maybe</option>
                    </select>
                    <button
                      onClick={() => handleDelete(guest.id)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RSVP Site Link */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-blue-900">Public RSVP Website</h3>
            <p className="text-sm text-blue-700 mt-1">Share this link with your guests</p>
          </div>
          <a
            href="https://allyouneedisalightjacket.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Site
          </a>
        </div>
      </div>
    </div>
  )
}