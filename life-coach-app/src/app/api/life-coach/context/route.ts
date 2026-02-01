import { NextRequest, NextResponse } from 'next/server'
import { supabase, TABLES } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('life_coach_context')
      .select('*')

    if (error) throw error

    const context: Record<string, string> = {}
    data?.forEach(row => {
      context[row.key] = row.content
    })

    return NextResponse.json(context)
  } catch (error) {
    console.error('Error fetching context:', error)
    return NextResponse.json(
      { error: 'Failed to fetch context' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { key, content } = body

    if (!key || !content) {
      return NextResponse.json(
        { error: 'key and content are required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('life_coach_context')
      .upsert({
        key,
        content,
        updated_at: new Date().toISOString()
      })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving context:', error)
    return NextResponse.json(
      { error: 'Failed to save context' },
      { status: 500 }
    )
  }
}
