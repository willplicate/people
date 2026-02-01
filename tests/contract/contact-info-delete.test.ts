import { describe, it, expect, beforeEach } from 'vitest'
import { supabase, TABLES } from '@/lib/supabase'

describe('Contract: DELETE Contact Info by ID', () => {
  let testContactId: string
  let testContactInfoId: string

  beforeEach(async () => {
    // Clean up test data
    await supabase.from(TABLES.CONTACTS).delete().neq('id', 'impossible-id'))
    await supabase.from(TABLES.CONTACT_INFO).delete().neq('id', 'impossible-id'))
    
    // Create test contact
    const { data: contact } = await supabase
      .from(TABLES.CONTACTS)
      .insert({
        first_name: 'John',
        last_name: 'Doe',
        reminders_paused: false
      })
      .select()
      .single()
    
    testContactId = contact!.id

    // Create test contact info
    const { data: contactInfo } = await supabase
      .from(TABLES.CONTACT_INFO)
      .insert({
        contact_id: testContactId,
        type: 'email',
        label: 'work',
        value: 'john@company.com',
        is_primary: true
      })
      .select()
      .single()

    testContactInfoId = contactInfo!.id
  })

  it('should delete contact info by valid ID', async () => {
    const { data, error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .delete()
      .eq('id', testContactInfoId)
      .select()

    expect(error).toBeNull()
    expect(data).toHaveLength(1)
    expect(data![0].id).toBe(testContactInfoId)

    // Verify contact info is actually deleted
    const { data: verification } = await supabase
      .from(TABLES.CONTACT_INFO)
      .select('*')
      .eq('id', testContactInfoId)
      .maybeSingle()

    expect(verification).toBeNull()
  })

  it('should not affect parent contact when deleting contact info', async () => {
    // Delete contact info
    await supabase
      .from(TABLES.CONTACT_INFO)
      .delete()
      .eq('id', testContactInfoId)

    // Verify parent contact still exists
    const { data: contact, error } = await supabase
      .from(TABLES.CONTACTS)
      .select('*')
      .eq('id', testContactId)
      .single()

    expect(error).toBeNull()
    expect(contact).toBeTruthy()
    expect(contact!.first_name).toBe('John')
  })

  it('should handle deletion of primary contact info', async () => {
    // Create additional non-primary contact info
    const { data: secondary } = await supabase
      .from(TABLES.CONTACT_INFO)
      .insert({
        contact_id: testContactId,
        type: 'email',
        label: 'home',
        value: 'john@home.com',
        is_primary: false
      })
      .select()
      .single()

    // Delete the primary contact info
    const { data, error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .delete()
      .eq('id', testContactInfoId)
      .select()

    expect(error).toBeNull()
    expect(data![0].is_primary).toBe(true) // Confirms we deleted the primary

    // Verify secondary contact info still exists
    const { data: remaining } = await supabase
      .from(TABLES.CONTACT_INFO)
      .select('*')
      .eq('contact_id', testContactId)

    expect(remaining).toHaveLength(1)
    expect(remaining![0].id).toBe(secondary!.id)
  })

  it('should delete multiple contact info entries', async () => {
    // Create additional contact info
    const additionalContactInfo = [
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

    const { data: inserted } = await supabase
      .from(TABLES.CONTACT_INFO)
      .insert(additionalContactInfo)
      .select()

    // Delete multiple by contact_id (simulating batch delete)
    const { data, error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .delete()
      .eq('contact_id', testContactId)
      .select()

    expect(error).toBeNull()
    expect(data).toHaveLength(3) // Original + 2 additional

    // Verify all contact info is deleted
    const { data: verification } = await supabase
      .from(TABLES.CONTACT_INFO)
      .select('*')
      .eq('contact_id', testContactId)

    expect(verification).toHaveLength(0)
  })

  it('should return empty array for non-existent ID', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000'

    const { data, error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .delete()
      .eq('id', nonExistentId)
      .select()

    expect(error).toBeNull()
    expect(data).toEqual([]) // No rows deleted
  })

  it('should handle invalid UUID format', async () => {
    const invalidId = 'not-a-valid-uuid'
    
    const { error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .delete()
      .eq('id', invalidId)

    expect(error).toBeTruthy()
    expect(error!.message).toContain('invalid input syntax for type uuid')
  })

  it('should delete by contact_id and type combination', async () => {
    // Create multiple contact info entries
    await supabase.from(TABLES.CONTACT_INFO).insert([
      { contact_id: testContactId, type: 'phone', label: 'mobile', value: '+1-555-0123', is_primary: true },
      { contact_id: testContactId, type: 'phone', label: 'work', value: '+1-555-0456', is_primary: false }
    ])

    // Delete all phone numbers for this contact
    const { data, error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .delete()
      .eq('contact_id', testContactId)
      .eq('type', 'phone')
      .select()

    expect(error).toBeNull()
    expect(data).toHaveLength(2) // Both phone numbers deleted

    // Verify email contact info still exists
    const { data: remaining } = await supabase
      .from(TABLES.CONTACT_INFO)
      .select('*')
      .eq('contact_id', testContactId)

    expect(remaining).toHaveLength(1)
    expect(remaining![0].type).toBe('email')
  })

  it('should delete by primary status', async () => {
    // Create additional non-primary contact info
    await supabase.from(TABLES.CONTACT_INFO).insert([
      { contact_id: testContactId, type: 'email', label: 'home', value: 'home@test.com', is_primary: false },
      { contact_id: testContactId, type: 'phone', label: 'mobile', value: '+1-555-0123', is_primary: true }
    ])

    // Delete all primary contact info for this contact
    const { data, error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .delete()
      .eq('contact_id', testContactId)
      .eq('is_primary', true)
      .select()

    expect(error).toBeNull()
    expect(data).toHaveLength(2) // Original primary email + primary phone

    // Verify non-primary contact info still exists
    const { data: remaining } = await supabase
      .from(TABLES.CONTACT_INFO)
      .select('*')
      .eq('contact_id', testContactId)

    expect(remaining).toHaveLength(1)
    expect(remaining![0].is_primary).toBe(false)
    expect(remaining![0].value).toBe('home@test.com')
  })

  it('should handle concurrent deletions gracefully', async () => {
    // Create multiple contact info entries
    const { data: multipleInfo } = await supabase
      .from(TABLES.CONTACT_INFO)
      .insert([
        { contact_id: testContactId, type: 'phone', label: 'mobile', value: '+1-555-0123', is_primary: false },
        { contact_id: testContactId, type: 'address', label: 'home', value: '123 Main St', is_primary: false }
      ])
      .select()

    // Simulate concurrent deletion attempts
    const deletePromises = [
      supabase.from(TABLES.CONTACT_INFO).delete().eq('id', testContactInfoId),
      supabase.from(TABLES.CONTACT_INFO).delete().eq('id', multipleInfo![0].id),
      supabase.from(TABLES.CONTACT_INFO).delete().eq('id', multipleInfo![1].id)
    ]

    const results = await Promise.all(deletePromises)
    
    results.forEach(result => {
      expect(result.error).toBeNull()
    })

    // Verify all contact info is deleted
    const { data: remaining } = await supabase
      .from(TABLES.CONTACT_INFO)
      .select('*')
      .eq('contact_id', testContactId)

    expect(remaining).toHaveLength(0)
  })

  it('should complete deletion in reasonable time', async () => {
    const startTime = Date.now()
    
    await supabase
      .from(TABLES.CONTACT_INFO)
      .delete()
      .eq('id', testContactInfoId)
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    expect(duration).toBeLessThan(2000) // Should complete within 2 seconds
  })
})