import { describe, it, expect, beforeEach } from 'vitest'
import { supabase, TABLES } from '@/lib/supabase'
import type { CreateContactInput } from '@/types/database'

describe('Contract: POST Contacts', () => {
  beforeEach(async () => {
    // Clean up test data
    await supabase.from(TABLES.CONTACTS).delete().neq('id', 'impossible-id'))
  })

  it('should create contact with required fields only', async () => {
    const newContact: CreateContactInput = {
      first_name: 'John',
      reminders_paused: false
    }

    const { data, error } = await supabase
      .from(TABLES.CONTACTS)
      .insert(newContact)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeTruthy()
    expect(data!.first_name).toBe('John')
    expect(data!.id).toBeTruthy()
    expect(data!.created_at).toBeTruthy()
    expect(data!.updated_at).toBeTruthy()
  })

  it('should create contact with all optional fields', async () => {
    const newContact: CreateContactInput = {
      first_name: 'Jane',
      last_name: 'Doe',
      nickname: 'JD',
      birthday: '06-15',
      communication_frequency: 'monthly',
      reminders_paused: false,
      notes: 'College friend, works at tech company'
    }

    const { data, error } = await supabase
      .from(TABLES.CONTACTS)
      .insert(newContact)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeTruthy()
    expect(data!.first_name).toBe('Jane')
    expect(data!.last_name).toBe('Doe')
    expect(data!.nickname).toBe('JD')
    expect(data!.birthday).toBe('06-15')
    expect(data!.communication_frequency).toBe('monthly')
    expect(data!.notes).toBe('College friend, works at tech company')
  })

  it('should validate communication frequency enum', async () => {
    const invalidContact = {
      first_name: 'Test',
      communication_frequency: 'invalid_frequency',
      reminders_paused: false
    }

    const { error } = await supabase
      .from(TABLES.CONTACTS)
      .insert(invalidContact)

    expect(error).toBeTruthy()
    expect(error!.message).toContain('violates check constraint')
  })

  it('should require first_name', async () => {
    const invalidContact = {
      last_name: 'Doe',
      reminders_paused: false
    }

    const { error } = await supabase
      .from(TABLES.CONTACTS)
      .insert(invalidContact)

    expect(error).toBeTruthy()
    expect(error!.message).toContain('null value')
  })

  it('should set default values correctly', async () => {
    const newContact = {
      first_name: 'Test User'
    }

    const { data, error } = await supabase
      .from(TABLES.CONTACTS)
      .insert(newContact)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data!.reminders_paused).toBe(false) // Should default to false
    expect(data!.last_contacted_at).toBeNull() // Should be null initially
    expect(data!.communication_frequency).toBeNull() // Should be null by default
  })

  it('should validate birthday format (MM-DD)', async () => {
    // Valid format
    const validContact = {
      first_name: 'Valid Birthday',
      birthday: '12-25',
      reminders_paused: false
    }

    const { data: valid, error: validError } = await supabase
      .from(TABLES.CONTACTS)
      .insert(validContact)
      .select()
      .single()

    expect(validError).toBeNull()
    expect(valid!.birthday).toBe('12-25')

    // Note: Database-level format validation would need to be added via CHECK constraint
    // For now, this tests that valid formats are accepted
  })

  it('should handle multiple contacts insertion', async () => {
    const contacts: CreateContactInput[] = [
      { first_name: 'Contact 1', reminders_paused: false },
      { first_name: 'Contact 2', reminders_paused: false },
      { first_name: 'Contact 3', reminders_paused: false }
    ]

    const { data, error } = await supabase
      .from(TABLES.CONTACTS)
      .insert(contacts)
      .select()

    expect(error).toBeNull()
    expect(data).toHaveLength(3)
    expect(data!.map(c => c.first_name)).toEqual(['Contact 1', 'Contact 2', 'Contact 3'])
  })
})