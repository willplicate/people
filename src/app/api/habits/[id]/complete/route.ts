import { NextRequest, NextResponse } from 'next/server'
import { HabitCompletionService } from '@/services/HabitService'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Use provided date or today's date
    const completedDate = body.completed_date || new Date().toISOString().split('T')[0]

    const completion = await HabitCompletionService.complete({
      habit_id: id,
      completed_date: completedDate,
      notes: body.notes || null,
    })

    return NextResponse.json(completion, { status: 201 })
  } catch (error: any) {
    console.error('Error completing habit:', error)

    if (error.message.includes('already completed')) {
      return NextResponse.json(
        { error: 'Habit already completed for this date' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to complete habit' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)

    // Use provided date or today's date
    const completedDate = searchParams.get('date') || new Date().toISOString().split('T')[0]

    await HabitCompletionService.uncomplete(id, completedDate)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error uncompleting habit:', error)
    return NextResponse.json(
      { error: 'Failed to uncomplete habit' },
      { status: 500 }
    )
  }
}