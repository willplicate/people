'use client'

import { useState, useEffect } from 'react'
import { Meeting } from '@/types/database'
import { MeetingService } from '@/services/MeetingService'
import { ChevronDownIcon, ChevronRightIcon, CalendarDaysIcon } from '@heroicons/react/24/outline'

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    MeetingService.getAll({ limit: 100 })
      .then(setMeetings)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const toggle = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    })

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  const hasRealNotes = (notes?: string) =>
    !!(notes && !notes.startsWith('Granola meeting ID:') && notes.trim().length > 10)

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        Loading meetings...
      </div>
    )
  }

  if (meetings.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500">
        <CalendarDaysIcon className="h-12 w-12 mb-4" />
        <p className="text-lg font-medium">No meetings yet</p>
        <p className="text-sm">Meetings synced from Granola will appear here</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <div className="px-4 py-3 border-b border-gray-200 bg-white flex-shrink-0">
        <p className="text-xs text-gray-500">{meetings.length} meetings</p>
      </div>

      <div className="divide-y divide-gray-100">
        {meetings.map((meeting) => {
          const isExpanded = expandedIds.has(meeting.id)
          const notes = meeting.notes || meeting.content || meeting.transcript || meeting.ai_summary
          const realNotes = hasRealNotes(notes) ? notes : null

          return (
            <div key={meeting.id}>
              {/* Meeting row */}
              <div
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-start gap-3"
                onClick={() => toggle(meeting.id)}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {isExpanded
                    ? <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                    : <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">
                      {meeting.summary || 'Untitled'}
                    </span>
                    {realNotes ? (
                      <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Notes</span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">No notes</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {formatDate(meeting.start_time)} · {formatTime(meeting.start_time)}–{formatTime(meeting.end_time)}
                    {meeting.source === 'granola_mcp' && (
                      <span className="ml-2 text-purple-600">Granola</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded notes */}
              {isExpanded && (
                <div className="px-4 py-4 bg-gray-50 border-t border-gray-100">
                  {realNotes ? (
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                      {realNotes}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">
                      No notes saved for this meeting.
                    </p>
                  )}
                  {meeting.attendees && Array.isArray(meeting.attendees) && meeting.attendees.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                      <span className="font-medium">Attendees:</span>{' '}
                      {meeting.attendees.map((a: any) => a.name || a.email || a).join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
