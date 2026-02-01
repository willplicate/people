import { NextRequest, NextResponse } from 'next/server'
import { LifeCoachService } from '@/services/LifeCoachService'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      )
    }

    // Get all habits for the user
    const habits = await LifeCoachService.getHabitsByUserId(userId)

    // Get today's date
    const today = new Date().toISOString().split('T')[0]

    // Get today's logs
    const todayLogs = await LifeCoachService.getTodayHabitLogs(userId)

    // Build response with habits and today's completion status
    const habitsWithStatus = habits.map(habit => {
      const todayLog = todayLogs.find(log => log.habit_id === habit.id)

      return {
        id: habit.id,
        name: habit.name,
        type: habit.type,
        frequency: habit.frequency,
        targetCount: habit.target_count,
        currentStreak: habit.current_streak,
        longestStreak: habit.longest_streak,
        todayCompleted: todayLog?.completed || false,
        todayCount: todayLog?.count || 0,
        todayNotes: todayLog?.notes || null,
      }
    })

    return NextResponse.json({
      habits: habitsWithStatus
    })

  } catch (error) {
    console.error('Get habits error:', error)
    return NextResponse.json(
      { error: 'Failed to get habits' },
      { status: 500 }
    )
  }
}
