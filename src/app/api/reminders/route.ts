import { NextRequest, NextResponse } from 'next/server'
import { ReminderService } from '@/services/ReminderService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const options = {
      status: searchParams.get('status') as any || undefined,
      type: searchParams.get('type') as any || undefined,
      contactId: searchParams.get('contact_id') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    }

    const reminders = await ReminderService.getAll(options)

    return NextResponse.json(reminders)
  } catch (error) {
    console.error('Error fetching reminders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reminders' },
      { status: 500 }
    )
  }
}