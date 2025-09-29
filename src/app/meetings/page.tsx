'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { MeetingAgenda, CreateMeetingAgendaInput } from '@/types/database'
import { MeetingAgendaService } from '@/services/MeetingAgendaService'
import { PersonalTaskService } from '@/services/PersonalTaskService'

interface MeetingsPageData {
  meetings: MeetingAgenda[]
  totalCount: number
}

export default function MeetingsPage() {
  const [data, setData] = useState<MeetingsPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [selectedAttendee, setSelectedAttendee] = useState<string | null>(null)
  const [allAttendees, setAllAttendees] = useState<string[]>([])
  const [showNewMeetingForm, setShowNewMeetingForm] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState<MeetingAgenda | null>(null)
  const [showQuickTaskForm, setShowQuickTaskForm] = useState(false)

  const [newMeeting, setNewMeeting] = useState<CreateMeetingAgendaInput>({
    title: '',
    attendees: [],
    meeting_date: '',
    agenda: '',
    notes: '',
    fireflies_link: '',
    tags: []
  })

  const [quickTask, setQuickTask] = useState<{
    title: string
    description: string
    priority: 'medium'
    category: 'work' | 'personal'
  }>({
    title: '',
    description: '',
    priority: 'medium',
    category: 'work'
  })

  const [attendeeInput, setAttendeeInput] = useState('')

  // Debounce search query to avoid triggering search on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300) // 300ms delay

    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchMeetings = useCallback(async () => {
    try {
      setLoading(true)

      // Fetch all meetings first
      const allMeetings = await MeetingAgendaService.getAll()

      // Extract unique attendees from all meetings
      const attendeesSet = new Set<string>()
      allMeetings.forEach(meeting => {
        meeting.attendees.forEach(attendee => {
          if (attendee.trim()) {
            attendeesSet.add(attendee.trim())
          }
        })
      })
      setAllAttendees(Array.from(attendeesSet).sort())

      // Filter meetings based on search and selected attendee
      let filteredMeetings = allMeetings

      // Filter by text search
      if (debouncedSearchQuery) {
        const searchLower = debouncedSearchQuery.toLowerCase()
        filteredMeetings = filteredMeetings.filter(meeting =>
          meeting.title.toLowerCase().includes(searchLower) ||
          meeting.agenda?.toLowerCase().includes(searchLower) ||
          meeting.notes?.toLowerCase().includes(searchLower) ||
          meeting.attendees.some(attendee =>
            attendee.toLowerCase().includes(searchLower)
          )
        )
      }

      // Filter by selected attendee
      if (selectedAttendee) {
        filteredMeetings = filteredMeetings.filter(meeting =>
          meeting.attendees.includes(selectedAttendee)
        )
      }

      setData({
        meetings: filteredMeetings,
        totalCount: filteredMeetings.length
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch meetings')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearchQuery, selectedAttendee])

  useEffect(() => {
    fetchMeetings()
  }, [fetchMeetings])

  const handleCreateMeeting = async () => {
    try {
      await MeetingAgendaService.create({
        ...newMeeting,
        meeting_date: newMeeting.meeting_date || undefined
      })

      setNewMeeting({
        title: '',
        attendees: [],
        meeting_date: '',
        agenda: '',
        notes: '',
        fireflies_link: '',
        tags: []
      })
      setAttendeeInput('')
      setShowNewMeetingForm(false)
      fetchMeetings()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create meeting')
    }
  }

  const handleUpdateMeeting = async () => {
    if (!editingMeeting) return

    try {
      await MeetingAgendaService.update(editingMeeting.id, {
        title: editingMeeting.title,
        attendees: editingMeeting.attendees,
        meeting_date: editingMeeting.meeting_date || undefined,
        agenda: editingMeeting.agenda,
        notes: editingMeeting.notes,
        fireflies_link: editingMeeting.fireflies_link,
        tags: editingMeeting.tags
      })

      setEditingMeeting(null)
      fetchMeetings()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update meeting')
    }
  }

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!confirm('Are you sure you want to delete this meeting?')) return

    try {
      await MeetingAgendaService.delete(meetingId)
      fetchMeetings()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete meeting')
    }
  }

  const handleEditMeeting = (meeting: MeetingAgenda) => {
    setEditingMeeting(meeting)
    setShowNewMeetingForm(false)
    // Scroll to top to show the edit form
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 100)
  }

  const handleCancelEdit = () => {
    setEditingMeeting(null)
  }

  const addAttendee = () => {
    if (attendeeInput.trim() && !newMeeting.attendees.includes(attendeeInput.trim())) {
      setNewMeeting(prev => ({
        ...prev,
        attendees: [...prev.attendees, attendeeInput.trim()]
      }))
      setAttendeeInput('')
    }
  }

  const removeAttendee = (attendee: string) => {
    setNewMeeting(prev => ({
      ...prev,
      attendees: prev.attendees.filter(a => a !== attendee)
    }))
  }

  const handleCreateQuickTask = async () => {
    try {
      await PersonalTaskService.create(quickTask)

      setQuickTask({
        title: '',
        description: '',
        priority: 'medium',
        category: 'work'
      })
      setShowQuickTaskForm(false)
      // Show success message or notification
      alert('Task created successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4">
        <div className="animate-pulse space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-destructive p-4 bg-destructive/10 rounded-lg">
          Error: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Meeting Agendas & Notes</h1>
          <p className="mt-2 text-muted-foreground">Prepare for meetings and keep track of notes</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowQuickTaskForm(true)}
            className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary/80"
          >
            Quick Task
          </button>
          <button
            onClick={() => setShowNewMeetingForm(true)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/80"
          >
            New Meeting
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search meetings by title, attendees, agenda, or notes..."
          className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
        />
      </div>

      {/* Attendee Filter Cards */}
      {allAttendees.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-foreground">Filter by Attendee:</h3>
            {selectedAttendee && (
              <button
                onClick={() => setSelectedAttendee(null)}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Clear filter
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {allAttendees.map((attendee) => {
              const isSelected = selectedAttendee === attendee
              // Count meetings with this attendee, considering current text search
              let meetingCount = 0
              if (data?.meetings) {
                if (isSelected) {
                  // If this attendee is selected, show current filtered count
                  meetingCount = data.meetings.length
                } else {
                  // If not selected, count how many meetings this attendee would show
                  // (considering text search but ignoring attendee filter)
                  meetingCount = data.meetings.filter(m => {
                    // Include if no attendee filter is active, or if we're counting for this specific attendee
                    return !selectedAttendee && m.attendees.includes(attendee)
                  }).length

                  // If we have a text search active, we need to get the count from unfiltered data
                  if (debouncedSearchQuery && !selectedAttendee) {
                    // This is a simplification - we show the visible count
                    meetingCount = data.meetings.filter(m => m.attendees.includes(attendee)).length
                  }
                }
              }

              return (
                <button
                  key={attendee}
                  onClick={() => setSelectedAttendee(isSelected ? null : attendee)}
                  className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-secondary/20 text-secondary-foreground hover:bg-secondary/30 border border-secondary/40'
                  }`}
                >
                  <span className="mr-1">👤</span>
                  {attendee}
                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                    isSelected
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-secondary/40 text-secondary-foreground'
                  }`}>
                    {meetingCount}
                  </span>
                </button>
              )
            })}
          </div>
          {selectedAttendee && (
            <div className="mt-2 text-xs text-muted-foreground">
              Showing {data?.meetings.length || 0} meeting{(data?.meetings.length || 0) !== 1 ? 's' : ''} with <strong>{selectedAttendee}</strong>
            </div>
          )}
        </div>
      )}

      {/* Quick Task Form */}
      {showQuickTaskForm && (
        <div className="bg-card p-6 rounded-lg border border-border mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Quick Task</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <input
                type="text"
                value={quickTask.title}
                onChange={(e) => setQuickTask(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Task title..."
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              />
            </div>
            <div>
              <select
                value={quickTask.priority}
                onChange={(e) => setQuickTask(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <select
                value={quickTask.category}
                onChange={(e) => setQuickTask(prev => ({ ...prev, category: e.target.value as 'work' | 'personal' }))}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              >
                <option value="work">Work</option>
                <option value="personal">Personal</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={() => setShowQuickTaskForm(false)}
              className="px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateQuickTask}
              disabled={!quickTask.title.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 disabled:opacity-50"
            >
              Create Task
            </button>
          </div>
        </div>
      )}

      {/* New Meeting Form */}
      {showNewMeetingForm && (
        <div className="bg-card p-6 rounded-lg border border-border mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">New Meeting</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Meeting Title</label>
              <input
                type="text"
                value={newMeeting.title}
                onChange={(e) => setNewMeeting(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Weekly Team Standup"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Attendees</label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={attendeeInput}
                  onChange={(e) => setAttendeeInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addAttendee()}
                  placeholder="Add attendee name..."
                  className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                />
                <button
                  onClick={addAttendee}
                  className="px-3 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {newMeeting.attendees.map((attendee, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 bg-primary/10 text-primary rounded-full text-sm"
                  >
                    {attendee}
                    <button
                      onClick={() => removeAttendee(attendee)}
                      className="ml-1 text-primary hover:text-primary/80"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Meeting Date</label>
              <input
                type="datetime-local"
                value={newMeeting.meeting_date}
                onChange={(e) => setNewMeeting(prev => ({ ...prev, meeting_date: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Agenda (Pre-meeting)</label>
              <textarea
                value={newMeeting.agenda || ''}
                onChange={(e) => setNewMeeting(prev => ({ ...prev, agenda: e.target.value }))}
                placeholder="• Bullet point agenda items..."
                rows={4}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Notes</label>
              <textarea
                value={newMeeting.notes || ''}
                onChange={(e) => setNewMeeting(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Meeting notes..."
                rows={4}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Fireflies Link (Optional)</label>
              <input
                type="url"
                value={newMeeting.fireflies_link || ''}
                onChange={(e) => setNewMeeting(prev => ({ ...prev, fireflies_link: e.target.value }))}
                placeholder="https://fireflies.ai/..."
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowNewMeetingForm(false)}
              className="px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateMeeting}
              disabled={!newMeeting.title.trim() || newMeeting.attendees.length === 0}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 disabled:opacity-50"
            >
              Create Meeting
            </button>
          </div>
        </div>
      )}

      {/* Edit Meeting Form */}
      {editingMeeting && (
        <div className="bg-card p-6 rounded-lg border-2 border-primary/30 shadow-lg mb-6 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              ✏️ Editing: {editingMeeting.title}
            </h3>
            <button
              onClick={handleCancelEdit}
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              ✕ Close
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Meeting Title</label>
              <input
                type="text"
                value={editingMeeting.title}
                onChange={(e) => setEditingMeeting(prev => prev ? ({ ...prev, title: e.target.value }) : null)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Meeting Date</label>
              <input
                type="datetime-local"
                value={editingMeeting.meeting_date ? new Date(editingMeeting.meeting_date).toISOString().slice(0, 16) : ''}
                onChange={(e) => setEditingMeeting(prev => prev ? ({ ...prev, meeting_date: e.target.value }) : null)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Agenda</label>
              <textarea
                value={editingMeeting.agenda || ''}
                onChange={(e) => setEditingMeeting(prev => prev ? ({ ...prev, agenda: e.target.value }) : null)}
                rows={4}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Notes</label>
              <textarea
                value={editingMeeting.notes || ''}
                onChange={(e) => setEditingMeeting(prev => prev ? ({ ...prev, notes: e.target.value }) : null)}
                rows={4}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Fireflies Link</label>
              <input
                type="url"
                value={editingMeeting.fireflies_link || ''}
                onChange={(e) => setEditingMeeting(prev => prev ? ({ ...prev, fireflies_link: e.target.value }) : null)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateMeeting}
              disabled={!editingMeeting.title.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 disabled:opacity-50"
            >
              Update Meeting
            </button>
          </div>
        </div>
      )}

      {/* Meetings List */}
      <div className="space-y-4">
        {data?.meetings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {debouncedSearchQuery || selectedAttendee
              ? `No meetings found ${debouncedSearchQuery ? 'matching your search' : ''}${
                  debouncedSearchQuery && selectedAttendee ? ' and ' : ''
                }${selectedAttendee ? `with ${selectedAttendee}` : ''}.`
              : 'No meetings yet. Create your first meeting!'}
          </div>
        ) : (
          data?.meetings.map((meeting) => (
            <div
              key={meeting.id}
              className="p-6 border rounded-lg bg-card hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group"
              onClick={() => handleEditMeeting(meeting)}
              title="Click to edit this meeting"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                    {meeting.title}
                    <span className="ml-2 text-xs text-muted-foreground group-hover:text-primary/70">✏️ Click to edit</span>
                  </h3>
                  {meeting.meeting_date && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDateTime(meeting.meeting_date)}
                    </p>
                  )}
                  {meeting.attendees.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="text-sm text-muted-foreground">Attendees:</span>
                      {meeting.attendees.map((attendee, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 bg-secondary/20 text-secondary-foreground rounded text-xs"
                        >
                          {attendee}
                        </span>
                      ))}
                    </div>
                  )}

                  {meeting.agenda && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-foreground">Agenda:</h4>
                      <div className="text-sm text-muted-foreground whitespace-pre-line mt-1">
                        {meeting.agenda.length > 200
                          ? `${meeting.agenda.substring(0, 200)}...`
                          : meeting.agenda}
                      </div>
                    </div>
                  )}

                  {meeting.notes && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-foreground">Notes:</h4>
                      <div className="text-sm text-muted-foreground whitespace-pre-line mt-1">
                        {meeting.notes.length > 200
                          ? `${meeting.notes.substring(0, 200)}...`
                          : meeting.notes}
                      </div>
                    </div>
                  )}

                  {meeting.fireflies_link && (
                    <div className="mt-3">
                      <a
                        href={meeting.fireflies_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-primary hover:text-primary/80 text-sm underline"
                      >
                        View Fireflies Recording →
                      </a>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground mt-3">
                    Created: {formatDateTime(meeting.created_at)}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteMeeting(meeting.id)
                  }}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}