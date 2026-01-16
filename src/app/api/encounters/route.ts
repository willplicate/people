import { NextRequest, NextResponse } from 'next/server'
import { PersonalEncounterService } from '@/services/PersonalEncounterService'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam) : 5

    const encounters = await PersonalEncounterService.getRecent(limit)

    return NextResponse.json({ encounters })

  } catch (error) {
    console.error('Get encounters error:', error)
    return NextResponse.json(
      { error: 'Failed to get encounters' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, encounter_date, partner_description, location, private_notes } = body

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    if (!encounter_date) {
      return NextResponse.json(
        { error: 'encounter_date is required' },
        { status: 400 }
      )
    }

    // Validate date format
    const date = new Date(encounter_date)
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format for encounter_date' },
        { status: 400 }
      )
    }

    // Create the encounter
    const encounter = await PersonalEncounterService.create({
      encounter_date,
      partner_description: partner_description?.trim() || undefined,
      location: location?.trim() || undefined,
      private_notes: private_notes?.trim() || undefined
    }, userId)

    return NextResponse.json({ encounter })

  } catch (error) {
    console.error('Create encounter error:', error)
    return NextResponse.json(
      { error: 'Failed to create encounter' },
      { status: 500 }
    )
  }
}
