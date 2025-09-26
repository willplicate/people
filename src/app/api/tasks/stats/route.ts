import { NextRequest, NextResponse } from 'next/server'
import { PersonalTaskService } from '@/services/PersonalTaskService'

export async function GET(request: NextRequest) {
  try {
    const stats = await PersonalTaskService.getStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching task stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task stats' },
      { status: 500 }
    )
  }
}