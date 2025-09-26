import { NextRequest, NextResponse } from 'next/server'
import { MeetingAgendaService } from '@/services/MeetingAgendaService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const attendee = searchParams.get('attendee')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    const options: any = {}

    if (search) options.search = search
    if (attendee) options.attendee = attendee
    if (dateFrom) options.dateFrom = new Date(dateFrom)
    if (dateTo) options.dateTo = new Date(dateTo)
    if (limit) options.limit = parseInt(limit)
    if (offset) options.offset = parseInt(offset)

    const meetings = await MeetingAgendaService.getAll(options)

    return NextResponse.json({
      meetings,
      totalCount: meetings.length
    })
  } catch (error) {
    console.error('Error fetching meetings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meetings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    if (!Array.isArray(body.attendees)) {
      return NextResponse.json(
        { error: 'Attendees must be an array' },
        { status: 400 }
      )
    }

    const meeting = await MeetingAgendaService.create(body)
    return NextResponse.json(meeting, { status: 201 })
  } catch (error) {
    console.error('Error creating meeting:', error)
    return NextResponse.json(
      { error: 'Failed to create meeting' },
      { status: 500 }
    )
  }
}