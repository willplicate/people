import { NextRequest, NextResponse } from 'next/server'
import { HabitCompletionService } from '@/services/HabitService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)

    const days = parseInt(searchParams.get('days') || '30')

    const stats = await HabitCompletionService.getCompletionStats(id, days)

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching habit stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch habit statistics' },
      { status: 500 }
    )
  }
}