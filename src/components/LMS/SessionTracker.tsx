'use client'

/**
 * SessionTracker - Form to log daily study sessions
 *
 * PURPOSE:
 *   - Quick way to track: when you studied, how long, your notes
 *   - Captures engagement level (1-5 scale)
 *   - Saves to database for later analysis
 *
 * WHEN SHOWN:
 *   - At bottom of each week page
 *   - As a modal (can be triggered from anywhere)
 *   - After completing a topic
 *
 * DATA COLLECTED:
 *   - Date (defaults to today)
 *   - Duration in minutes
 *   - Engagement level (1-5)
 *   - Notes/reflections
 *   - Optional: specific topic studied
 */

import { useState } from 'react'
import { CreateSessionInput } from '@/types/lms'

interface SessionTrackerProps {
  programId: string
  weekId: string
  weekNumber: number
  weekTitle: string
  topicOptions?: Array<{ id: string; title: string }> // Optional topics to choose from
  onSessionSaved: () => void // Callback after successful save
  onCancel?: () => void // Optional cancel callback
}

export default function SessionTracker({
  programId,
  weekId,
  weekNumber,
  weekTitle,
  topicOptions,
  onSessionSaved,
  onCancel
}: SessionTrackerProps) {
  // FORM STATE
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0])
  const [durationMinutes, setDurationMinutes] = useState<number>(60)
  const [engagementLevel, setEngagementLevel] = useState<number>(3)
  const [sessionNotes, setSessionNotes] = useState('')
  const [selectedTopicId, setSelectedTopicId] = useState<string>('')
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Handle form submission
   *
   * Process:
   * 1. Validate inputs
   * 2. Create session object
   * 3. Save to Supabase
   * 4. Call onSessionSaved callback
   * 5. Reset form
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSaving(true)

    try {
      // BUILD SESSION DATA
      const sessionData: CreateSessionInput = {
        program_id: programId,
        week_id: weekId,
        topic_id: selectedTopicId || undefined,
        session_date: sessionDate,
        duration_minutes: durationMinutes,
        engagement_level: engagementLevel,
        session_notes: sessionNotes.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined
      }

      // SAVE TO DATABASE (you'll implement this API call)
      const response = await fetch('/api/learning/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      })

      if (!response.ok) {
        throw new Error('Failed to save session')
      }

      // SUCCESS!
      // Reset form
      setSessionNotes('')
      setTags([])
      setEngagementLevel(3)
      setDurationMinutes(60)
      setSelectedTopicId('')

      // Notify parent component
      onSessionSaved()

    } catch (err) {
      console.error('Error saving session:', err)
      setError(err instanceof Error ? err.message : 'Failed to save session')
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Add a tag
   */
  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  /**
   * Remove a tag
   */
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove))
  }

  /**
   * Engagement level labels
   */
  const getEngagementLabel = (level: number) => {
    const labels = {
      1: 'Very Distracted',
      2: 'Somewhat Distracted',
      3: 'Okay Focus',
      4: 'Good Focus',
      5: 'Deep Focus'
    }
    return labels[level as keyof typeof labels] || ''
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        📝 Log Study Session
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* CONTEXT INFO (read-only) */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600">
            Week {weekNumber}: <span className="font-medium text-gray-900">{weekTitle}</span>
          </p>
        </div>

        {/* DATE */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            type="date"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* DURATION */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duration (minutes)
          </label>
          <input
            type="number"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
            min="1"
            max="600"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {Math.round(durationMinutes / 60 * 10) / 10} hours
          </p>
        </div>

        {/* TOPIC (optional) */}
        {topicOptions && topicOptions.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Topic (optional)
            </label>
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Select topic --</option>
              {topicOptions.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ENGAGEMENT LEVEL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How engaged were you?
          </label>

          {/* SLIDER */}
          <input
            type="range"
            min="1"
            max="5"
            value={engagementLevel}
            onChange={(e) => setEngagementLevel(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />

          {/* LABELS */}
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Very Distracted</span>
            <span>Deep Focus</span>
          </div>

          {/* SELECTED LEVEL */}
          <div className="mt-2 text-center">
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {engagementLevel}/5 - {getEngagementLabel(engagementLevel)}
            </span>
          </div>
        </div>

        {/* NOTES */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes & Reflections
          </label>
          <textarea
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
            rows={4}
            placeholder="What did you learn? Any breakthroughs? What was confusing? Key takeaways..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            These notes will be saved for future reference and analysis
          </p>
        </div>

        {/* TAGS */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags (optional)
          </label>

          {/* TAG INPUT */}
          <div className="flex space-x-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              placeholder="e.g., breakthrough, confused, review-needed"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Add
            </button>
          </div>

          {/* TAG LIST */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Session'}
          </button>
        </div>
      </form>
    </div>
  )
}
