import { describe, it, expect, beforeEach } from 'vitest'
import { supabase, TABLES } from '@/lib/supabase'

describe('Contract: GET Contact Info by Contact ID', () => {
  let testContactId: string

  beforeEach(async () => {
    // Clean up test data
    await supabase.from(TABLES.CONTACTS).delete().neq('id', 'impossible-id'))
    await supabase.from(TABLES.CONTACT_INFO).delete().neq('id', 'impossible-id'))
    
    // Create test contact
    const { data } = await supabase
      .from(TABLES.CONTACTS)
      .insert({
        first_name: 'John',
        last_name: 'Doe',
        reminders_paused: false
      })
      .select()
      .single()
    
    testContactId = data!.id
  })

  it('should return empty array when contact has no contact info', async () => {
    const { data, error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .select('*')
      .eq('contact_id', testContactId)

    expect(error).toBeNull()
    expect(data).toEqual([])
  })

  it('should return all contact info for valid contact ID', async () => {
    // Add contact info for the test contact
    const contactInfoData = [
      {
        contact_id: testContactId,
        type: 'email' as const,
        label: 'work' as const,
        value: 'john.doe@company.com',
        is_primary: true
      },
      {
        contact_id: testContactId,
        type: 'email' as const,
        label: 'home' as const,
        value: 'john@personal.com',
        is_primary: false
      },
      {
        contact_id: testContactId,
        type: 'phone' as const,
        label: 'mobile' as const,
        value: '+1-555-0123',
        is_primary: true
      },
      {
        contact_id: testContactId,
        type: 'address' as const,
        label: 'home' as const,
        value: '123 Main St, Anytown, AN 12345',
        is_primary: true
      }
    ]

    await supabase.from(TABLES.CONTACT_INFO).insert(contactInfoData)

    const { data, error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .select('*')
      .eq('contact_id', testContactId)
      .order('created_at', { ascending: true })

    expect(error).toBeNull()
    expect(data).toHaveLength(4)

    // Verify schema structure for each contact info record
    data!.forEach(contactInfo => {
      expect(contactInfo).toHaveProperty('id')
      expect(contactInfo).toHaveProperty('contact_id')
      expect(contactInfo).toHaveProperty('type')
      expect(contactInfo).toHaveProperty('label')
      expect(contactInfo).toHaveProperty('value')
      expect(contactInfo).toHaveProperty('is_primary')
      expect(contactInfo).toHaveProperty('created_at')
      expect(contactInfo).toHaveProperty('updated_at')

      expect(typeof contactInfo.id).toBe('string')
      expect(contactInfo.contact_id).toBe(testContactId)
      expect(['phone', 'email', 'address']).toContain(contactInfo.type)
      expect(['home', 'work', 'mobile', 'other']).toContain(contactInfo.label)
      expect(typeof contactInfo.value).toBe('string')
      expect(typeof contactInfo.is_primary).toBe('boolean')
    })
  })

  it('should filter contact info by type', async () => {
    // Add mixed contact info
    await supabase.from(TABLES.CONTACT_INFO).insert([
      { contact_id: testContactId, type: 'email', label: 'work', value: 'work@test.com', is_primary: true },
      { contact_id: testContactId, type: 'phone', label: 'mobile', value: '+1-555-0123', is_primary: true },
      { contact_id: testContactId, type: 'email', label: 'home', value: 'home@test.com', is_primary: false }
    ])

    // Filter by email type
    const { data, error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .select('*')
      .eq('contact_id', testContactId)
      .eq('type', 'email')

    expect(error).toBeNull()
    expect(data).toHaveLength(2)
    data!.forEach(info => {
      expect(info.type).toBe('email')
    })
  })

  it('should filter contact info by primary status', async () => {
    // Add contact info with mixed primary status
    await supabase.from(TABLES.CONTACT_INFO).insert([
      { contact_id: testContactId, type: 'email', label: 'work', value: 'primary@test.com', is_primary: true },
      { contact_id: testContactId, type: 'email', label: 'home', value: 'secondary@test.com', is_primary: false },
      { contact_id: testContactId, type: 'phone', label: 'mobile', value: '+1-555-0123', is_primary: true }
    ])

    // Filter by primary status
    const { data, error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .select('*')
      .eq('contact_id', testContactId)
      .eq('is_primary', true)

    expect(error).toBeNull()
    expect(data).toHaveLength(2)
    data!.forEach(info => {
      expect(info.is_primary).toBe(true)
    })
  })

  it('should return empty array for non-existent contact ID', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000'

    const { data, error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .select('*')
      .eq('contact_id', nonExistentId)

    expect(error).toBeNull()
    expect(data).toEqual([])
  })

  it('should handle invalid UUID format for contact ID', async () => {
    const invalidId = 'not-a-valid-uuid'
    
    const { error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .select('*')
      .eq('contact_id', invalidId)

    expect(error).toBeTruthy()
    expect(error!.message).toContain('invalid input syntax for type uuid')
  })

  it('should sort contact info by creation date', async () => {
    const firstInfo = { contact_id: testContactId, type: 'email' as const, label: 'work' as const, value: 'first@test.com', is_primary: true }
    const secondInfo = { contact_id: testContactId, type: 'phone' as const, label: 'mobile' as const, value: '+1-555-0123', is_primary: true }
    
    // Insert in order
    await supabase.from(TABLES.CONTACT_INFO).insert(firstInfo)
    await new Promise(resolve => setTimeout(resolve, 100)) // Ensure different timestamps
    await supabase.from(TABLES.CONTACT_INFO).insert(secondInfo)

    const { data, error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .select('*')
      .eq('contact_id', testContactId)
      .order('created_at', { ascending: true })

    expect(error).toBeNull()
    expect(data).toHaveLength(2)
    expect(data![0].value).toBe('first@test.com')
    expect(data![1].value).toBe('+1-555-0123')
  })

  it('should handle database connection errors gracefully', async () => {
    // This test would fail if Supabase is not properly configured
    const { error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .select('count(*)')
      .eq('contact_id', testContactId)

    expect(error).toBeNull()
  })
})