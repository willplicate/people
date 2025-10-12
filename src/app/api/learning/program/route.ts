/**
 * GET /api/learning/program
 *
 * Returns the active learning program
 */

import { NextResponse } from 'next/server'
import { ProgramService } from '@/services/LMSService'

export async function GET() {
  try {
    const program = await ProgramService.getActiveProgram()

    if (!program) {
      return NextResponse.json(
        { error: 'No active program found' },
        { status: 404 }
      )
    }

    return NextResponse.json(program)
  } catch (error) {
    console.error('Error in GET /api/learning/program:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch program' },
      { status: 500 }
    )
  }
}
