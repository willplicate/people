import { NextRequest, NextResponse } from 'next/server'
import { LifeCoachService } from '@/services/LifeCoachService'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const habitId = searchParams.get('habitId')
    const days = parseInt(searchParams.get('days') || '7')

    if (!habitId) {
      return NextResponse.json(
        { error: 'habitId query parameter is required' },
        { status: 400 }
      )
    }

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - days + 1)

    // Fetch logs for the date range
    const logs = await LifeCoachService.getHabitLogs(
      habitId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    )

    return NextResponse.json({
      logs
    })

  } catch (error) {
    console.error('Get habit logs error:', error)
    return NextResponse.json(
      { error: 'Failed to get habit logs' },
      { status: 500 }
    )
  }
}
