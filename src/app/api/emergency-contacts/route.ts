import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // First try to get emergency contacts with their contact info
    const { data: contacts, error } = await supabase
      .from('personal_contacts')
      .select(`
        *,
        contactInfo:personal_contact_info(*)
      `)
      .eq('is_emergency', true)
      .order('first_name', { ascending: true })

    if (error) {
      console.error('Database error in emergency contacts:', error)
      // If error mentions is_emergency column doesn't exist, return helpful error
      if (error.message.includes('is_emergency') || error.message.includes('column')) {
        return NextResponse.json({
          error: 'Database migration needed. Please run: ALTER TABLE personal_contacts ADD COLUMN is_emergency BOOLEAN DEFAULT false;',
          migrationRequired: true
        }, { status: 500 })
      }
      throw new Error(`Failed to fetch emergency contacts: ${error.message}`)
    }

    console.log('Emergency contacts query result:', {
      count: contacts?.length || 0,
      contacts: contacts?.map(c => ({ id: c.id, name: c.first_name, emergency: c.is_emergency })) || []
    })

    return NextResponse.json({
      contacts: contacts || []
    })
  } catch (error) {
    console.error('Error fetching emergency contacts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch emergency contacts' },
      { status: 500 }
    )
  }
}