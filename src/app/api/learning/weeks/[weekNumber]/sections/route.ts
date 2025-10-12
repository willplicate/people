/**
 * API Route: GET /api/learning/weeks/[weekNumber]/sections
 *
 * Fetches the three sections for a specific week:
 * 1. Study Focus (Monday-Tuesday)
 * 2. Practical Experiments (Wednesday-Saturday)
 * 3. Knowledge Check (Sunday)
 */

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ weekNumber: string }> }
) {
  try {
    const { weekNumber } = await params
    const weekNum = parseInt(weekNumber)

    if (isNaN(weekNum)) {
      return NextResponse.json(
        { error: 'Invalid week number' },
        { status: 400 }
      )
    }

    // Get the week ID first
    const { data: week, error: weekError } = await supabase
      .from('learning_weeks')
      .select('id')
      .eq('week_number', weekNum)
      .single()

    if (weekError || !week) {
      return NextResponse.json(
        { error: 'Week not found' },
        { status: 404 }
      )
    }

    // Fetch sections for this week, ordered by section_order
    const { data: sections, error: sectionsError } = await supabase
      .from('week_sections')
      .select('*')
      .eq('week_id', week.id)
      .order('section_order', { ascending: true })

    if (sectionsError) {
      console.error('Error fetching sections:', sectionsError)
      return NextResponse.json(
        { error: 'Failed to fetch sections' },
        { status: 500 }
      )
    }

    return NextResponse.json(sections || [])

  } catch (error) {
    console.error('Error in sections route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
