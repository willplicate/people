/**
 * GET /api/learning/weeks/[weekNumber]/sessions
 *
 * Returns recent sessions for a specific week
 */

import { NextResponse } from 'next/server'
import { ProgramService, WeekService, SessionService } from '@/services/LMSService'

interface RouteContext {
  params: Promise<{
    weekNumber: string
  }>
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { weekNumber } = await context.params
    const weekNum = parseInt(weekNumber)

    if (isNaN(weekNum)) {
      return NextResponse.json(
        { error: 'Invalid week number' },
        { status: 400 }
      )
    }

    // Get active program
    const program = await ProgramService.getActiveProgram()

    if (!program) {
      return NextResponse.json(
        { error: 'No active program found' },
        { status: 404 }
      )
    }

    // Get week
    const week = await WeekService.getByWeekNumber(program.id, weekNum)

    if (!week) {
      return NextResponse.json(
        { error: `Week ${weekNum} not found` },
        { status: 404 }
      )
    }

    // Get sessions for this week
    const sessions = await SessionService.getByWeek(week.id)

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Error in GET /api/learning/weeks/[weekNumber]/sessions:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}
