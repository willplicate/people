import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST /api/meetings/update-notes
// Body: { meetingId: string, notes: string }
// Used to save Granola meeting notes into the database
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { meetingId, notes } = body

    if (!meetingId || !notes) {
      return NextResponse.json(
        { success: false, error: 'meetingId and notes are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('meetings')
      .update({ notes, updated_at: new Date().toISOString() })
      .eq('id', meetingId)
      .select('id, summary, notes')
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, meeting: data })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// GET /api/meetings/update-notes
// Returns all meetings and their notes status (for identifying which need syncing)
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('meetings')
      .select('id, summary, event_id, start_time, notes, source')
      .eq('source', 'granola_mcp')
      .order('start_time', { ascending: false })

    if (error) throw error

    const meetings = (data || []).map((m) => ({
      id: m.id,
      summary: m.summary,
      event_id: m.event_id,
      start_time: m.start_time,
      granola_document_id: m.event_id?.replace('granola_', ''),
      has_notes: !!(m.notes && !m.notes.startsWith('Granola meeting ID:')),
      notes_preview: m.notes ? m.notes.slice(0, 100) : null,
    }))

    return NextResponse.json({ success: true, meetings })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
