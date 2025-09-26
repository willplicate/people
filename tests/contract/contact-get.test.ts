import { describe, it, expect, beforeEach } from 'vitest'
import { supabase, TABLES } from '@/lib/supabase'

describe('Contract: GET Contact by ID', () => {
  let testContactId: string

  beforeEach(async () => {
    // Clean up test data
    await supabase.from(TABLES.CONTACTS).delete().neq('id', 'impossible-id'))
    
    // Create test contact
    const { data } = await supabase
      .from(TABLES.CONTACTS)
      .insert({
        first_name: 'John',
        last_name: 'Doe',
        nickname: 'JD',
        birthday: '06-15',
        communication_frequency: 'monthly',
        reminders_paused: false,
        notes: 'Test contact for GET by ID'
      })
      .select()
      .single()
    
    testContactId = data!.id
  })

  it('should return contact by valid ID', async () => {
    const { data, error } = await supabase
      .from(TABLES.CONTACTS)
      .select('*')
      .eq('id', testContactId)
      .single()

    expect(error).toBeNull()
    expect(data).toBeTruthy()
    expect(data!.id).toBe(testContactId)
    expect(data!.first_name).toBe('John')
    expect(data!.last_name).toBe('Doe')
    expect(data!.nickname).toBe('JD')
  })

  it('should return null for non-existent ID', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000'
    
    const { data, error } = await supabase
      .from(TABLES.CONTACTS)
      .select('*')
      .eq('id', nonExistentId)
      .maybeSingle()

    expect(error).toBeNull()
    expect(data).toBeNull()
  })

  it('should include contact info when requested', async () => {
    // Add contact info for the test contact
    await supabase
      .from(TABLES.CONTACT_INFO)
      .insert([
        {
          contact_id: testContactId,
          type: 'email',
          label: 'work',
          value: 'john@example.com',
          is_primary: true
        },
        {
          contact_id: testContactId,
          type: 'phone',
          label: 'mobile',
          value: '+1-555-0123',
          is_primary: true
        }
      ])

    const { data, error } = await supabase
      .from(TABLES.CONTACTS)
      .select(`
        *,
        contact_info:${TABLES.CONTACT_INFO}(*)
      `)
      .eq('id', testContactId)
      .single()

    expect(error).toBeNull()
    expect(data).toBeTruthy()
    expect(data!.contact_info).toHaveLength(2)
    expect(data!.contact_info.some((ci: any) => ci.type === 'email')).toBe(true)
    expect(data!.contact_info.some((ci: any) => ci.type === 'phone')).toBe(true)
  })

  it('should include recent interactions when requested', async () => {
    // Add interactions for the test contact
    await supabase
      .from(TABLES.INTERACTIONS)
      .insert([
        {
          contact_id: testContactId,
          type: 'call',
          notes: 'Caught up about work',
          interaction_date: new Date().toISOString()
        },
        {
          contact_id: testContactId,
          type: 'email',
          notes: 'Sent birthday wishes',
          interaction_date: new Date(Date.now() - 86400000).toISOString() // Yesterday
        }
      ])

    const { data, error } = await supabase
      .from(TABLES.CONTACTS)
      .select(`
        *,
        recent_interactions:${TABLES.INTERACTIONS}(*)
      `)
      .eq('id', testContactId)
      .single()

    expect(error).toBeNull()
    expect(data).toBeTruthy()
    expect(data!.recent_interactions).toHaveLength(2)
  })

  it('should handle invalid UUID format', async () => {
    const invalidId = 'not-a-valid-uuid'
    
    const { error } = await supabase
      .from(TABLES.CONTACTS)
      .select('*')
      .eq('id', invalidId)
      .single()

    expect(error).toBeTruthy()
    expect(error!.message).toContain('invalid input syntax for type uuid')
  })
})