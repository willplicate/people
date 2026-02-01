import { describe, it, expect, beforeEach } from 'vitest'
import { supabase, TABLES } from '@/lib/supabase'
import type { UpdateContactInput } from '@/types/database'

describe('Contract: PUT Contact by ID', () => {
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
        notes: 'Original notes'
      })
      .select()
      .single()
    
    testContactId = data!.id
  })

  it('should update contact with partial data', async () => {
    const updates: UpdateContactInput = {
      last_name: 'Smith',
      notes: 'Updated notes'
    }

    const { data, error } = await supabase
      .from(TABLES.CONTACTS)
      .update(updates)
      .eq('id', testContactId)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeTruthy()
    expect(data!.first_name).toBe('John') // Unchanged
    expect(data!.last_name).toBe('Smith') // Updated
    expect(data!.notes).toBe('Updated notes') // Updated
    expect(data!.updated_at).toBeTruthy()
  })

  it('should update communication frequency', async () => {
    const updates = {
      communication_frequency: 'weekly'
    }

    const { data, error } = await supabase
      .from(TABLES.CONTACTS)
      .update(updates)
      .eq('id', testContactId)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data!.communication_frequency).toBe('weekly')
  })

  it('should toggle reminders_paused', async () => {
    const updates = {
      reminders_paused: true
    }

    const { data, error } = await supabase
      .from(TABLES.CONTACTS)
      .update(updates)
      .eq('id', testContactId)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data!.reminders_paused).toBe(true)
  })

  it('should update birthday format', async () => {
    const updates = {
      birthday: '12-25'
    }

    const { data, error } = await supabase
      .from(TABLES.CONTACTS)
      .update(updates)
      .eq('id', testContactId)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data!.birthday).toBe('12-25')
  })

  it('should validate communication frequency enum on update', async () => {
    const invalidUpdates = {
      communication_frequency: 'invalid_frequency'
    }

    const { error } = await supabase
      .from(TABLES.CONTACTS)
      .update(invalidUpdates)
      .eq('id', testContactId)

    expect(error).toBeTruthy()
    expect(error!.message).toContain('violates check constraint')
  })

  it('should not allow updating first_name to null', async () => {
    const invalidUpdates = {
      first_name: null
    }

    const { error } = await supabase
      .from(TABLES.CONTACTS)
      .update(invalidUpdates)
      .eq('id', testContactId)

    expect(error).toBeTruthy()
    expect(error!.message).toContain('null value')
  })

  it('should return null for non-existent contact ID', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000'
    const updates = { notes: 'This should not work' }

    const { data, error } = await supabase
      .from(TABLES.CONTACTS)
      .update(updates)
      .eq('id', nonExistentId)
      .select()

    expect(error).toBeNull()
    expect(data).toEqual([]) // No rows updated
  })

  it('should update updated_at timestamp', async () => {
    // Get original timestamp
    const { data: original } = await supabase
      .from(TABLES.CONTACTS)
      .select('updated_at')
      .eq('id', testContactId)
      .single()

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 100))

    // Update the contact
    const { data: updated, error } = await supabase
      .from(TABLES.CONTACTS)
      .update({ notes: 'Updated to test timestamp' })
      .eq('id', testContactId)
      .select('updated_at')
      .single()

    expect(error).toBeNull()
    expect(new Date(updated!.updated_at).getTime()).toBeGreaterThan(new Date(original!.updated_at).getTime())
  })

  it('should clear optional fields when set to null', async () => {
    const updates = {
      last_name: null,
      nickname: null,
      birthday: null,
      communication_frequency: null,
      notes: null
    }

    const { data, error } = await supabase
      .from(TABLES.CONTACTS)
      .update(updates)
      .eq('id', testContactId)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data!.last_name).toBeNull()
    expect(data!.nickname).toBeNull()
    expect(data!.birthday).toBeNull()
    expect(data!.communication_frequency).toBeNull()
    expect(data!.notes).toBeNull()
  })
})