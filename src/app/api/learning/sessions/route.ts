/**
 * POST /api/learning/sessions
 *
 * Creates a new learning session
 */

import { NextResponse } from 'next/server'
import { SessionService } from '@/services/LMSService'
import { CreateSessionInput } from '@/types/lms'

export async function POST(request: Request) {
  try {
    const body = await request.json() as CreateSessionInput

    // Validate required fields
    if (!body.program_id || !body.week_id || !body.session_date) {
      return NextResponse.json(
        { error: 'Missing required fields: program_id, week_id, session_date' },
        { status: 400 }
      )
    }

    const session = await SessionService.create(body)

    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/learning/sessions:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create session' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/learning/sessions
 *
 * Returns recent learning sessions (using the view)
 */
export async function GET() {
  try {
    const sessions = await SessionService.getRecent(20)

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Error in GET /api/learning/sessions:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}
