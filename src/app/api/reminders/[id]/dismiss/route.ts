import { NextRequest, NextResponse } from 'next/server'
import { ReminderService } from '@/services/ReminderService'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if reminder exists
    const existingReminder = await ReminderService.getById((await params).id)
    if (!existingReminder) {
      return NextResponse.json(
        { error: 'Reminder not found' },
        { status: 404 }
      )
    }

    await ReminderService.dismiss((await params).id)

    return NextResponse.json({ message: 'Reminder dismissed successfully' })
  } catch (error) {
    console.error('Error dismissing reminder:', error)
    return NextResponse.json(
      { error: 'Failed to dismiss reminder' },
      { status: 500 }
    )
  }
}