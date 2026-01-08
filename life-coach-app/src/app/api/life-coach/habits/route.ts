import { NextResponse } from 'next/server'
import { LifeCoachService } from '@/services/LifeCoachService'

/**
 * GET /api/life-coach/habits
 * Returns all habits for a user
 */
export async function GET(request: Request) {
  try {
    // Get userId from query params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const habits = await LifeCoachService.getHabitsByUserId(userId)

    return NextResponse.json({
      success: true,
      habits,
      count: habits.length,
    })
  } catch (error) {
    console.error('Error fetching habits:', error)
    return NextResponse.json(
      { error: 'Failed to fetch habits', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * POST /api/life-coach/habits
 * Create a new habit
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, name, type, frequency, target_count } = body

    if (!userId || !name) {
      return NextResponse.json(
        { error: 'userId and name are required' },
        { status: 400 }
      )
    }

    const habit = await LifeCoachService.createHabit({
      user_id: userId,
      name,
      type: type || 'cultivate',
      frequency: frequency || 'daily',
      target_count: target_count || 1,
      current_streak: 0,
      longest_streak: 0
    })

    return NextResponse.json({
      success: true,
      habit
    })
  } catch (error) {
    console.error('Error creating habit:', error)
    return NextResponse.json(
      { error: 'Failed to create habit', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/life-coach/habits
 * Delete a habit
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const habitId = searchParams.get('habitId')

    if (!habitId) {
      return NextResponse.json(
        { error: 'habitId is required' },
        { status: 400 }
      )
    }

    await LifeCoachService.deleteHabit(habitId)

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('Error deleting habit:', error)
    return NextResponse.json(
      { error: 'Failed to delete habit', details: String(error) },
      { status: 500 }
    )
  }
}
