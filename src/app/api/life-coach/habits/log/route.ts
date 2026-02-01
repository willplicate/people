import { NextRequest, NextResponse } from 'next/server'
import { LifeCoachService } from '@/services/LifeCoachService'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { habitId, date, completed, count, notes } = body

    if (!habitId) {
      return NextResponse.json(
        { error: 'habitId is required' },
        { status: 400 }
      )
    }

    // Use today if no date provided
    const logDate = date || new Date().toISOString().split('T')[0]

    // Log the habit completion
    const log = await LifeCoachService.logHabitCompletion({
      habit_id: habitId,
      log_date: logDate,
      completed: completed !== undefined ? completed : true,
      count: count || 0,
      notes: notes || null
    })

    // Get updated habit to return current streak
    const habit = await LifeCoachService.getHabitById(habitId)

    return NextResponse.json({
      log,
      currentStreak: habit?.current_streak || 0,
      longestStreak: habit?.longest_streak || 0
    })

  } catch (error) {
    console.error('Log habit error:', error)
    return NextResponse.json(
      { error: 'Failed to log habit completion' },
      { status: 500 }
    )
  }
}
