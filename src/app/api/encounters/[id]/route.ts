import { NextRequest, NextResponse } from 'next/server'
import { PersonalEncounterService } from '@/services/PersonalEncounterService'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Validate UUID format (basic check)
    if (!id || id.length < 10) {
      return NextResponse.json(
        { error: 'Invalid encounter ID' },
        { status: 400 }
      )
    }

    const encounter = await PersonalEncounterService.getById(id)

    if (!encounter) {
      return NextResponse.json(
        { error: 'Encounter not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ encounter })

  } catch (error) {
    console.error('Get encounter error:', error)
    return NextResponse.json(
      { error: 'Failed to get encounter' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await req.json()

    // Validate UUID format (basic check)
    if (!id || id.length < 10) {
      return NextResponse.json(
        { error: 'Invalid encounter ID' },
        { status: 400 }
      )
    }

    // Validate date format if provided
    if (body.encounter_date) {
      const date = new Date(body.encounter_date)
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format for encounter_date' },
          { status: 400 }
        )
      }
    }

    // Sanitize inputs
    const updateData: any = {}
    if (body.encounter_date !== undefined) updateData.encounter_date = body.encounter_date
    if (body.partner_description !== undefined) updateData.partner_description = body.partner_description?.trim() || null
    if (body.location !== undefined) updateData.location = body.location?.trim() || null
    if (body.private_notes !== undefined) updateData.private_notes = body.private_notes?.trim() || null

    const encounter = await PersonalEncounterService.update(id, updateData)

    return NextResponse.json({ encounter })

  } catch (error) {
    console.error('Update encounter error:', error)
    return NextResponse.json(
      { error: 'Failed to update encounter' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Validate UUID format (basic check)
    if (!id || id.length < 10) {
      return NextResponse.json(
        { error: 'Invalid encounter ID' },
        { status: 400 }
      )
    }

    await PersonalEncounterService.delete(id)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete encounter error:', error)
    return NextResponse.json(
      { error: 'Failed to delete encounter' },
      { status: 500 }
    )
  }
}
