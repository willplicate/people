import { NextRequest, NextResponse } from 'next/server'
import { ContactInfoService } from '@/services/ContactInfoService'
import { UpdateContactInfoInput } from '@/types/database'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()

    // Check if contact info exists
    const existingContactInfo = await ContactInfoService.getById((await params).id)
    if (!existingContactInfo) {
      return NextResponse.json(
        { error: 'Contact info not found' },
        { status: 404 }
      )
    }

    const updateInput: UpdateContactInfoInput = {
      type: body.type,
      value: body.value,
      label: body.label,
      is_primary: body.is_primary,
    }

    // Remove undefined values to avoid overwriting with undefined
    Object.keys(updateInput).forEach(key => {
      if (updateInput[key as keyof UpdateContactInfoInput] === undefined) {
        delete updateInput[key as keyof UpdateContactInfoInput]
      }
    })

    const updatedContactInfo = await ContactInfoService.update((await params).id, updateInput)

    return NextResponse.json(updatedContactInfo)
  } catch (error) {
    console.error('Error updating contact info:', error)
    return NextResponse.json(
      { error: 'Failed to update contact info' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if contact info exists
    const existingContactInfo = await ContactInfoService.getById((await params).id)
    if (!existingContactInfo) {
      return NextResponse.json(
        { error: 'Contact info not found' },
        { status: 404 }
      )
    }

    await ContactInfoService.delete((await params).id)

    return NextResponse.json({ message: 'Contact info deleted successfully' })
  } catch (error) {
    console.error('Error deleting contact info:', error)
    return NextResponse.json(
      { error: 'Failed to delete contact info' },
      { status: 500 }
    )
  }
}