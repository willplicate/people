import { describe, it, expect, beforeEach } from 'vitest'
import { supabase, TABLES } from '@/lib/supabase'
import type { Contact } from '@/types/database'

describe('Contract: GET Contacts', () => {
  beforeEach(async () => {
    // Note: Tests should use isolated test data or cleanup manually
    // For now, we'll rely on the database state management in each test
  })

  it('should return empty array when no contacts exist', async () => {
    const { data, error } = await supabase
      .from(TABLES.CONTACTS)
      .select('*')

    expect(error).toBeNull()
    expect(data).toEqual([])
  })

  it('should return all contacts with correct schema', async () => {
    // Insert test contact
    const testContact = {
      first_name: 'John',
      last_name: 'Doe',
      nickname: 'JD',
      birthday: '06-15', // MM-DD format
      communication_frequency: 'monthly' as const,
      reminders_paused: false,
      notes: 'Test contact'
    }

    const { data: inserted } = await supabase
      .from(TABLES.CONTACTS)
      .insert(testContact)
      .select()
      .single()

    // Test the actual query
    const { data, error } = await supabase
      .from(TABLES.CONTACTS)
      .select('*')

    expect(error).toBeNull()
    expect(data).toHaveLength(1)
    
    const contact = data![0]
    
    // Verify schema structure
    expect(contact).toHaveProperty('id')
    expect(contact).toHaveProperty('first_name')
    expect(contact).toHaveProperty('last_name') 
    expect(contact).toHaveProperty('nickname')
    expect(contact).toHaveProperty('birthday')
    expect(contact).toHaveProperty('communication_frequency')
    expect(contact).toHaveProperty('last_contacted_at')
    expect(contact).toHaveProperty('reminders_paused')
    expect(contact).toHaveProperty('notes')
    expect(contact).toHaveProperty('created_at')
    expect(contact).toHaveProperty('updated_at')

    // Verify data types and values
    expect(typeof contact.id).toBe('string')
    expect(contact.first_name).toBe('John')
    expect(contact.last_name).toBe('Doe')
    expect(contact.communication_frequency).toBe('monthly')
    expect(contact.reminders_paused).toBe(false)
  })

  it('should support search by name', async () => {
    // Insert test contacts
    await supabase.from(TABLES.CONTACTS).insert([
      { first_name: 'John', last_name: 'Doe' },
      { first_name: 'Jane', last_name: 'Smith' },
      { first_name: 'Bob', last_name: 'Johnson' }
    ])

    // Search by first name
    const { data, error } = await supabase
      .from(TABLES.CONTACTS)
      .select('*')
      .ilike('first_name', '%john%')

    expect(error).toBeNull()
    expect(data).toHaveLength(1)
    expect(data![0].first_name).toBe('John')
  })

  it('should filter by communication frequency', async () => {
    // Insert test contacts with different frequencies
    await supabase.from(TABLES.CONTACTS).insert([
      { first_name: 'Monthly', communication_frequency: 'monthly' },
      { first_name: 'Weekly', communication_frequency: 'weekly' },
      { first_name: 'None', communication_frequency: null }
    ])

    // Filter by monthly frequency
    const { data, error } = await supabase
      .from(TABLES.CONTACTS)
      .select('*')
      .eq('communication_frequency', 'monthly')

    expect(error).toBeNull()
    expect(data).toHaveLength(1)
    expect(data![0].first_name).toBe('Monthly')
  })

  it('should handle database connection errors gracefully', async () => {
    // This test would fail if Supabase is not properly configured
    const { error } = await supabase
      .from(TABLES.CONTACTS)
      .select('count(*)')

    expect(error).toBeNull()
  })
})