import { NextRequest, NextResponse } from 'next/server'
import { ContactService } from '@/services/ContactService'
import { CreateContactInput } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const options = {
      search: searchParams.get('search') || undefined,
      communicationFrequency: searchParams.get('communicationFrequency') as any || undefined,
      remindersPaused: searchParams.get('remindersPaused') === 'true' ? true :
                       searchParams.get('remindersPaused') === 'false' ? false : undefined,
      christmasList: searchParams.get('christmasList') === 'true' ? true :
                     searchParams.get('christmasList') === 'false' ? false : undefined,
      noFrequency: searchParams.get('noFrequency') === 'true' ? true :
                   searchParams.get('noFrequency') === 'false' ? false : undefined,
      sortBy: (searchParams.get('sort_by') as any) || 'first_name',
      sortOrder: (searchParams.get('sort_order') as 'asc' | 'desc') || 'asc',
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    }

    const contacts = await ContactService.getAll(options)

    // Get total count for pagination
    const totalCount = await ContactService.getCount({
      search: options.search,
      communicationFrequency: options.communicationFrequency,
      remindersPaused: options.remindersPaused,
      christmasList: options.christmasList,
      noFrequency: options.noFrequency
    })

    return NextResponse.json({
      contacts,
      totalCount,
      pagination: {
        limit: options.limit || 25,
        offset: options.offset || 0,
        hasMore: contacts.length === (options.limit || 25)
      }
    })
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.first_name) {
      return NextResponse.json(
        { error: 'first_name is required' },
        { status: 400 }
      )
    }

    const contactInput: CreateContactInput = {
      first_name: body.first_name,
      last_name: body.last_name || null,
      nickname: body.nickname || null,
      birthday: body.birthday || null,
      communication_frequency: body.communication_frequency || null,
      reminders_paused: body.reminders_paused || false,
      is_emergency: body.is_emergency || false,
      christmas_list: body.christmas_list || false,
      notes: body.notes || null,
    }

    const contact = await ContactService.create(contactInput)

    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    console.error('Error creating contact:', error)
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    )
  }
}