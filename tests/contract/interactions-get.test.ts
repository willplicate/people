import { describe, it, expect, beforeEach } from 'vitest'
import { supabase, TABLES } from '@/lib/supabase'

describe('Contract: GET Interactions by Contact ID', () => {
  let testContactId: string

  beforeEach(async () => {
    // Clean up test data
    await supabase.from(TABLES.CONTACTS).delete().neq('id', 'impossible-id'))
    await supabase.from(TABLES.INTERACTIONS).delete().neq('id', 'impossible-id'))
    
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

  it('should return empty array when contact has no interactions', async () => {
    const { data, error } = await supabase
      .from(TABLES.INTERACTIONS)
      .select('*')
      .eq('contact_id', testContactId)

    expect(error).toBeNull()
    expect(data).toEqual([])
  })

  it('should return all interactions for valid contact ID with correct schema', async () => {
    // Add interactions for the test contact
    const interactionsData = [
      {
        contact_id: testContactId,
        type: 'call' as const,
        notes: 'Caught up about work and family. John got a promotion!',
        interaction_date: new Date('2024-01-15T10:30:00Z').toISOString()
      },
      {
        contact_id: testContactId,
        type: 'email' as const,
        notes: 'Sent birthday wishes and congratulations on the new house',
        interaction_date: new Date('2024-01-10T14:00:00Z').toISOString()
      },
      {
        contact_id: testContactId,
        type: 'meetup' as const,
        notes: 'Coffee at downtown cafe. Discussed upcoming vacation plans.',
        interaction_date: new Date('2024-01-05T16:45:00Z').toISOString()
      },
      {
        contact_id: testContactId,
        type: 'text' as const,
        notes: 'Quick check-in about weekend plans',
        interaction_date: new Date('2024-01-01T09:15:00Z').toISOString()
      }
    ]

    await supabase.from(TABLES.INTERACTIONS).insert(interactionsData)

    const { data, error } = await supabase
      .from(TABLES.INTERACTIONS)
      .select('*')
      .eq('contact_id', testContactId)
      .order('interaction_date', { ascending: false })

    expect(error).toBeNull()
    expect(data).toHaveLength(4)

    // Verify schema structure for each interaction
    data!.forEach(interaction => {
      expect(interaction).toHaveProperty('id')
      expect(interaction).toHaveProperty('contact_id')
      expect(interaction).toHaveProperty('type')
      expect(interaction).toHaveProperty('notes')
      expect(interaction).toHaveProperty('interaction_date')
      expect(interaction).toHaveProperty('created_at')
      expect(interaction).toHaveProperty('updated_at')

      expect(typeof interaction.id).toBe('string')
      expect(interaction.contact_id).toBe(testContactId)
      expect(['call', 'text', 'email', 'meetup', 'other']).toContain(interaction.type)
      expect(typeof interaction.notes).toBe('string')
      expect(typeof interaction.interaction_date).toBe('string')
    })

    // Verify order (most recent first)
    expect(data![0].type).toBe('call') // Most recent
    expect(data![3].type).toBe('text') // Oldest
  })

  it('should filter interactions by type', async () => {
    // Add mixed interaction types
    await supabase.from(TABLES.INTERACTIONS).insert([
      { contact_id: testContactId, type: 'call', notes: 'Phone call about project', interaction_date: new Date().toISOString() },
      { contact_id: testContactId, type: 'email', notes: 'Email follow-up', interaction_date: new Date().toISOString() },
      { contact_id: testContactId, type: 'call', notes: 'Another phone call', interaction_date: new Date().toISOString() },
      { contact_id: testContactId, type: 'meetup', notes: 'In-person meeting', interaction_date: new Date().toISOString() }
    ])

    // Filter by call type
    const { data, error } = await supabase
      .from(TABLES.INTERACTIONS)
      .select('*')
      .eq('contact_id', testContactId)
      .eq('type', 'call')

    expect(error).toBeNull()
    expect(data).toHaveLength(2)
    data!.forEach(interaction => {
      expect(interaction.type).toBe('call')
    })
  })

  it('should order interactions by date descending (most recent first)', async () => {
    const dates = [
      new Date('2024-01-01T10:00:00Z').toISOString(),
      new Date('2024-01-15T10:00:00Z').toISOString(),
      new Date('2024-01-10T10:00:00Z').toISOString()
    ]

    // Add interactions in mixed order
    await supabase.from(TABLES.INTERACTIONS).insert([
      { contact_id: testContactId, type: 'call', notes: 'First chronologically', interaction_date: dates[0] },
      { contact_id: testContactId, type: 'email', notes: 'Last chronologically', interaction_date: dates[1] },
      { contact_id: testContactId, type: 'text', notes: 'Middle chronologically', interaction_date: dates[2] }
    ])

    const { data, error } = await supabase
      .from(TABLES.INTERACTIONS)
      .select('*')
      .eq('contact_id', testContactId)
      .order('interaction_date', { ascending: false })

    expect(error).toBeNull()
    expect(data).toHaveLength(3)
    expect(data![0].notes).toBe('Last chronologically') // Most recent
    expect(data![1].notes).toBe('Middle chronologically')
    expect(data![2].notes).toBe('First chronologically') // Oldest
  })

  it('should support pagination with limit and offset', async () => {
    // Create 10 interactions
    const interactions = Array.from({ length: 10 }, (_, i) => ({
      contact_id: testContactId,
      type: 'call' as const,
      notes: `Interaction number ${i + 1}`,
      interaction_date: new Date(Date.now() - (i * 86400000)).toISOString() // Daily intervals
    }))

    await supabase.from(TABLES.INTERACTIONS).insert(interactions)

    // Get first 5 interactions
    const { data: page1, error: error1 } = await supabase
      .from(TABLES.INTERACTIONS)
      .select('*')
      .eq('contact_id', testContactId)
      .order('interaction_date', { ascending: false })
      .limit(5)

    expect(error1).toBeNull()
    expect(page1).toHaveLength(5)

    // Get next 5 interactions
    const { data: page2, error: error2 } = await supabase
      .from(TABLES.INTERACTIONS)
      .select('*')
      .eq('contact_id', testContactId)
      .order('interaction_date', { ascending: false })
      .range(5, 9)

    expect(error2).toBeNull()
    expect(page2).toHaveLength(5)

    // Verify no overlap
    const page1Ids = page1!.map(i => i.id)
    const page2Ids = page2!.map(i => i.id)
    const intersection = page1Ids.filter(id => page2Ids.includes(id))
    expect(intersection).toHaveLength(0)
  })

  it('should filter interactions by date range', async () => {
    const baseDate = new Date('2024-01-15T00:00:00Z')
    const interactions = [
      {
        contact_id: testContactId,
        type: 'call' as const,
        notes: 'Before range',
        interaction_date: new Date(baseDate.getTime() - 86400000 * 2).toISOString() // 2 days before
      },
      {
        contact_id: testContactId,
        type: 'email' as const,
        notes: 'In range',
        interaction_date: baseDate.toISOString() // Exactly on start date
      },
      {
        contact_id: testContactId,
        type: 'text' as const,
        notes: 'Also in range',
        interaction_date: new Date(baseDate.getTime() + 86400000).toISOString() // 1 day after
      },
      {
        contact_id: testContactId,
        type: 'meetup' as const,
        notes: 'After range',
        interaction_date: new Date(baseDate.getTime() + 86400000 * 5).toISOString() // 5 days after
      }
    ]

    await supabase.from(TABLES.INTERACTIONS).insert(interactions)

    // Filter for interactions within a 3-day window
    const endDate = new Date(baseDate.getTime() + 86400000 * 3)
    const { data, error } = await supabase
      .from(TABLES.INTERACTIONS)
      .select('*')
      .eq('contact_id', testContactId)
      .gte('interaction_date', baseDate.toISOString())
      .lte('interaction_date', endDate.toISOString())

    expect(error).toBeNull()
    expect(data).toHaveLength(2)
    expect(data!.map(i => i.notes)).toEqual(expect.arrayContaining(['In range', 'Also in range']))
  })

  it('should return empty array for non-existent contact ID', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000'

    const { data, error } = await supabase
      .from(TABLES.INTERACTIONS)
      .select('*')
      .eq('contact_id', nonExistentId)

    expect(error).toBeNull()
    expect(data).toEqual([])
  })

  it('should handle invalid UUID format for contact ID', async () => {
    const invalidId = 'not-a-valid-uuid'
    
    const { error } = await supabase
      .from(TABLES.INTERACTIONS)
      .select('*')
      .eq('contact_id', invalidId)

    expect(error).toBeTruthy()
    expect(error!.message).toContain('invalid input syntax for type uuid')
  })

  it('should search interactions by notes content', async () => {
    // Add interactions with different notes
    await supabase.from(TABLES.INTERACTIONS).insert([
      { contact_id: testContactId, type: 'call', notes: 'Discussed work project timeline and deliverables', interaction_date: new Date().toISOString() },
      { contact_id: testContactId, type: 'email', notes: 'Birthday wishes and family updates', interaction_date: new Date().toISOString() },
      { contact_id: testContactId, type: 'text', notes: 'Quick check about weekend project collaboration', interaction_date: new Date().toISOString() },
      { contact_id: testContactId, type: 'meetup', notes: 'Coffee and casual conversation', interaction_date: new Date().toISOString() }
    ])

    // Search for interactions containing "project"
    const { data, error } = await supabase
      .from(TABLES.INTERACTIONS)
      .select('*')
      .eq('contact_id', testContactId)
      .ilike('notes', '%project%')

    expect(error).toBeNull()
    expect(data).toHaveLength(2)
    data!.forEach(interaction => {
      expect(interaction.notes.toLowerCase()).toContain('project')
    })
  })

  it('should handle database connection errors gracefully', async () => {
    // This test would fail if Supabase is not properly configured
    const { error } = await supabase
      .from(TABLES.INTERACTIONS)
      .select('count(*)')
      .eq('contact_id', testContactId)

    expect(error).toBeNull()
  })
})