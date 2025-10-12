'use client'

/**
 * WeekNavigationSidebar - Left sidebar showing all weeks
 *
 * PURPOSE:
 *   - Quick navigation between weeks
 *   - Visual progress indicators
 *   - Show completion percentage per week
 *
 * DISPLAYS:
 *   - Program name at top
 *   - "Intro" link (overview page)
 *   - Week 1-20 with status icons:
 *     ✓ = Completed
 *     → = Current/in progress
 *     ○ = Not started
 *   - Progress bar for each week
 */

import { usePathname, useRouter } from 'next/navigation'
import { LearningProgram, WeekProgress } from '@/types/lms'

interface WeekNavigationSidebarProps {
  program: LearningProgram
  weekProgress: WeekProgress[] // Progress data for all weeks
  currentWeekNumber?: number // Which week is currently selected
}

export default function WeekNavigationSidebar({
  program,
  weekProgress,
  currentWeekNumber
}: WeekNavigationSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()

  // Check if we're on the intro page
  const isIntroActive = pathname?.includes('/intro') || pathname?.endsWith('/learning')

  /**
   * Get status icon for a week
   *
   * Logic:
   * - 100% complete = ✓ (green checkmark)
   * - Currently viewing = → (blue arrow)
   * - 1-99% complete = ⟳ (in progress)
   * - 0% complete = ○ (not started)
   */
  const getWeekIcon = (week: WeekProgress) => {
    if (week.completion_percentage === 100) {
      return <span className="text-green-600 text-lg">✓</span>
    }
    if (week.week_number === currentWeekNumber) {
      return <span className="text-blue-600 text-lg">→</span>
    }
    if (week.completion_percentage > 0) {
      return <span className="text-yellow-600 text-lg">⟳</span>
    }
    return <span className="text-gray-400 text-lg">○</span>
  }

  /**
   * Get text color based on status
   */
  const getWeekTextColor = (week: WeekProgress) => {
    if (week.week_number === currentWeekNumber) {
      return 'text-blue-700 font-semibold'
    }
    if (week.completion_percentage === 100) {
      return 'text-green-700'
    }
    if (week.completion_percentage > 0) {
      return 'text-gray-900'
    }
    return 'text-gray-500'
  }

  return (
    <div className="w-64 h-screen bg-gray-50 border-r border-gray-200 overflow-y-auto">
      {/* PROGRAM HEADER */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="text-sm font-semibold text-gray-900 truncate" title={program.name}>
          📚 {program.name}
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          {program.total_weeks} weeks
        </p>
      </div>

      {/* INTRO LINK */}
      <button
        onClick={() => router.push('/learning/intro')}
        className={`
          w-full px-4 py-3 text-left border-b border-gray-200 transition-colors
          ${isIntroActive
            ? 'bg-blue-100 text-blue-700 font-semibold'
            : 'hover:bg-gray-100 text-gray-700'
          }
        `}
      >
        <div className="flex items-center space-x-2">
          <span className="text-lg">📖</span>
          <span className="text-sm">Introduction</span>
        </div>
      </button>

      {/* WEEK LIST */}
      <div className="py-2">
        {weekProgress.map((week) => {
          const isActive = week.week_number === currentWeekNumber

          return (
            <button
              key={week.week_id}
              onClick={() => router.push(`/learning/week/${week.week_number}`)}
              className={`
                w-full px-4 py-2 text-left transition-colors
                ${isActive
                  ? 'bg-blue-50 border-l-4 border-blue-600'
                  : 'border-l-4 border-transparent hover:bg-gray-100'
                }
              `}
            >
              {/* WEEK HEADER */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  {getWeekIcon(week)}
                  <span className={`text-sm ${getWeekTextColor(week)} truncate`}>
                    Week {week.week_number}
                  </span>
                </div>

                {/* COMPLETION PERCENTAGE */}
                {week.completion_percentage > 0 && (
                  <span className="text-xs text-gray-500 ml-2">
                    {week.completion_percentage}%
                  </span>
                )}
              </div>

              {/* WEEK TITLE (truncated) */}
              <p className="text-xs text-gray-500 mt-1 truncate ml-6" title={week.title}>
                {week.title}
              </p>

              {/* PROGRESS BAR */}
              {week.completion_percentage > 0 && (
                <div className="mt-2 ml-6">
                  <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        week.completion_percentage === 100
                          ? 'bg-green-600'
                          : 'bg-blue-600'
                      }`}
                      style={{ width: `${week.completion_percentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* STUDY TIME (if any sessions) */}
              {week.total_study_minutes > 0 && (
                <div className="text-xs text-gray-400 mt-1 ml-6">
                  {Math.round(week.total_study_minutes / 60)}h studied
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* OVERALL PROGRESS FOOTER */}
      <div className="p-4 border-t border-gray-200 bg-white mt-auto">
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>Overall Progress:</span>
            <span className="font-semibold text-gray-700">
              {weekProgress.filter(w => w.completion_percentage === 100).length}/{program.total_weeks}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Total Study Time:</span>
            <span className="font-semibold text-gray-700">
              {Math.round(weekProgress.reduce((sum, w) => sum + (w.total_study_minutes || 0), 0) / 60)}h
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
