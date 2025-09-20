import { NextRequest, NextResponse } from 'next/server'
import { ContactService } from '@/services/ContactService'
import { UpdateContactInput } from '@/types/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const contact = await ContactService.getById(id)

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(contact)
  } catch (error) {
    console.error('Error fetching contact:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contact' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check if contact exists
    const existingContact = await ContactService.getById(id)
    if (!existingContact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    const updateInput: UpdateContactInput = {
      first_name: body.first_name,
      last_name: body.last_name,
      nickname: body.nickname,
      birthday: body.birthday,
      communication_frequency: body.communication_frequency,
      reminders_paused: body.reminders_paused,
      is_emergency: body.is_emergency,
      notes: body.notes,
      last_contacted_at: body.last_contacted_at === "" ? null : body.last_contacted_at,
    }

    // Remove undefined values to avoid overwriting with undefined
    Object.keys(updateInput).forEach(key => {
      if (updateInput[key as keyof UpdateContactInput] === undefined) {
        delete updateInput[key as keyof UpdateContactInput]
      }
    })

    const updatedContact = await ContactService.update(id, updateInput)

    return NextResponse.json(updatedContact)
  } catch (error) {
    console.error('Error updating contact:', error)
    return NextResponse.json(
      { error: 'Failed to update contact' },
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
    // Check if contact exists
    const existingContact = await ContactService.getById(id)
    if (!existingContact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    await ContactService.delete(id)

    return NextResponse.json({ message: 'Contact deleted successfully' })
  } catch (error) {
    console.error('Error deleting contact:', error)
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    )
  }
}