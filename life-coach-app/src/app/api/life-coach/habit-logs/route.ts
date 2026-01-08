import { NextResponse } from 'next/server'
import { LifeCoachService } from '@/services/LifeCoachService'

/**
 * POST /api/life-coach/habit-logs
 * Log a habit completion
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { habitId, logDate, completed } = body

    if (!habitId || !logDate) {
      return NextResponse.json(
        { error: 'habitId and logDate are required' },
        { status: 400 }
      )
    }

    const log = await LifeCoachService.logHabitCompletion({
      habit_id: habitId,
      log_date: logDate,
      completed: completed ?? false,
      count: completed ? 1 : 0
    })

    return NextResponse.json({
      success: true,
      log
    })
  } catch (error) {
    console.error('Error logging habit:', error)
    return NextResponse.json(
      { error: 'Failed to log habit', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * GET /api/life-coach/habit-logs
 * Get habit logs for a date range
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const habitId = searchParams.get('habitId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!habitId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'habitId, startDate, and endDate are required' },
        { status: 400 }
      )
    }

    const logs = await LifeCoachService.getHabitLogs(habitId, startDate, endDate)

    return NextResponse.json({
      success: true,
      logs
    })
  } catch (error) {
    console.error('Error fetching habit logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch habit logs', details: String(error) },
      { status: 500 }
    )
  }
}
