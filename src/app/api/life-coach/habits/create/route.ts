import { NextRequest, NextResponse } from 'next/server'
import { LifeCoachService } from '@/services/LifeCoachService'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, name, type, frequency } = body

    if (!userId || !name) {
      return NextResponse.json(
        { error: 'userId and name are required' },
        { status: 400 }
      )
    }

    // Create the habit
    const habit = await LifeCoachService.createHabit({
      user_id: userId,
      name,
      type: type || 'cultivate',
      frequency: frequency || 'daily',
      target_count: 1,
      current_streak: 0,
      longest_streak: 0
    })

    return NextResponse.json({
      habit
    })

  } catch (error) {
    console.error('Create habit error:', error)
    return NextResponse.json(
      { error: 'Failed to create habit' },
      { status: 500 }
    )
  }
}
