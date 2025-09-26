import { describe, it, expect, beforeEach } from 'vitest'
import { supabase, TABLES } from '@/lib/supabase'

describe('Contract: DELETE Contact by ID', () => {
  let testContactId: string

  beforeEach(async () => {
    // Clean up test data
    await supabase.from(TABLES.CONTACTS).delete().neq('id', 'impossible-id'))
    await supabase.from(TABLES.CONTACT_INFO).delete().neq('id', 'impossible-id'))
    await supabase.from(TABLES.INTERACTIONS).delete().neq('id', 'impossible-id'))
    await supabase.from(TABLES.REMINDERS).delete().neq('id', 'impossible-id'))
    
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
        notes: 'Test contact for deletion'
      })
      .select()
      .single()
    
    testContactId = data!.id
  })

  it('should delete contact by valid ID', async () => {
    const { data, error } = await supabase
      .from(TABLES.CONTACTS)
      .delete()
      .eq('id', testContactId)
      .select()

    expect(error).toBeNull()
    expect(data).toHaveLength(1)
    expect(data![0].id).toBe(testContactId)

    // Verify contact is actually deleted
    const { data: verification } = await supabase
      .from(TABLES.CONTACTS)
      .select('*')
      .eq('id', testContactId)
      .maybeSingle()

    expect(verification).toBeNull()
  })

  it('should cascade delete related contact info', async () => {
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

    // Delete the contact
    await supabase
      .from(TABLES.CONTACTS)
      .delete()
      .eq('id', testContactId)

    // Verify contact info is also deleted (cascade delete)
    const { data: contactInfo } = await supabase
      .from(TABLES.CONTACT_INFO)
      .select('*')
      .eq('contact_id', testContactId)

    expect(contactInfo).toHaveLength(0)
  })

  it('should cascade delete related interactions', async () => {
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
          interaction_date: new Date(Date.now() - 86400000).toISOString()
        }
      ])

    // Delete the contact
    await supabase
      .from(TABLES.CONTACTS)
      .delete()
      .eq('id', testContactId)

    // Verify interactions are also deleted (cascade delete)
    const { data: interactions } = await supabase
      .from(TABLES.INTERACTIONS)
      .select('*')
      .eq('contact_id', testContactId)

    expect(interactions).toHaveLength(0)
  })

  it('should cascade delete related reminders', async () => {
    // Add reminders for the test contact
    await supabase
      .from(TABLES.REMINDERS)
      .insert([
        {
          contact_id: testContactId,
          type: 'communication',
          scheduled_for: new Date(Date.now() + 86400000).toISOString(),
          status: 'pending',
          message: 'Time to reach out to John'
        },
        {
          contact_id: testContactId,
          type: 'birthday_week',
          scheduled_for: new Date(Date.now() + 604800000).toISOString(),
          status: 'pending',
          message: 'John\'s birthday is coming up'
        }
      ])

    // Delete the contact
    await supabase
      .from(TABLES.CONTACTS)
      .delete()
      .eq('id', testContactId)

    // Verify reminders are also deleted (cascade delete)
    const { data: reminders } = await supabase
      .from(TABLES.REMINDERS)
      .select('*')
      .eq('contact_id', testContactId)

    expect(reminders).toHaveLength(0)
  })

  it('should return empty array for non-existent ID', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000'

    const { data, error } = await supabase
      .from(TABLES.CONTACTS)
      .delete()
      .eq('id', nonExistentId)
      .select()

    expect(error).toBeNull()
    expect(data).toEqual([]) // No rows deleted
  })

  it('should handle invalid UUID format', async () => {
    const invalidId = 'not-a-valid-uuid'
    
    const { error } = await supabase
      .from(TABLES.CONTACTS)
      .delete()
      .eq('id', invalidId)

    expect(error).toBeTruthy()
    expect(error!.message).toContain('invalid input syntax for type uuid')
  })

  it('should complete deletion in reasonable time', async () => {
    const startTime = Date.now()
    
    await supabase
      .from(TABLES.CONTACTS)
      .delete()
      .eq('id', testContactId)
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    expect(duration).toBeLessThan(2000) // Should complete within 2 seconds
  })
})