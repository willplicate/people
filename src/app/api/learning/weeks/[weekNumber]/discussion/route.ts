/**
 * API Route: /api/learning/weeks/[weekNumber]/discussion
 *
 * GET - Fetch project discussion for a week
 * PUT - Update discussion
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
      return NextResponse.json({ error: 'Invalid week number' }, { status: 400 })
    }

    // Get week ID
    const { data: week, error: weekError } = await supabase
      .from('learning_weeks')
      .select('id')
      .eq('week_number', weekNum)
      .single()

    if (weekError || !week) {
      return NextResponse.json({ error: 'Week not found' }, { status: 404 })
    }

    // Fetch discussion
    const { data: discussion, error } = await supabase
      .from('project_discussions')
      .select('*')
      .eq('week_id', week.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error fetching discussion:', error)
      return NextResponse.json({ error: 'Failed to fetch discussion' }, { status: 500 })
    }

    return NextResponse.json(discussion || null)
  } catch (error) {
    console.error('Error in discussion route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ weekNumber: string }> }
) {
  try {
    const { weekNumber } = await params
    const weekNum = parseInt(weekNumber)

    if (isNaN(weekNum)) {
      return NextResponse.json({ error: 'Invalid week number' }, { status: 400 })
    }

    // Get week ID
    const { data: week, error: weekError } = await supabase
      .from('learning_weeks')
      .select('id')
      .eq('week_number', weekNum)
      .single()

    if (weekError || !week) {
      return NextResponse.json({ error: 'Week not found' }, { status: 404 })
    }

    const body = await request.json()

    // Update discussion
    const { data: discussion, error } = await supabase
      .from('project_discussions')
      .update({
        status: body.status,
        project_idea: body.project_idea,
        claude_feedback: body.claude_feedback,
        refined_approach: body.refined_approach,
        implementation_notes: body.implementation_notes,
        confidence_level: body.confidence_level,
        estimated_hours: body.estimated_hours
      })
      .eq('week_id', week.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating discussion:', error)
      return NextResponse.json({ error: 'Failed to update discussion' }, { status: 500 })
    }

    return NextResponse.json(discussion)
  } catch (error) {
    console.error('Error in discussion PUT route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
