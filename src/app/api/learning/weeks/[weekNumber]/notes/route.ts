/**
 * API Route: /api/learning/weeks/[weekNumber]/notes
 *
 * GET - Fetch notes for a week
 * POST - Add new note
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

    // Fetch notes
    const { data: notes, error } = await supabase
      .from('week_notes')
      .select('*')
      .eq('week_id', week.id)
      .order('note_date', { ascending: false })

    if (error) {
      console.error('Error fetching notes:', error)
      return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
    }

    return NextResponse.json(notes || [])
  } catch (error) {
    console.error('Error in notes route:', error)
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

    // Create note
    const { data: note, error } = await supabase
      .from('week_notes')
      .insert({
        week_id: week.id,
        note_date: body.note_date || new Date().toISOString().split('T')[0],
        content: body.content,
        note_type: body.note_type || 'general',
        tags: body.tags || []
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating note:', error)
      return NextResponse.json({ error: 'Failed to create note' }, { status: 500 })
    }

    return NextResponse.json(note)
  } catch (error) {
    console.error('Error in notes POST route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
