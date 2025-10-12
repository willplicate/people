'use client'

/**
 * Introduction/Overview Page for LMS
 *
 * PURPOSE:
 *   - Show program overview before diving into weeks
 *   - Display role description (what an AI/ML Analyst does)
 *   - Show overall progress stats
 *   - Provide "Start" or "Continue" button
 *
 * CONTENT:
 *   - Program name and description
 *   - Role you're training for
 *   - Quick stats (weeks completed, total study time, current streak)
 *   - Action button to start or continue
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LearningProgram, WeekProgress } from '@/types/lms'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function LearningIntroPage() {
  const router = useRouter()
  const [program, setProgram] = useState<LearningProgram | null>(null)
  const [weekProgress, setWeekProgress] = useState<WeekProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProgramData()
  }, [])

  /**
   * Fetch program data and progress from API
   */
  const fetchProgramData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch program info
      const programRes = await fetch('/api/learning/program')
      if (!programRes.ok) throw new Error('Failed to fetch program')
      const programData = await programRes.json()
      setProgram(programData)

      // Fetch week progress
      const progressRes = await fetch('/api/learning/progress')
      if (!progressRes.ok) throw new Error('Failed to fetch progress')
      const progressData = await progressRes.json()
      setWeekProgress(progressData)

    } catch (err) {
      console.error('Error fetching program data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load program')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Calculate stats from progress data
   */
  const getStats = () => {
    const completedWeeks = weekProgress.filter(w => w.completion_percentage === 100).length
    const totalStudyMinutes = weekProgress.reduce((sum, w) => sum + (w.total_study_minutes || 0), 0)
    const totalStudyHours = Math.round(totalStudyMinutes / 60)

    // Find current week (first incomplete week)
    const currentWeek = weekProgress.find(w => w.completion_percentage < 100 && w.completion_percentage > 0)
      || weekProgress.find(w => w.completion_percentage === 0)

    return {
      completedWeeks,
      totalStudyHours,
      currentWeek
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading program...</p>
        </div>
      </div>
    )
  }

  if (error || !program) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-4">{error || 'Program not found'}</p>
          <button
            onClick={fetchProgramData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const stats = getStats()

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {program.name}
        </h1>
        {program.description && (
          <p className="text-lg text-gray-600">
            {program.description}
          </p>
        )}
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-medium">Progress</p>
          <p className="text-2xl font-bold text-blue-900 mt-1">
            {stats.completedWeeks}/{program.total_weeks}
          </p>
          <p className="text-xs text-blue-700 mt-1">weeks completed</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600 font-medium">Study Time</p>
          <p className="text-2xl font-bold text-green-900 mt-1">
            {stats.totalStudyHours}h
          </p>
          <p className="text-xs text-green-700 mt-1">total logged</p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm text-purple-600 font-medium">Current Week</p>
          <p className="text-2xl font-bold text-purple-900 mt-1">
            {stats.currentWeek?.week_number || 1}
          </p>
          <p className="text-xs text-purple-700 mt-1">
            {stats.currentWeek?.completion_percentage || 0}% complete
          </p>
        </div>
      </div>

      {/* ROLE DESCRIPTION */}
      {program.role_description && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            📋 What Does an AI/ML Analyst Do?
          </h2>
          <div className="prose prose-sm max-w-none text-gray-700">
            {program.role_description}
          </div>
        </div>
      )}

      {/* INTRO CONTENT (Markdown) */}
      {program.intro_content && (
        <div className="mb-8">
          <div className="prose max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {program.intro_content}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* ACTION BUTTON */}
      <div className="flex justify-center mt-12">
        <button
          onClick={() => {
            const nextWeek = stats.currentWeek?.week_number || 1
            router.push(`/learning/week/${nextWeek}`)
          }}
          className="px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
        >
          {stats.completedWeeks > 0
            ? `Continue to Week ${stats.currentWeek?.week_number || 1}`
            : 'Start Week 1'
          }
        </button>
      </div>

      {/* TIMELINE (optional) */}
      {program.start_date && (
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
          <div className="flex justify-between text-sm">
            <div>
              <p className="text-gray-600">Started</p>
              <p className="font-medium text-gray-900">
                {new Date(program.start_date).toLocaleDateString()}
              </p>
            </div>
            {program.target_end_date && (
              <div className="text-right">
                <p className="text-gray-600">Target End</p>
                <p className="font-medium text-gray-900">
                  {new Date(program.target_end_date).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
