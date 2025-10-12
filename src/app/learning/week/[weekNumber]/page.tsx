'use client'

/**
 * Week Content Page - Display weekly curriculum content
 *
 * PURPOSE:
 *   - Show all content for a specific week
 *   - Display topics and their completion status
 *   - Show learning objectives
 *   - Display resources (videos, articles, exercises)
 *   - Show study session history for this week
 *   - Provide session tracker to log today's study
 *
 * URL: /learning/week/[weekNumber]
 * Example: /learning/week/3
 */

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LearningWeek, LearningTopic, RecentSession, WeekSection, KnowledgeConcept, WeekNote, ProjectDiscussion } from '@/types/lms'
import SessionTracker from '@/components/LMS/SessionTracker'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface WeekPageProps {
  params: Promise<{
    weekNumber: string
  }>
}

export default function WeekPage({ params }: WeekPageProps) {
  const resolvedParams = use(params)
  const weekNumber = parseInt(resolvedParams.weekNumber)
  const router = useRouter()

  const [week, setWeek] = useState<LearningWeek | null>(null)
  const [sections, setSections] = useState<WeekSection[]>([])
  const [topics, setTopics] = useState<LearningTopic[]>([])
  const [sessions, setSessions] = useState<RecentSession[]>([])
  const [concepts, setConcepts] = useState<KnowledgeConcept[]>([])
  const [notes, setNotes] = useState<WeekNote[]>([])
  const [discussion, setDiscussion] = useState<ProjectDiscussion | null>(null)
  const [showSessionTracker, setShowSessionTracker] = useState(false)
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchWeekData()
  }, [weekNumber])

  /**
   * Fetch week data, sections, topics, and recent sessions
   */
  const fetchWeekData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch week info
      const weekRes = await fetch(`/api/learning/weeks/${weekNumber}`)
      if (!weekRes.ok) throw new Error('Failed to fetch week')
      const weekData = await weekRes.json()
      setWeek(weekData)

      // Fetch sections for this week
      const sectionsRes = await fetch(`/api/learning/weeks/${weekNumber}/sections`)
      if (sectionsRes.ok) {
        const sectionsData = await sectionsRes.json()
        setSections(sectionsData)
      }

      // Fetch topics for this week
      const topicsRes = await fetch(`/api/learning/weeks/${weekNumber}/topics`)
      if (!topicsRes.ok) throw new Error('Failed to fetch topics')
      const topicsData = await topicsRes.json()
      setTopics(topicsData)

      // Fetch recent sessions for this week
      const sessionsRes = await fetch(`/api/learning/weeks/${weekNumber}/sessions`)
      if (!sessionsRes.ok) throw new Error('Failed to fetch sessions')
      const sessionsData = await sessionsRes.json()
      setSessions(sessionsData)

      // Fetch knowledge concepts
      const conceptsRes = await fetch(`/api/learning/weeks/${weekNumber}/concepts`)
      if (conceptsRes.ok) {
        const conceptsData = await conceptsRes.json()
        setConcepts(conceptsData)
      }

      // Fetch notes
      const notesRes = await fetch(`/api/learning/weeks/${weekNumber}/notes`)
      if (notesRes.ok) {
        const notesData = await notesRes.json()
        setNotes(notesData)
      }

      // Fetch project discussion
      const discussionRes = await fetch(`/api/learning/weeks/${weekNumber}/discussion`)
      if (discussionRes.ok) {
        const discussionData = await discussionRes.json()
        setDiscussion(discussionData)
      }

    } catch (err) {
      console.error('Error fetching week data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load week')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Toggle topic completion
   */
  const handleToggleTopicComplete = async (topicId: string, isCompleted: boolean) => {
    try {
      const response = await fetch(`/api/learning/topics/${topicId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: isCompleted })
      })

      if (!response.ok) throw new Error('Failed to update topic')

      // Update local state
      setTopics(topics.map(t =>
        t.id === topicId ? { ...t, is_completed: isCompleted } : t
      ))
    } catch (err) {
      console.error('Error updating topic:', err)
      alert('Failed to update topic completion')
    }
  }

  /**
   * Handle session saved - refresh data
   */
  const handleSessionSaved = () => {
    setShowSessionTracker(false)
    fetchWeekData() // Refresh to show new session
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading week {weekNumber}...</p>
        </div>
      </div>
    )
  }

  if (error || !week) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-4">{error || 'Week not found'}</p>
          <button
            onClick={() => router.push('/learning/intro')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Overview
          </button>
        </div>
      </div>
    )
  }

  const completedTopics = topics.filter(t => t.is_completed).length
  const totalTopics = topics.length
  const completionPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* WEEK HEADER */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Week {weekNumber}: {week.title}
          </h1>
          <button
            onClick={() => router.push('/learning/intro')}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to Overview
          </button>
        </div>

        {week.description && (
          <p className="text-lg text-gray-600">{week.description}</p>
        )}

        {/* PROGRESS BAR */}
        {totalTopics > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{completedTopics}/{totalTopics} topics completed</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* LEARNING OBJECTIVES */}
      {week.objectives && week.objectives.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">
            📋 Learning Objectives
          </h2>
          <ul className="space-y-2">
            {week.objectives.map((objective, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span className="text-blue-800">{objective}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* WEDNESDAY PROJECT DISCUSSION BANNER */}
      {discussion && discussion.status === 'pending' && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-lg p-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-purple-900 mb-2">
                💬 Wednesday Project Discussion
              </h2>
              <p className="text-purple-700 mb-4">
                It's time to discuss your Week {weekNumber} project with Claude! Use the template questions to guide your conversation.
              </p>
              <details className="mb-4">
                <summary className="cursor-pointer text-sm font-semibold text-purple-800 hover:text-purple-900">
                  View {discussion.template_questions?.length || 0} Template Questions
                </summary>
                <ul className="mt-3 space-y-2 pl-4">
                  {discussion.template_questions?.map((q, i) => (
                    <li key={i} className="text-sm text-purple-700">
                      {i + 1}. {q}
                    </li>
                  ))}
                </ul>
              </details>
              <button
                onClick={() => {
                  // Mark as in_progress and scroll down to show form
                  alert('Discussion interface coming soon! For now, have the discussion with Claude and record your notes below.')
                }}
                className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
              >
                Start Discussion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KNOWLEDGE CONCEPTS */}
      {concepts.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-green-900">
              🧠 Knowledge Concepts
            </h2>
            <button
              onClick={() => {
                const conceptsText = concepts.map(c =>
                  `**${c.concept_name}**\nDefinition: ${c.definition}\nUnderstanding Level: ${c.understanding_level || 1}/5`
                ).join('\n\n')

                const geminiPrompt = `Generate a quiz based on these concepts I've learned in Week ${weekNumber}:\n\n${conceptsText}\n\nCreate 5 multiple choice questions that test my understanding. Focus on practical application and conceptual understanding.`

                navigator.clipboard.writeText(geminiPrompt)
                alert('📋 Quiz prompt copied to clipboard! Paste into Gemini to generate your quiz.')
              }}
              className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition-colors"
            >
              📝 Generate Quiz with Gemini
            </button>
          </div>
          <div className="space-y-3">
            {concepts.map((concept) => (
              <div key={concept.id} className="bg-white border border-green-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{concept.concept_name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{concept.definition}</p>
                  </div>
                  <div className="ml-4 flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-lg ${
                          star <= (concept.understanding_level || 0)
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      >
                        ⭐
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NOTES SECTION */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-yellow-900">
            📝 My Notes
          </h2>
          <button
            onClick={() => setShowNoteForm(!showNoteForm)}
            className="px-3 py-1.5 bg-yellow-600 text-white text-sm font-medium rounded hover:bg-yellow-700 transition-colors"
          >
            + Add Note
          </button>
        </div>

        {showNoteForm && (
          <div className="bg-white border border-yellow-300 rounded-lg p-4 mb-4">
            <textarea
              placeholder="What did you learn? Any breakthroughs, questions, or struggles?"
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-yellow-500"
              rows={4}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.metaKey) {
                  // Save note
                  const content = e.currentTarget.value.trim()
                  if (content) {
                    fetch(`/api/learning/weeks/${weekNumber}/notes`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ content, note_type: 'general' })
                    }).then(() => {
                      fetchWeekData()
                      e.currentTarget.value = ''
                      setShowNoteForm(false)
                    })
                  }
                }
              }}
            />
            <p className="text-xs text-gray-500 mt-2">Press Cmd+Enter to save</p>
          </div>
        )}

        {notes.length > 0 ? (
          <div className="space-y-2">
            {notes.map((note) => (
              <div key={note.id} className="bg-white border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <p className="text-sm text-gray-700 flex-1">{note.content}</p>
                  <span className="text-xs text-gray-500 ml-4">
                    {new Date(note.note_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-yellow-700">No notes yet. Add your first note above!</p>
        )}
      </div>

      {/* WEEK SECTIONS */}
      {sections.length > 0 ? (
        <div className="space-y-6 mb-8">
          {sections.map((section) => (
            <div
              key={section.id}
              className="bg-white border-2 border-gray-300 rounded-lg p-6 shadow-sm"
            >
              {/* Section Header */}
              <div className="mb-4 pb-3 border-b-2 border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">
                  {section.title}
                </h2>
                {section.day_range && (
                  <p className="text-sm text-gray-500 mt-1">
                    📅 {section.day_range}
                  </p>
                )}
              </div>

              {/* Section Content */}
              <div className="prose prose-lg max-w-none prose-headings:mt-6 prose-headings:mb-3 prose-h2:text-xl prose-h3:text-lg prose-p:my-3 prose-ul:my-3 prose-li:my-1.5 prose-strong:text-gray-900 prose-strong:font-semibold">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {section.content}
                </ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      ) : week.content ? (
        /* Fallback to old content field if no sections */
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <div className="prose prose-lg max-w-none prose-headings:mt-8 prose-headings:mb-4 prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:my-4 prose-ul:my-4 prose-li:my-2">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {week.content}
            </ReactMarkdown>
          </div>
        </div>
      ) : null}

      {/* TOPICS LIST */}
      {topics.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📝 Topics</h2>
          <div className="space-y-3">
            {topics.map((topic) => (
              <div
                key={topic.id}
                className={`border rounded-lg p-4 transition-colors ${
                  topic.is_completed
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-start">
                  {/* CHECKBOX */}
                  <button
                    onClick={() => handleToggleTopicComplete(topic.id, !topic.is_completed)}
                    className={`mr-3 mt-1 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                      topic.is_completed
                        ? 'bg-green-600 border-green-600'
                        : 'border-gray-300 hover:border-green-500'
                    }`}
                  >
                    {topic.is_completed && (
                      <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>

                  {/* TOPIC INFO */}
                  <div className="flex-1">
                    <h3 className={`font-medium ${topic.is_completed ? 'text-green-900 line-through' : 'text-gray-900'}`}>
                      {topic.topic_order}. {topic.title}
                    </h3>
                    {topic.description && (
                      <p className="text-sm text-gray-600 mt-1">{topic.description}</p>
                    )}
                    {topic.estimated_hours && (
                      <p className="text-xs text-gray-500 mt-1">
                        Est. {topic.estimated_hours} hours
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RESOURCES */}
      {week.resources && week.resources.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📚 Resources</h2>
          <div className="space-y-2">
            {week.resources.map((resource, index) => (
              <a
                key={index}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-3 hover:bg-white rounded-lg transition-colors group"
              >
                <span className="text-2xl mr-3">
                  {resource.type === 'video' ? '🎥' :
                   resource.type === 'article' ? '📄' :
                   resource.type === 'course' ? '🎓' :
                   resource.type === 'book' ? '📖' :
                   resource.type === 'exercise' ? '💻' : '🔗'}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                    {resource.title}
                  </p>
                  {resource.description && (
                    <p className="text-xs text-gray-600">{resource.description}</p>
                  )}
                </div>
                <span className="text-gray-400 group-hover:text-blue-600">→</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* RECENT SESSIONS */}
      {sessions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 Recent Study Sessions</h2>
          <div className="space-y-2">
            {sessions.map((session) => (
              <div key={session.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(session.session_date).toLocaleDateString()}
                      {session.duration_minutes && ` • ${session.duration_minutes} min`}
                    </p>
                    {session.session_notes && (
                      <p className="text-sm text-gray-600 mt-1">{session.session_notes}</p>
                    )}
                  </div>
                  {session.engagement_level && (
                    <span className="ml-4 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {session.engagement_level}/5
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LOG SESSION BUTTON/FORM */}
      {!showSessionTracker ? (
        <button
          onClick={() => setShowSessionTracker(true)}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Log Today's Study Session
        </button>
      ) : (
        <SessionTracker
          programId={week.program_id}
          weekId={week.id}
          weekNumber={weekNumber}
          weekTitle={week.title}
          topicOptions={topics.map(t => ({ id: t.id, title: t.title }))}
          onSessionSaved={handleSessionSaved}
          onCancel={() => setShowSessionTracker(false)}
        />
      )}
    </div>
  )
}
