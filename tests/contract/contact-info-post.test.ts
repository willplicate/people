import { describe, it, expect, beforeEach } from 'vitest'
import { supabase, TABLES } from '@/lib/supabase'
import type { CreateContactInfoInput } from '@/types/database'

describe('Contract: POST Contact Info for Contact', () => {
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

  it('should create email contact info with required fields only', async () => {
    const newContactInfo: CreateContactInfoInput = {
      contact_id: testContactId,
      type: 'email',
      label: 'work',
      value: 'john@company.com',
      is_primary: false
    }

    const { data, error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .insert(newContactInfo)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeTruthy()
    expect(data!.contact_id).toBe(testContactId)
    expect(data!.type).toBe('email')
    expect(data!.label).toBe('work')
    expect(data!.value).toBe('john@company.com')
    expect(data!.is_primary).toBe(false)
    expect(data!.id).toBeTruthy()
    expect(data!.created_at).toBeTruthy()
    expect(data!.updated_at).toBeTruthy()
  })

  it('should create phone contact info as primary', async () => {
    const newContactInfo: CreateContactInfoInput = {
      contact_id: testContactId,
      type: 'phone',
      label: 'mobile',
      value: '+1-555-0123',
      is_primary: true
    }

    const { data, error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .insert(newContactInfo)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data!.type).toBe('phone')
    expect(data!.label).toBe('mobile')
    expect(data!.value).toBe('+1-555-0123')
    expect(data!.is_primary).toBe(true)
  })

  it('should create address contact info', async () => {
    const newContactInfo: CreateContactInfoInput = {
      contact_id: testContactId,
      type: 'address',
      label: 'home',
      value: '123 Main Street, Anytown, AN 12345',
      is_primary: true
    }

    const { data, error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .insert(newContactInfo)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data!.type).toBe('address')
    expect(data!.label).toBe('home')
    expect(data!.value).toBe('123 Main Street, Anytown, AN 12345')
  })

  it('should validate contact info type enum', async () => {
    const invalidContactInfo = {
      contact_id: testContactId,
      type: 'invalid_type',
      label: 'work',
      value: 'test@email.com',
      is_primary: false
    }

    const { error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .insert(invalidContactInfo)

    expect(error).toBeTruthy()
    expect(error!.message).toContain('violates check constraint')
  })

  it('should validate contact info label enum', async () => {
    const invalidContactInfo = {
      contact_id: testContactId,
      type: 'email',
      label: 'invalid_label',
      value: 'test@email.com',
      is_primary: false
    }

    const { error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .insert(invalidContactInfo)

    expect(error).toBeTruthy()
    expect(error!.message).toContain('violates check constraint')
  })

  it('should require all mandatory fields', async () => {
    const incompleteContactInfo = {
      contact_id: testContactId,
      type: 'email',
      // Missing label, value, is_primary
    }

    const { error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .insert(incompleteContactInfo)

    expect(error).toBeTruthy()
    expect(error!.message).toContain('null value')
  })

  it('should require valid contact_id foreign key', async () => {
    const nonExistentContactId = '00000000-0000-0000-0000-000000000000'
    const newContactInfo = {
      contact_id: nonExistentContactId,
      type: 'email',
      label: 'work',
      value: 'test@email.com',
      is_primary: false
    }

    const { error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .insert(newContactInfo)

    expect(error).toBeTruthy()
    expect(error!.message).toContain('foreign key constraint')
  })

  it('should handle multiple contact info entries for same contact', async () => {
    const contactInfoData: CreateContactInfoInput[] = [
      {
        contact_id: testContactId,
        type: 'email',
        label: 'work',
        value: 'john.work@company.com',
        is_primary: true
      },
      {
        contact_id: testContactId,
        type: 'email',
        label: 'home',
        value: 'john.home@personal.com',
        is_primary: false
      },
      {
        contact_id: testContactId,
        type: 'phone',
        label: 'mobile',
        value: '+1-555-0123',
        is_primary: true
      }
    ]

    const { data, error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .insert(contactInfoData)
      .select()

    expect(error).toBeNull()
    expect(data).toHaveLength(3)
    expect(data!.map(ci => ci.contact_id)).toEqual([testContactId, testContactId, testContactId])
  })

  it('should enforce primary flag business logic within same type', async () => {
    // Create first email as primary
    await supabase.from(TABLES.CONTACT_INFO).insert({
      contact_id: testContactId,
      type: 'email',
      label: 'work',
      value: 'first@email.com',
      is_primary: true
    })

    // Try to create second email as primary (should be allowed in database)
    // Business logic to enforce single primary per type should be in API layer
    const { data, error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .insert({
        contact_id: testContactId,
        type: 'email',
        label: 'home',
        value: 'second@email.com',
        is_primary: true
      })
      .select()
      .single()

    // Note: Database allows multiple primaries - business logic should be in API
    expect(error).toBeNull()
    expect(data!.is_primary).toBe(true)
  })

  it('should handle different labels for same type', async () => {
    const phoneNumbers = [
      {
        contact_id: testContactId,
        type: 'phone' as const,
        label: 'home' as const,
        value: '+1-555-0100',
        is_primary: false
      },
      {
        contact_id: testContactId,
        type: 'phone' as const,
        label: 'work' as const,
        value: '+1-555-0200',
        is_primary: false
      },
      {
        contact_id: testContactId,
        type: 'phone' as const,
        label: 'mobile' as const,
        value: '+1-555-0300',
        is_primary: true
      }
    ]

    const { data, error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .insert(phoneNumbers)
      .select()

    expect(error).toBeNull()
    expect(data).toHaveLength(3)
    expect(data!.map(p => p.label)).toEqual(['home', 'work', 'mobile'])
  })

  it('should handle invalid UUID format for contact_id', async () => {
    const invalidContactInfo = {
      contact_id: 'not-a-valid-uuid',
      type: 'email',
      label: 'work',
      value: 'test@email.com',
      is_primary: false
    }
    
    const { error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .insert(invalidContactInfo)

    expect(error).toBeTruthy()
    expect(error!.message).toContain('invalid input syntax for type uuid')
  })

  it('should set default values correctly', async () => {
    const minimalContactInfo = {
      contact_id: testContactId,
      type: 'email',
      label: 'work',
      value: 'minimal@test.com',
      is_primary: false
    }

    const { data, error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .insert(minimalContactInfo)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data!.is_primary).toBe(false) // Should maintain the provided value
    expect(data!.created_at).toBeTruthy()
    expect(data!.updated_at).toBeTruthy()
    expect(data!.created_at).toBe(data!.updated_at) // Should be same on creation
  })
})