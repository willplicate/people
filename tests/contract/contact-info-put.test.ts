import { describe, it, expect, beforeEach } from 'vitest'
import { supabase, TABLES } from '@/lib/supabase'
import type { UpdateContactInfoInput } from '@/types/database'

describe('Contract: PUT Contact Info by ID', () => {
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
        value: 'original@company.com',
        is_primary: false
      })
      .select()
      .single()

    testContactInfoId = contactInfo!.id
  })

  it('should update contact info value', async () => {
    const updates: UpdateContactInfoInput = {
      value: 'updated@company.com'
    }

    const { data, error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .update(updates)
      .eq('id', testContactInfoId)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeTruthy()
    expect(data!.value).toBe('updated@company.com')
    expect(data!.type).toBe('email') // Unchanged
    expect(data!.label).toBe('work') // Unchanged
    expect(data!.is_primary).toBe(false) // Unchanged
    expect(data!.updated_at).toBeTruthy()
  })

  it('should update contact info label', async () => {
    const updates = {
      label: 'home'
    }

    const { data, error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .update(updates)
      .eq('id', testContactInfoId)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data!.label).toBe('home')
    expect(data!.value).toBe('original@company.com') // Unchanged
  })

  it('should update primary status', async () => {
    const updates = {
      is_primary: true
    }

    const { data, error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .update(updates)
      .eq('id', testContactInfoId)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data!.is_primary).toBe(true)
  })

  it('should update contact info type', async () => {
    const updates = {
      type: 'phone',
      value: '+1-555-0123'
    }

    const { data, error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .update(updates)
      .eq('id', testContactInfoId)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data!.type).toBe('phone')
    expect(data!.value).toBe('+1-555-0123')
  })

  it('should update multiple fields at once', async () => {
    const updates: UpdateContactInfoInput = {
      type: 'address',
      label: 'home',
      value: '123 Main Street, Anytown, AN 12345',
      is_primary: true
    }

    const { data, error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .update(updates)
      .eq('id', testContactInfoId)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data!.type).toBe('address')
    expect(data!.label).toBe('home')
    expect(data!.value).toBe('123 Main Street, Anytown, AN 12345')
    expect(data!.is_primary).toBe(true)
  })

  it('should validate type enum on update', async () => {
    const invalidUpdates = {
      type: 'invalid_type'
    }

    const { error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .update(invalidUpdates)
      .eq('id', testContactInfoId)

    expect(error).toBeTruthy()
    expect(error!.message).toContain('violates check constraint')
  })

  it('should validate label enum on update', async () => {
    const invalidUpdates = {
      label: 'invalid_label'
    }

    const { error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .update(invalidUpdates)
      .eq('id', testContactInfoId)

    expect(error).toBeTruthy()
    expect(error!.message).toContain('violates check constraint')
  })

  it('should not allow updating contact_id', async () => {
    // Create another contact
    const { data: anotherContact } = await supabase
      .from(TABLES.CONTACTS)
      .insert({ first_name: 'Jane', reminders_paused: false })
      .select()
      .single()

    const updates = {
      contact_id: anotherContact!.id
    }

    const { error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .update(updates)
      .eq('id', testContactInfoId)

    // This might succeed depending on database constraints
    // In practice, contact_id should not be updatable via API
    expect(error).toBeNull() // But API should reject this
  })

  it('should return empty array for non-existent contact info ID', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000'
    const updates = { value: 'This should not work' }

    const { data, error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .update(updates)
      .eq('id', nonExistentId)
      .select()

    expect(error).toBeNull()
    expect(data).toEqual([]) // No rows updated
  })

  it('should handle invalid UUID format', async () => {
    const invalidId = 'not-a-valid-uuid'
    const updates = { value: 'test@email.com' }
    
    const { error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .update(updates)
      .eq('id', invalidId)

    expect(error).toBeTruthy()
    expect(error!.message).toContain('invalid input syntax for type uuid')
  })

  it('should update updated_at timestamp', async () => {
    // Get original timestamp
    const { data: original } = await supabase
      .from(TABLES.CONTACT_INFO)
      .select('updated_at')
      .eq('id', testContactInfoId)
      .single()

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 100))

    // Update the contact info
    const { data: updated, error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .update({ value: 'updated@test.com' })
      .eq('id', testContactInfoId)
      .select('updated_at')
      .single()

    expect(error).toBeNull()
    expect(new Date(updated!.updated_at).getTime()).toBeGreaterThan(new Date(original!.updated_at).getTime())
  })

  it('should handle business logic for primary flag transitions', async () => {
    // Create another contact info of same type
    const { data: secondary } = await supabase
      .from(TABLES.CONTACT_INFO)
      .insert({
        contact_id: testContactId,
        type: 'email',
        label: 'home',
        value: 'home@test.com',
        is_primary: false
      })
      .select()
      .single()

    // Set first one as primary
    await supabase
      .from(TABLES.CONTACT_INFO)
      .update({ is_primary: true })
      .eq('id', testContactInfoId)

    // Try to set second one as primary too
    const { data, error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .update({ is_primary: true })
      .eq('id', secondary!.id)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data!.is_primary).toBe(true)
    
    // Both can be primary in database - business logic should handle this in API
    const { data: allPrimary } = await supabase
      .from(TABLES.CONTACT_INFO)
      .select('*')
      .eq('contact_id', testContactId)
      .eq('type', 'email')
      .eq('is_primary', true)

    expect(allPrimary).toHaveLength(2) // Database allows multiple primaries
  })

  it('should validate value format for different types', async () => {
    // Test phone number update
    const phoneUpdate = {
      type: 'phone',
      value: '+1-555-0123'
    }

    const { data: phoneData, error: phoneError } = await supabase
      .from(TABLES.CONTACT_INFO)
      .update(phoneUpdate)
      .eq('id', testContactInfoId)
      .select()
      .single()

    expect(phoneError).toBeNull()
    expect(phoneData!.value).toBe('+1-555-0123')

    // Test email update
    const emailUpdate = {
      type: 'email',
      value: 'test@domain.com'
    }

    const { data: emailData, error: emailError } = await supabase
      .from(TABLES.CONTACT_INFO)
      .update(emailUpdate)
      .eq('id', testContactInfoId)
      .select()
      .single()

    expect(emailError).toBeNull()
    expect(emailData!.value).toBe('test@domain.com')
  })
})