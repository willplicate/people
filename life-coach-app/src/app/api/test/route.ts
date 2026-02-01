import { NextResponse } from 'next/server'
import { LifeCoachService } from '@/services/LifeCoachService'

export async function GET() {
  try {
    // Test LifeCoachService by getting habits for a test user
    // Using a dummy user_id for testing - in production this would come from auth
    const testUserId = '00000000-0000-0000-0000-000000000000'

    const habits = await LifeCoachService.getHabitsByUserId(testUserId)

    return NextResponse.json({
      success: true,
      message: 'LifeCoachService works!',
      habitCount: habits.length,
      habits: habits.map(h => ({ id: h.id, name: h.name, type: h.type })),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: String(error),
        message: 'Server error'
      },
      { status: 500 }
    )
  }
}
