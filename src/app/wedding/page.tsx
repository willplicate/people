'use client'

import { useState, useEffect } from 'react'
import { WeddingGuestService, WeddingGuest } from '@/services/WeddingGuestService'
import { WeddingInviteService, WeddingInvite } from '@/services/WeddingInviteService'

export default function WeddingPage() {
  const [activeTab, setActiveTab] = useState<'rsvps' | 'invites'>('invites')

  // RSVP state
  const [guests, setGuests] = useState<WeddingGuest[]>([])
  const [guestStats, setGuestStats] = useState({
    total: 0,
    attending: 0,
    notAttending: 0,
    pending: 0,
    maybe: 0,
    totalGuests: 0
  })

  // Invite state
  const [invites, setInvites] = useState<WeddingInvite[]>([])
  const [inviteStats, setInviteStats] = useState({
    totalInvites: 0,
    byCategory: {} as Record<string, number>,
    byStatus: {} as Record<string, number>,
    averageLikeliness: 0
  })

  const [loading, setLoading] = useState(true)
  const [guestFilter, setGuestFilter] = useState<'all' | 'pending' | 'attending' | 'not_attending' | 'maybe'>('all')
  const [inviteFilter, setInviteFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddInviteForm, setShowAddInviteForm] = useState(false)
  const [newInvite, setNewInvite] = useState({
    name: '',
    address: '',
    category: '',
    likeliness_to_come: 3,
    invite_status: 'Not contacted' as const,
    notes: ''
  })

  useEffect(() => {
    if (activeTab === 'rsvps') {
      loadGuestData()
    } else {
      loadInviteData()
    }
  }, [activeTab, guestFilter, inviteFilter, searchQuery])

  const loadGuestData = async () => {
    try {
      setLoading(true)
      const [guestsData, statsData] = await Promise.all([
        WeddingGuestService.getAll({
          rsvpStatus: guestFilter === 'all' ? undefined : guestFilter,
          search: searchQuery || undefined
        }),
        WeddingGuestService.getStats()
      ])
      setGuests(guestsData)
      setGuestStats(statsData)
    } catch (error) {
      console.error('Failed to load wedding guest data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadInviteData = async () => {
    try {
      setLoading(true)
      const [invitesData, statsData] = await Promise.all([
        WeddingInviteService.getAll({
          inviteStatus: inviteFilter === 'all' ? undefined : inviteFilter,
          search: searchQuery || undefined
        }),
        WeddingInviteService.getStats()
      ])
      setInvites(invitesData)
      setInviteStats(statsData)
    } catch (error) {
      console.error('Failed to load wedding invite data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGuestStatusUpdate = async (guestId: string, newStatus: 'pending' | 'attending' | 'not_attending' | 'maybe') => {
    try {
      await WeddingGuestService.update(guestId, { rsvp_status: newStatus })
      loadGuestData()
    } catch (error) {
      console.error('Failed to update guest status:', error)
    }
  }

  const handleInviteStatusUpdate = async (inviteId: string, newStatus: WeddingInvite['invite_status']) => {
    try {
      await WeddingInviteService.update(inviteId, { invite_status: newStatus })
      loadInviteData()
    } catch (error) {
      console.error('Failed to update invite status:', error)
    }
  }

  const handleDeleteGuest = async (guestId: string) => {
    if (!confirm('Are you sure you want to delete this RSVP?')) return
    try {
      await WeddingGuestService.delete(guestId)
      loadGuestData()
    } catch (error) {
      console.error('Failed to delete guest:', error)
    }
  }

  const handleDeleteInvite = async (inviteId: string) => {
    if (!confirm('Are you sure you want to delete this invite?')) return
    try {
      await WeddingInviteService.delete(inviteId)
      loadInviteData()
    } catch (error) {
      console.error('Failed to delete invite:', error)
    }
  }

  const handleAddInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newInvite.name.trim()) {
      alert('Name is required')
      return
    }

    try {
      await WeddingInviteService.create({
        name: newInvite.name,
        address: newInvite.address || undefined,
        category: newInvite.category || undefined,
        likeliness_to_come: newInvite.likeliness_to_come,
        invite_status: newInvite.invite_status,
        notes: newInvite.notes || undefined
      })

      // Reset form
      setNewInvite({
        name: '',
        address: '',
        category: '',
        likeliness_to_come: 3,
        invite_status: 'Not contacted',
        notes: ''
      })
      setShowAddInviteForm(false)
      loadInviteData()
    } catch (error) {
      console.error('Failed to add invite:', error)
      alert('Failed to add invite. Please try again.')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'attending':
      case 'Confirmed attending':
        return 'bg-green-100 text-green-800'
      case 'not_attending':
      case 'Confirmed not attending':
        return 'bg-red-100 text-red-800'
      case 'maybe': return 'bg-yellow-100 text-yellow-800'
      case 'Contacted - awaiting response': return 'bg-blue-100 text-blue-800'
      case 'Not contacted': return 'bg-gray-100 text-gray-800'
      case 'No response': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Wedding Management</h1>
        <p className="text-gray-600 mt-2">Track invites and RSVPs for your wedding</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('invites')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'invites'
                ? 'border-tertiary text-tertiary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Guest List ({inviteStats.totalInvites})
          </button>
          <button
            onClick={() => setActiveTab('rsvps')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'rsvps'
                ? 'border-tertiary text-tertiary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            RSVPs ({guestStats.total})
          </button>
        </nav>
      </div>

      {/* RSVP Tab Content */}
      {activeTab === 'rsvps' && (
        <>
          {/* RSVP Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-gray-900">{guestStats.total}</div>
              <div className="text-sm text-gray-600">Total RSVPs</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-green-800">{guestStats.attending}</div>
              <div className="text-sm text-green-600">Attending</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-red-800">{guestStats.notAttending}</div>
              <div className="text-sm text-red-600">Not Attending</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-yellow-800">{guestStats.maybe}</div>
              <div className="text-sm text-yellow-600">Maybe</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-gray-800">{guestStats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-blue-800">{guestStats.totalGuests}</div>
              <div className="text-sm text-blue-600">Total Guests</div>
            </div>
          </div>

          {/* RSVP Filters */}
          <div className="bg-white p-4 rounded-lg shadow space-y-4">
            <div className="flex flex-wrap gap-2">
              {(['all', 'pending', 'attending', 'not_attending', 'maybe'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setGuestFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    guestFilter === status
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

          {/* RSVP Guest List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {guests.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No RSVPs found</div>
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
                          {guest.number_of_guests > 1 && <div>👥 {guest.number_of_guests} guests</div>}
                          {guest.plus_one_name && <div>➕ Plus one: {guest.plus_one_name}</div>}
                          {guest.dietary_restrictions && <div>🍽️ Dietary: {guest.dietary_restrictions}</div>}
                          {guest.message && (
                            <div className="mt-2 p-2 bg-gray-50 rounded italic">"{guest.message}"</div>
                          )}
                          <div className="text-xs text-gray-400">
                            RSVP'd: {guest.rsvp_date ? new Date(guest.rsvp_date).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col space-y-2">
                        <select
                          value={guest.rsvp_status}
                          onChange={(e) => handleGuestStatusUpdate(guest.id, e.target.value as any)}
                          className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-tertiary"
                        >
                          <option value="pending">Pending</option>
                          <option value="attending">Attending</option>
                          <option value="not_attending">Not Attending</option>
                          <option value="maybe">Maybe</option>
                        </select>
                        <button
                          onClick={() => handleDeleteGuest(guest.id)}
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
        </>
      )}

      {/* Invite Tab Content */}
      {activeTab === 'invites' && (
        <>
          {/* Invite Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-gray-900">{inviteStats.totalInvites}</div>
              <div className="text-sm text-gray-600">Total to Invite</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-blue-800">{inviteStats.byStatus['Contacted - awaiting response'] || 0}</div>
              <div className="text-sm text-blue-600">Contacted</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-green-800">{inviteStats.byStatus['Confirmed attending'] || 0}</div>
              <div className="text-sm text-green-600">Confirmed</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-gray-800">{inviteStats.byStatus['Not contacted'] || 0}</div>
              <div className="text-sm text-gray-600">Not Contacted</div>
            </div>
          </div>

          {/* Category Breakdown */}
          {Object.keys(inviteStats.byCategory).length > 0 && (
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold mb-3">By Category</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(inviteStats.byCategory).map(([category, count]) => (
                  <div key={category} className="bg-gray-100 px-3 py-2 rounded">
                    <span className="font-medium">{category}:</span> <span className="text-gray-600">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Invite Button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddInviteForm(!showAddInviteForm)}
              className="px-4 py-2 bg-tertiary text-white rounded-lg hover:bg-tertiary/90 transition-colors"
            >
              {showAddInviteForm ? 'Cancel' : '+ Add Guest'}
            </button>
          </div>

          {/* Add Invite Form */}
          {showAddInviteForm && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Add New Guest</h3>
              <form onSubmit={handleAddInvite} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={newInvite.name}
                      onChange={(e) => setNewInvite({ ...newInvite, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tertiary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      value={newInvite.address}
                      onChange={(e) => setNewInvite({ ...newInvite, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tertiary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={newInvite.category}
                      onChange={(e) => setNewInvite({ ...newInvite, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tertiary"
                    >
                      <option value="">Select category</option>
                      <option value="ES Friends">ES Friends</option>
                      <option value="Family">Family</option>
                      <option value="MEX Friends">MEX Friends</option>
                      <option value="UK Friends">UK Friends</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Likeliness to Come (0-5)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      value={newInvite.likeliness_to_come}
                      onChange={(e) => setNewInvite({ ...newInvite, likeliness_to_come: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tertiary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={newInvite.invite_status}
                      onChange={(e) => setNewInvite({ ...newInvite, invite_status: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tertiary"
                    >
                      <option value="Not contacted">Not contacted</option>
                      <option value="Contacted - awaiting response">Contacted - awaiting response</option>
                      <option value="Confirmed attending">Confirmed attending</option>
                      <option value="Confirmed not attending">Confirmed not attending</option>
                      <option value="No response">No response</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <input
                      type="text"
                      value={newInvite.notes}
                      onChange={(e) => setNewInvite({ ...newInvite, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tertiary"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddInviteForm(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-tertiary text-white rounded-lg hover:bg-tertiary/90"
                  >
                    Add Guest
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Invite Filters */}
          <div className="bg-white p-4 rounded-lg shadow space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setInviteFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  inviteFilter === 'all'
                    ? 'bg-tertiary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {['Not contacted', 'Contacted - awaiting response', 'Confirmed attending', 'Confirmed not attending', 'No response'].map((status) => (
                <button
                  key={status}
                  onClick={() => setInviteFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    inviteFilter === status
                      ? 'bg-tertiary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Search invites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tertiary"
            />
          </div>

          {/* Invite List Table */}
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            {invites.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No invites found</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Likeliness</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invites.map((invite) => (
                    <tr key={invite.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{invite.name}</div>
                        {invite.address && <div className="text-sm text-gray-500">{invite.address}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-800">
                          {invite.category || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {invite.likeliness_to_come !== null ? (
                          <span className="text-lg font-bold">{invite.likeliness_to_come}/5</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={invite.invite_status}
                          onChange={(e) => handleInviteStatusUpdate(invite.id, e.target.value as any)}
                          className={`text-sm border-0 rounded px-2 py-1 font-medium focus:outline-none focus:ring-2 focus:ring-tertiary ${getStatusColor(invite.invite_status)}`}
                        >
                          <option value="Not contacted">Not contacted</option>
                          <option value="Contacted - awaiting response">Contacted - awaiting response</option>
                          <option value="Confirmed attending">Confirmed attending</option>
                          <option value="Confirmed not attending">Confirmed not attending</option>
                          <option value="No response">No response</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs truncate">{invite.notes || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => handleDeleteInvite(invite.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* RSVP Site Link */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900">Public RSVP Website</h3>
            <p className="text-sm text-blue-700 mt-1">Share this link with your guests</p>
            <p className="text-sm text-blue-900 mt-2 font-mono bg-blue-100 px-2 py-1 rounded inline-block select-all">
              https://allyouneedisalightjacket.com
            </p>
          </div>
          <a
            href="https://allyouneedisalightjacket.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap ml-4"
          >
            View Site
          </a>
        </div>
      </div>
    </div>
  )
}