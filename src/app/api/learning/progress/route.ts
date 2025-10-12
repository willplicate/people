/**
 * GET /api/learning/progress
 *
 * Returns week progress for the active program
 */

import { NextResponse } from 'next/server'
import { ProgramService, ProgressService } from '@/services/LMSService'

export async function GET() {
  try {
    // Get active program first
    const program = await ProgramService.getActiveProgram()

    if (!program) {
      return NextResponse.json(
        { error: 'No active program found' },
        { status: 404 }
      )
    }

    // Get progress for all weeks
    const progress = await ProgressService.getWeekProgress(program.id)

    return NextResponse.json(progress)
  } catch (error) {
    console.error('Error in GET /api/learning/progress:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch progress' },
      { status: 500 }
    )
  }
}
