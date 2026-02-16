import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('source', 'granola_mcp')
      .order('start_time', { ascending: false })
      .limit(1)
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      meeting: data,
      fields: Object.keys(data || {})
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
