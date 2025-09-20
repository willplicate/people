import { NextRequest, NextResponse } from 'next/server'
import { InteractionService } from '@/services/InteractionService'
import { CreateInteractionInput } from '@/types/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined

    const interactions = await InteractionService.getByContactId(id, { limit, offset })

    return NextResponse.json(interactions)
  } catch (error) {
    console.error('Error fetching interactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch interactions' },
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

    const interactionInput: CreateInteractionInput = {
      contact_id: id,
      type: body.type,
      notes: body.notes || null,
      interaction_date: body.interaction_date || new Date().toISOString(),
    }

    const interaction = await InteractionService.create(interactionInput)

    return NextResponse.json(interaction, { status: 201 })
  } catch (error) {
    console.error('Error creating interaction:', error)
    return NextResponse.json(
      { error: 'Failed to create interaction' },
      { status: 500 }
    )
  }
}