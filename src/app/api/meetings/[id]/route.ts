import { NextRequest, NextResponse } from 'next/server'
import { MeetingAgendaService } from '@/services/MeetingAgendaService'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const meeting = await MeetingAgendaService.getById(params.id)

    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(meeting)
  } catch (error) {
    console.error('Error fetching meeting:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meeting' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    // Validate attendees array if provided
    if (body.attendees && !Array.isArray(body.attendees)) {
      return NextResponse.json(
        { error: 'Attendees must be an array' },
        { status: 400 }
      )
    }

    const meeting = await MeetingAgendaService.update(params.id, body)
    return NextResponse.json(meeting)
  } catch (error) {
    console.error('Error updating meeting:', error)
    return NextResponse.json(
      { error: 'Failed to update meeting' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await MeetingAgendaService.delete(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting meeting:', error)
    return NextResponse.json(
      { error: 'Failed to delete meeting' },
      { status: 500 }
    )
  }
}