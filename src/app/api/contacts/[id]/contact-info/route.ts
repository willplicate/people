import { NextRequest, NextResponse } from 'next/server'
import { ContactInfoService } from '@/services/ContactInfoService'
import { CreateContactInfoInput } from '@/types/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const contactInfo = await ContactInfoService.getByContactId(id)

    return NextResponse.json(contactInfo)
  } catch (error) {
    console.error('Error fetching contact info:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contact info' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Validate required fields
    if (!body.type) {
      return NextResponse.json(
        { error: 'type is required' },
        { status: 400 }
      )
    }

    if (!body.value) {
      return NextResponse.json(
        { error: 'value is required' },
        { status: 400 }
      )
    }

    const contactInfoInput: CreateContactInfoInput = {
      contact_id: id,
      type: body.type,
      value: body.value,
      label: body.label || null,
      is_primary: body.is_primary || false,
    }

    const contactInfo = await ContactInfoService.create(contactInfoInput)

    return NextResponse.json(contactInfo, { status: 201 })
  } catch (error) {
    console.error('Error creating contact info:', error)
    return NextResponse.json(
      { error: 'Failed to create contact info' },
      { status: 500 }
    )
  }
}