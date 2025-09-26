import { describe, it, expect, beforeEach } from 'vitest'
import { supabase, TABLES } from '@/lib/supabase'

describe('Contract: DELETE Interaction by ID', () => {
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
        notes: 'Important call about project collaboration and timeline',
        interaction_date: new Date('2024-01-15T10:30:00Z').toISOString()
      })
      .select()
      .single()

    testInteractionId = interaction!.id
  })

  it('should delete interaction by valid ID', async () => {
    const { data, error } = await supabase
      .from(TABLES.INTERACTIONS)
      .delete()
      .eq('id', testInteractionId)
      .select()

    expect(error).toBeNull()
    expect(data).toHaveLength(1)
    expect(data![0].id).toBe(testInteractionId)
    expect(data![0].notes).toBe('Important call about project collaboration and timeline')

    // Verify interaction is actually deleted
    const { data: verification } = await supabase
      .from(TABLES.INTERACTIONS)
      .select('*')
      .eq('id', testInteractionId)
      .maybeSingle()

    expect(verification).toBeNull()
  })

  it('should not affect parent contact when deleting interaction', async () => {
    // Delete the interaction
    await supabase
      .from(TABLES.INTERACTIONS)
      .delete()
      .eq('id', testInteractionId)

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

  it('should handle deletion of multiple interactions', async () => {
    // Create additional interactions
    const additionalInteractions = [
      {
        contact_id: testContactId,
        type: 'email' as const,
        notes: 'Follow-up email with meeting notes',
        interaction_date: new Date('2024-01-16T14:00:00Z').toISOString()
      },
      {
        contact_id: testContactId,
        type: 'text' as const,
        notes: 'Quick text about weekend plans',
        interaction_date: new Date('2024-01-17T09:30:00Z').toISOString()
      },
      {
        contact_id: testContactId,
        type: 'meetup' as const,
        notes: 'Coffee meeting to discuss project details',
        interaction_date: new Date('2024-01-18T11:00:00Z').toISOString()
      }
    ]

    const { data: inserted } = await supabase
      .from(TABLES.INTERACTIONS)
      .insert(additionalInteractions)
      .select()

    // Delete all interactions for this contact (simulating batch delete)
    const { data, error } = await supabase
      .from(TABLES.INTERACTIONS)
      .delete()
      .eq('contact_id', testContactId)
      .select()

    expect(error).toBeNull()
    expect(data).toHaveLength(4) // Original + 3 additional

    // Verify all interactions are deleted
    const { data: verification } = await supabase
      .from(TABLES.INTERACTIONS)
      .select('*')
      .eq('contact_id', testContactId)

    expect(verification).toHaveLength(0)
  })

  it('should delete interactions by type', async () => {
    // Create mixed interaction types
    await supabase.from(TABLES.INTERACTIONS).insert([
      { contact_id: testContactId, type: 'email', notes: 'Email interaction 1', interaction_date: new Date().toISOString() },
      { contact_id: testContactId, type: 'email', notes: 'Email interaction 2', interaction_date: new Date().toISOString() },
      { contact_id: testContactId, type: 'text', notes: 'Text interaction', interaction_date: new Date().toISOString() }
    ])

    // Delete all email interactions for this contact
    const { data, error } = await supabase
      .from(TABLES.INTERACTIONS)
      .delete()
      .eq('contact_id', testContactId)
      .eq('type', 'email')
      .select()

    expect(error).toBeNull()
    expect(data).toHaveLength(2) // Both email interactions deleted

    // Verify other interactions still exist
    const { data: remaining } = await supabase
      .from(TABLES.INTERACTIONS)
      .select('*')
      .eq('contact_id', testContactId)

    expect(remaining).toHaveLength(2) // Original call + text interaction
    expect(remaining!.map(i => i.type)).toEqual(expect.arrayContaining(['call', 'text']))
  })

  it('should delete interactions by date range', async () => {
    const baseDate = new Date('2024-01-15T00:00:00Z')
    
    // Create interactions with different dates
    await supabase.from(TABLES.INTERACTIONS).insert([
      {
        contact_id: testContactId,
        type: 'email',
        notes: 'Before range',
        interaction_date: new Date(baseDate.getTime() - 86400000 * 2).toISOString() // 2 days before
      },
      {
        contact_id: testContactId,
        type: 'text',
        notes: 'In range 1',
        interaction_date: baseDate.toISOString()
      },
      {
        contact_id: testContactId,
        type: 'meetup',
        notes: 'In range 2',
        interaction_date: new Date(baseDate.getTime() + 86400000).toISOString() // 1 day after
      },
      {
        contact_id: testContactId,
        type: 'call',
        notes: 'After range',
        interaction_date: new Date(baseDate.getTime() + 86400000 * 5).toISOString() // 5 days after
      }
    ])

    // Delete interactions within a 3-day window
    const endDate = new Date(baseDate.getTime() + 86400000 * 3)
    const { data, error } = await supabase
      .from(TABLES.INTERACTIONS)
      .delete()
      .eq('contact_id', testContactId)
      .gte('interaction_date', baseDate.toISOString())
      .lte('interaction_date', endDate.toISOString())
      .select()

    expect(error).toBeNull()
    expect(data).toHaveLength(3) // Original + 2 in range

    // Verify interactions outside range still exist
    const { data: remaining } = await supabase
      .from(TABLES.INTERACTIONS)
      .select('*')
      .eq('contact_id', testContactId)

    expect(remaining).toHaveLength(2) // Before range + After range
    expect(remaining!.map(i => i.notes)).toEqual(expect.arrayContaining(['Before range', 'After range']))
  })

  it('should return empty array for non-existent ID', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000'

    const { data, error } = await supabase
      .from(TABLES.INTERACTIONS)
      .delete()
      .eq('id', nonExistentId)
      .select()

    expect(error).toBeNull()
    expect(data).toEqual([]) // No rows deleted
  })

  it('should handle invalid UUID format', async () => {
    const invalidId = 'not-a-valid-uuid'
    
    const { error } = await supabase
      .from(TABLES.INTERACTIONS)
      .delete()
      .eq('id', invalidId)

    expect(error).toBeTruthy()
    expect(error!.message).toContain('invalid input syntax for type uuid')
  })

  it('should handle deletion of most recent interaction', async () => {
    // Create multiple interactions with different dates
    const interactions = [
      {
        contact_id: testContactId,
        type: 'email' as const,
        notes: 'Older interaction',
        interaction_date: new Date('2024-01-10T10:00:00Z').toISOString()
      },
      {
        contact_id: testContactId,
        type: 'text' as const,
        notes: 'Most recent interaction',
        interaction_date: new Date('2024-01-20T15:00:00Z').toISOString()
      }
    ]

    const { data: newInteractions } = await supabase
      .from(TABLES.INTERACTIONS)
      .insert(interactions)
      .select()

    // Delete the most recent interaction
    const mostRecentId = newInteractions!.find(i => i.notes === 'Most recent interaction')!.id
    const { data, error } = await supabase
      .from(TABLES.INTERACTIONS)
      .delete()
      .eq('id', mostRecentId)
      .select()

    expect(error).toBeNull()
    expect(data![0].notes).toBe('Most recent interaction')

    // Note: Business logic should recalculate contact.last_contacted_at
    // based on the remaining most recent interaction
  })

  it('should handle concurrent deletions gracefully', async () => {
    // Create multiple interactions
    const { data: multipleInteractions } = await supabase
      .from(TABLES.INTERACTIONS)
      .insert([
        { contact_id: testContactId, type: 'email', notes: 'Email 1', interaction_date: new Date().toISOString() },
        { contact_id: testContactId, type: 'text', notes: 'Text 1', interaction_date: new Date().toISOString() },
        { contact_id: testContactId, type: 'meetup', notes: 'Meetup 1', interaction_date: new Date().toISOString() }
      ])
      .select()

    // Simulate concurrent deletion attempts
    const deletePromises = [
      supabase.from(TABLES.INTERACTIONS).delete().eq('id', testInteractionId),
      supabase.from(TABLES.INTERACTIONS).delete().eq('id', multipleInteractions![0].id),
      supabase.from(TABLES.INTERACTIONS).delete().eq('id', multipleInteractions![1].id),
      supabase.from(TABLES.INTERACTIONS).delete().eq('id', multipleInteractions![2].id)
    ]

    const results = await Promise.all(deletePromises)
    
    results.forEach(result => {
      expect(result.error).toBeNull()
    })

    // Verify all interactions are deleted
    const { data: remaining } = await supabase
      .from(TABLES.INTERACTIONS)
      .select('*')
      .eq('contact_id', testContactId)

    expect(remaining).toHaveLength(0)
  })

  it('should delete interactions and maintain data integrity', async () => {
    // Create interaction with specific data
    const specificDate = new Date('2024-01-15T10:30:00Z').toISOString()
    
    // Verify the interaction exists before deletion
    const { data: beforeDelete } = await supabase
      .from(TABLES.INTERACTIONS)
      .select('*')
      .eq('id', testInteractionId)
      .single()

    expect(beforeDelete!.type).toBe('call')
    expect(beforeDelete!.interaction_date).toBe('2024-01-15T10:30:00+00:00')

    // Delete the interaction
    const { data, error } = await supabase
      .from(TABLES.INTERACTIONS)
      .delete()
      .eq('id', testInteractionId)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data!.id).toBe(testInteractionId)
    expect(data!.type).toBe('call')
    expect(data!.notes).toBe('Important call about project collaboration and timeline')

    // Verify deletion was successful
    const { data: afterDelete } = await supabase
      .from(TABLES.INTERACTIONS)
      .select('*')
      .eq('id', testInteractionId)
      .maybeSingle()

    expect(afterDelete).toBeNull()
  })

  it('should complete deletion in reasonable time', async () => {
    const startTime = Date.now()
    
    await supabase
      .from(TABLES.INTERACTIONS)
      .delete()
      .eq('id', testInteractionId)
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    expect(duration).toBeLessThan(2000) // Should complete within 2 seconds
  })

  it('should handle deletion of all interaction types', async () => {
    // Create one interaction of each type
    const interactionTypes = ['call', 'text', 'email', 'meetup', 'other'] as const
    const typeInteractions = interactionTypes.map(type => ({
      contact_id: testContactId,
      type,
      notes: `${type} interaction for deletion test`,
      interaction_date: new Date().toISOString()
    }))

    const { data: createdInteractions } = await supabase
      .from(TABLES.INTERACTIONS)
      .insert(typeInteractions)
      .select()

    // Delete each type individually
    for (const interaction of createdInteractions!) {
      const { data, error } = await supabase
        .from(TABLES.INTERACTIONS)
        .delete()
        .eq('id', interaction.id)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data!.type).toBe(interaction.type)
    }

    // Verify only original interaction remains (if any)
    const { data: remaining } = await supabase
      .from(TABLES.INTERACTIONS)
      .select('*')
      .eq('contact_id', testContactId)

    expect(remaining).toHaveLength(1) // Just the original test interaction
    expect(remaining![0].id).toBe(testInteractionId)
  })
})