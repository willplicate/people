import { NextRequest, NextResponse } from 'next/server'
import { InteractionService } from '@/services/InteractionService'
import { UpdateInteractionInput } from '@/types/database'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()

    // Check if interaction exists
    const existingInteraction = await InteractionService.getById((await params).id)
    if (!existingInteraction) {
      return NextResponse.json(
        { error: 'Interaction not found' },
        { status: 404 }
      )
    }

    const updateInput: UpdateInteractionInput = {
      type: body.type,
      notes: body.notes,
      interaction_date: body.interaction_date,
    }

    // Remove undefined values to avoid overwriting with undefined
    Object.keys(updateInput).forEach(key => {
      if (updateInput[key as keyof UpdateInteractionInput] === undefined) {
        delete updateInput[key as keyof UpdateInteractionInput]
      }
    })

    const updatedInteraction = await InteractionService.update((await params).id, updateInput)

    return NextResponse.json(updatedInteraction)
  } catch (error) {
    console.error('Error updating interaction:', error)
    return NextResponse.json(
      { error: 'Failed to update interaction' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if interaction exists
    const existingInteraction = await InteractionService.getById((await params).id)
    if (!existingInteraction) {
      return NextResponse.json(
        { error: 'Interaction not found' },
        { status: 404 }
      )
    }

    await InteractionService.delete((await params).id)

    return NextResponse.json({ message: 'Interaction deleted successfully' })
  } catch (error) {
    console.error('Error deleting interaction:', error)
    return NextResponse.json(
      { error: 'Failed to delete interaction' },
      { status: 500 }
    )
  }
}