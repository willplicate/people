'use client'

/**
 * LMS Layout - Wraps all learning pages with sidebar navigation
 *
 * PURPOSE:
 *   - Provides consistent layout across all LMS pages
 *   - Shows week navigation sidebar on the left
 *   - Main content area on the right
 *
 * USED BY:
 *   - /learning/intro
 *   - /learning/week/[weekNumber]
 */

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import WeekNavigationSidebar from '@/components/LMS/WeekNavigationSidebar'
import { LearningProgram, WeekProgress } from '@/types/lms'

export default function LearningLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const [program, setProgram] = useState<LearningProgram | null>(null)
  const [weekProgress, setWeekProgress] = useState<WeekProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLayoutData()
  }, [])

  /**
   * Fetch program and progress data for sidebar
   */
  const fetchLayoutData = async () => {
    try {
      setLoading(true)

      // Fetch program
      const programRes = await fetch('/api/learning/program')
      if (programRes.ok) {
        const programData = await programRes.json()
        setProgram(programData)
      }

      // Fetch progress
      const progressRes = await fetch('/api/learning/progress')
      if (progressRes.ok) {
        const progressData = await progressRes.json()
        setWeekProgress(progressData)
      }

    } catch (err) {
      console.error('Error fetching layout data:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Extract current week number from pathname
   * /learning/week/3 → 3
   */
  const getCurrentWeekNumber = (): number | undefined => {
    const match = pathname?.match(/\/learning\/week\/(\d+)/)
    return match ? parseInt(match[1]) : undefined
  }

  if (loading || !program) {
    return (
      <div className="flex h-screen">
        <div className="w-64 bg-gray-50 border-r border-gray-200"></div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* SIDEBAR */}
      <WeekNavigationSidebar
        program={program}
        weekProgress={weekProgress}
        currentWeekNumber={getCurrentWeekNumber()}
      />

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {children}
      </div>
    </div>
  )
}
