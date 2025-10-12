/**
 * API Route: /api/learning/weeks/[weekNumber]/concepts
 *
 * GET - Fetch knowledge concepts for a week
 * POST - Add new concept
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

    // Fetch concepts
    const { data: concepts, error } = await supabase
      .from('knowledge_concepts')
      .select('*')
      .eq('week_id', week.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching concepts:', error)
      return NextResponse.json({ error: 'Failed to fetch concepts' }, { status: 500 })
    }

    return NextResponse.json(concepts || [])
  } catch (error) {
    console.error('Error in concepts route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
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

    // Create concept
    const { data: concept, error } = await supabase
      .from('knowledge_concepts')
      .insert({
        week_id: week.id,
        concept_name: body.concept_name,
        definition: body.definition,
        explanation: body.explanation,
        examples: body.examples,
        understanding_level: body.understanding_level || 1,
        times_reviewed: 0
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating concept:', error)
      return NextResponse.json({ error: 'Failed to create concept' }, { status: 500 })
    }

    return NextResponse.json(concept)
  } catch (error) {
    console.error('Error in concepts POST route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
