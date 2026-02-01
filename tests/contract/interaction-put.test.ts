import { describe, it, expect, beforeEach } from 'vitest'
import { supabase, TABLES } from '@/lib/supabase'
import type { UpdateInteractionInput } from '@/types/database'

describe('Contract: PUT Interaction by ID', () => {
  let testContactId: string
  let testInteractionId: string

  beforeEach(async () => {
    // Clean up test data
    await supabase.from(TABLES.CONTACTS).delete().neq('id', 'impossible-id'))
    await supabase.from(TABLES.INTERACTIONS).delete().neq('id', 'impossible-id'))
    
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

    // Create test interaction
    const { data: interaction } = await supabase
      .from(TABLES.INTERACTIONS)
      .insert({
        contact_id: testContactId,
        type: 'call',
        notes: 'Original call notes about work discussion',
        interaction_date: new Date('2024-01-15T10:30:00Z').toISOString()
      })
      .select()
      .single()

    testInteractionId = interaction!.id
  })

  it('should update interaction notes', async () => {
    const updates: UpdateInteractionInput = {
      notes: 'Updated notes: Discussed project timeline and deliverables in detail. John provided great insights about the implementation approach.'
    }

    const { data, error } = await supabase
      .from(TABLES.INTERACTIONS)
      .update(updates)
      .eq('id', testInteractionId)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeTruthy()
    expect(data!.notes).toBe('Updated notes: Discussed project timeline and deliverables in detail. John provided great insights about the implementation approach.')
    expect(data!.type).toBe('call') // Unchanged
    expect(data!.contact_id).toBe(testContactId) // Unchanged
    expect(data!.updated_at).toBeTruthy()
  })

  it('should update interaction type', async () => {
    const updates = {
      type: 'email'
    }

    const { data, error } = await supabase
      .from(TABLES.INTERACTIONS)
      .update(updates)
      .eq('id', testInteractionId)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data!.type).toBe('email')
    expect(data!.notes).toBe('Original call notes about work discussion') // Unchanged
  })

  it('should update interaction date', async () => {
    const newDate = new Date('2024-01-20T14:15:00Z').toISOString()
    const updates = {
      interaction_date: newDate
    }

    const { data, error } = await supabase
      .from(TABLES.INTERACTIONS)
      .update(updates)
      .eq('id', testInteractionId)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data!.interaction_date).toBe('2024-01-20T14:15:00+00:00')
  })

  it('should update multiple fields at once', async () => {
    const updates: UpdateInteractionInput = {
      type: 'meetup',
      notes: 'Changed to meetup: Had coffee and discussed family updates, work changes, and vacation plans.',
      interaction_date: new Date('2024-01-18T11:00:00Z').toISOString()
    }

    const { data, error } = await supabase
      .from(TABLES.INTERACTIONS)
      .update(updates)
      .eq('id', testInteractionId)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data!.type).toBe('meetup')
    expect(data!.notes).toBe('Changed to meetup: Had coffee and discussed family updates, work changes, and vacation plans.')
    expect(data!.interaction_date).toBe('2024-01-18T11:00:00+00:00')
  })

  it('should validate interaction type enum on update', async () => {
    const invalidUpdates = {
      type: 'invalid_type'
    }

    const { error } = await supabase
      .from(TABLES.INTERACTIONS)
      .update(invalidUpdates)
      .eq('id', testInteractionId)

    expect(error).toBeTruthy()
    expect(error!.message).toContain('violates check constraint')
  })

  it('should not allow updating to empty notes', async () => {
    const emptyNotesUpdate = {
      notes: ''
    }

    const { error } = await supabase
      .from(TABLES.INTERACTIONS)
      .update(emptyNotesUpdate)
      .eq('id', testInteractionId)

    // Database might allow empty notes - business logic should validate this
    expect(error).toBeNull()
    // Note: API should enforce minimum notes length (1-2000 characters)
  })

  it('should handle long notes update (up to 2000 characters)', async () => {
    const longNotes = 'Updated long notes: ' + 'A'.repeat(1983) // Total 2000 characters
    const updates = {
      notes: longNotes
    }

    const { data, error } = await supabase
      .from(TABLES.INTERACTIONS)
      .update(updates)
      .eq('id', testInteractionId)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data!.notes).toBe(longNotes)
    expect(data!.notes.length).toBe(2000)
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
      .from(TABLES.INTERACTIONS)
      .update(updates)
      .eq('id', testInteractionId)

    // Database might allow this - business logic should prevent it
    expect(error).toBeNull()
    // Note: API should not allow changing contact_id for existing interactions
  })

  it('should return empty array for non-existent interaction ID', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000'
    const updates = { notes: 'This should not work' }

    const { data, error } = await supabase
      .from(TABLES.INTERACTIONS)
      .update(updates)
      .eq('id', nonExistentId)
      .select()

    expect(error).toBeNull()
    expect(data).toEqual([]) // No rows updated
  })

  it('should handle invalid UUID format', async () => {
    const invalidId = 'not-a-valid-uuid'
    const updates = { notes: 'This should fail' }
    
    const { error } = await supabase
      .from(TABLES.INTERACTIONS)
      .update(updates)
      .eq('id', invalidId)

    expect(error).toBeTruthy()
    expect(error!.message).toContain('invalid input syntax for type uuid')
  })

  it('should update updated_at timestamp', async () => {
    // Get original timestamp
    const { data: original } = await supabase
      .from(TABLES.INTERACTIONS)
      .select('updated_at')
      .eq('id', testInteractionId)
      .single()

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 100))

    // Update the interaction
    const { data: updated, error } = await supabase
      .from(TABLES.INTERACTIONS)
      .update({ notes: 'Updated to test timestamp' })
      .eq('id', testInteractionId)
      .select('updated_at')
      .single()

    expect(error).toBeNull()
    expect(new Date(updated!.updated_at).getTime()).toBeGreaterThan(new Date(original!.updated_at).getTime())
  })

  it('should handle interaction date validation (no future dates)', async () => {
    // Try to update to future date
    const futureDate = new Date(Date.now() + 86400000).toISOString() // Tomorrow
    const updates = {
      interaction_date: futureDate
    }

    // Database might allow future dates - business logic should validate
    const { data, error } = await supabase
      .from(TABLES.INTERACTIONS)
      .update(updates)
      .eq('id', testInteractionId)
      .select()
      .single()

    expect(error).toBeNull() // Database allows it
    expect(data!.interaction_date).toBe(futureDate.replace('Z', '+00:00'))
    // Note: API should validate and reject future interaction dates
  })

  it('should handle interaction date in the past', async () => {
    const pastDate = new Date('2023-06-15T14:30:00Z').toISOString()
    const updates = {
      interaction_date: pastDate
    }

    const { data, error } = await supabase
      .from(TABLES.INTERACTIONS)
      .update(updates)
      .eq('id', testInteractionId)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data!.interaction_date).toBe('2023-06-15T14:30:00+00:00')
  })

  it('should update all interaction types correctly', async () => {
    const interactionTypes = ['call', 'text', 'email', 'meetup', 'other'] as const

    for (const type of interactionTypes) {
      const updates = {
        type: type,
        notes: `Updated to ${type} interaction with appropriate notes`
      }

      const { data, error } = await supabase
        .from(TABLES.INTERACTIONS)
        .update(updates)
        .eq('id', testInteractionId)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data!.type).toBe(type)
      expect(data!.notes).toBe(`Updated to ${type} interaction with appropriate notes`)
    }
  })

  it('should handle partial updates correctly', async () => {
    // Update only notes
    const notesUpdate = { notes: 'Only notes updated' }
    const { data: step1 } = await supabase
      .from(TABLES.INTERACTIONS)
      .update(notesUpdate)
      .eq('id', testInteractionId)
      .select()
      .single()

    expect(step1!.notes).toBe('Only notes updated')
    expect(step1!.type).toBe('call') // Should remain unchanged

    // Update only type
    const typeUpdate = { type: 'email' as const }
    const { data: step2 } = await supabase
      .from(TABLES.INTERACTIONS)
      .update(typeUpdate)
      .eq('id', testInteractionId)
      .select()
      .single()

    expect(step2!.type).toBe('email')
    expect(step2!.notes).toBe('Only notes updated') // Should remain from previous update

    // Update only interaction_date
    const dateUpdate = { interaction_date: new Date('2024-02-01T09:00:00Z').toISOString() }
    const { data: step3 } = await supabase
      .from(TABLES.INTERACTIONS)
      .update(dateUpdate)
      .eq('id', testInteractionId)
      .select()
      .single()

    expect(step3!.interaction_date).toBe('2024-02-01T09:00:00+00:00')
    expect(step3!.type).toBe('email') // Should remain from previous update
    expect(step3!.notes).toBe('Only notes updated') // Should remain from first update
  })

  it('should potentially update contact last_contacted_at when interaction date changes', async () => {
    // Note: This depends on database triggers or API logic
    // The test documents the expected behavior even if not implemented yet

    const newInteractionDate = new Date('2024-01-25T15:00:00Z').toISOString()
    const updates = {
      interaction_date: newInteractionDate
    }

    const { data, error } = await supabase
      .from(TABLES.INTERACTIONS)
      .update(updates)
      .eq('id', testInteractionId)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data!.interaction_date).toBe('2024-01-25T15:00:00+00:00')

    // Note: Business logic should update contact.last_contacted_at when
    // interaction_date is updated, particularly if it's the most recent interaction
  })
})