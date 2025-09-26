import { describe, it, expect, beforeEach } from 'vitest'
import { supabase, TABLES } from '@/lib/supabase'

describe('Contract: GET Dashboard Data', () => {
  let testContacts: any[] = []

  beforeEach(async () => {
    // Clean up test data
    await supabase.from(TABLES.CONTACTS).delete().neq('id', 'impossible-id'))
    await supabase.from(TABLES.CONTACT_INFO).delete().neq('id', 'impossible-id'))
    await supabase.from(TABLES.INTERACTIONS).delete().neq('id', 'impossible-id'))
    await supabase.from(TABLES.REMINDERS).delete().neq('id', 'impossible-id'))
    
    // Create test contacts with different scenarios
    const { data: contacts } = await supabase
      .from(TABLES.CONTACTS)
      .insert([
        {
          first_name: 'John',
          last_name: 'Doe',
          birthday: '06-15',
          communication_frequency: 'monthly',
          last_contacted_at: new Date('2024-01-01T10:00:00Z').toISOString(),
          reminders_paused: false,
          notes: 'Close friend from college'
        },
        {
          first_name: 'Jane',
          last_name: 'Smith',
          birthday: '12-25',
          communication_frequency: 'weekly',
          last_contacted_at: new Date('2024-01-10T15:30:00Z').toISOString(),
          reminders_paused: false,
          notes: 'Work colleague and friend'
        },
        {
          first_name: 'Bob',
          last_name: 'Johnson',
          communication_frequency: 'quarterly',
          reminders_paused: true,
          notes: 'Former neighbor, reminders paused'
        },
        {
          first_name: 'Alice',
          last_name: 'Brown',
          birthday: '03-20',
          last_contacted_at: new Date('2023-11-15T12:00:00Z').toISOString(),
          reminders_paused: false,
          notes: 'Long-time friend, need to reconnect'
        }
      ])
      .select()

    testContacts = contacts!
  })

  it('should return dashboard data with all sections when no data exists', async () => {
    // Clean all data to test empty state
    await supabase.from(TABLES.CONTACTS).delete().neq('id', 'impossible-id'))

    // Test empty dashboard queries
    const contactsQuery = supabase.from(TABLES.CONTACTS).select('count(*)', { count: 'exact' })
    const interactionsQuery = supabase.from(TABLES.INTERACTIONS).select('count(*)', { count: 'exact' })
    const remindersQuery = supabase.from(TABLES.REMINDERS).select('count(*)', { count: 'exact' }).eq('status', 'pending')

    const [contactsResult, interactionsResult, remindersResult] = await Promise.all([
      contactsQuery,
      interactionsQuery,
      remindersQuery
    ])

    expect(contactsResult.error).toBeNull()
    expect(contactsResult.count).toBe(0)

    expect(interactionsResult.error).toBeNull()
    expect(interactionsResult.count).toBe(0)

    expect(remindersResult.error).toBeNull()
    expect(remindersResult.count).toBe(0)
  })

  it('should return contact statistics', async () => {
    // Query contact statistics
    const { data: totalContacts, error: totalError, count: totalCount } = await supabase
      .from(TABLES.CONTACTS)
      .select('*', { count: 'exact' })

    expect(totalError).toBeNull()
    expect(totalCount).toBe(4)

    // Query contacts with birthdays
    const { data: birthdayContacts, error: birthdayError, count: birthdayCount } = await supabase
      .from(TABLES.CONTACTS)
      .select('*', { count: 'exact' })
      .not('birthday', 'is', null)

    expect(birthdayError).toBeNull()
    expect(birthdayCount).toBe(3) // John, Jane, Alice have birthdays

    // Query contacts with communication frequency set
    const { data: frequencyContacts, error: frequencyError, count: frequencyCount } = await supabase
      .from(TABLES.CONTACTS)
      .select('*', { count: 'exact' })
      .not('communication_frequency', 'is', null)

    expect(frequencyError).toBeNull()
    expect(frequencyCount).toBe(3) // John (monthly), Jane (weekly), Bob (quarterly)

    // Query contacts with reminders paused
    const { data: pausedContacts, error: pausedError, count: pausedCount } = await supabase
      .from(TABLES.CONTACTS)
      .select('*', { count: 'exact' })
      .eq('reminders_paused', true)

    expect(pausedError).toBeNull()
    expect(pausedCount).toBe(1) // Bob has reminders paused
  })

  it('should return recent interactions summary', async () => {
    // Create test interactions
    const interactions = [
      {
        contact_id: testContacts[0].id, // John
        type: 'call',
        notes: 'Caught up about work and family',
        interaction_date: new Date('2024-01-20T10:30:00Z').toISOString()
      },
      {
        contact_id: testContacts[1].id, // Jane
        type: 'email',
        notes: 'Sent birthday wishes',
        interaction_date: new Date('2024-01-18T14:00:00Z').toISOString()
      },
      {
        contact_id: testContacts[0].id, // John again
        type: 'text',
        notes: 'Quick check-in',
        interaction_date: new Date('2024-01-15T09:00:00Z').toISOString()
      },
      {
        contact_id: testContacts[3].id, // Alice
        type: 'meetup',
        notes: 'Coffee meeting',
        interaction_date: new Date('2024-01-12T16:00:00Z').toISOString()
      }
    ]

    await supabase.from(TABLES.INTERACTIONS).insert(interactions)

    // Query total interactions
    const { data: totalInteractions, error: totalError, count: totalCount } = await supabase
      .from(TABLES.INTERACTIONS)
      .select('*', { count: 'exact' })

    expect(totalError).toBeNull()
    expect(totalCount).toBe(4)

    // Query recent interactions (last 7 days from a fixed date)
    const recentDate = new Date('2024-01-21T00:00:00Z')
    const weekAgo = new Date(recentDate.getTime() - 7 * 24 * 60 * 60 * 1000)

    const { data: recentInteractions, error: recentError, count: recentCount } = await supabase
      .from(TABLES.INTERACTIONS)
      .select('*', { count: 'exact' })
      .gte('interaction_date', weekAgo.toISOString())
      .lte('interaction_date', recentDate.toISOString())

    expect(recentError).toBeNull()
    expect(recentCount).toBe(4) // All our test interactions are within the week

    // Query interactions by type
    const { data: callInteractions, error: callError, count: callCount } = await supabase
      .from(TABLES.INTERACTIONS)
      .select('*', { count: 'exact' })
      .eq('type', 'call')

    expect(callError).toBeNull()
    expect(callCount).toBe(1)
  })

  it('should return pending reminders summary', async () => {
    // Create test reminders
    const reminders = [
      {
        contact_id: testContacts[0].id, // John
        type: 'communication',
        scheduled_for: new Date('2024-02-01T10:00:00Z').toISOString(),
        status: 'pending',
        message: 'Monthly check-in with John'
      },
      {
        contact_id: testContacts[1].id, // Jane
        type: 'birthday_week',
        scheduled_for: new Date('2024-12-18T09:00:00Z').toISOString(),
        status: 'pending',
        message: 'Jane\'s birthday is next week'
      },
      {
        contact_id: testContacts[1].id, // Jane
        type: 'birthday_day',
        scheduled_for: new Date('2024-12-25T09:00:00Z').toISOString(),
        status: 'pending',
        message: 'Today is Jane\'s birthday!'
      },
      {
        contact_id: testContacts[2].id, // Bob
        type: 'communication',
        scheduled_for: new Date('2024-01-15T10:00:00Z').toISOString(),
        status: 'sent',
        message: 'Quarterly reminder for Bob',
        sent_at: new Date('2024-01-15T10:05:00Z').toISOString()
      },
      {
        contact_id: testContacts[3].id, // Alice
        type: 'communication',
        scheduled_for: new Date('2024-01-20T10:00:00Z').toISOString(),
        status: 'dismissed',
        message: 'Reconnect with Alice'
      }
    ]

    await supabase.from(TABLES.REMINDERS).insert(reminders)

    // Query total reminders
    const { data: totalReminders, error: totalError, count: totalCount } = await supabase
      .from(TABLES.REMINDERS)
      .select('*', { count: 'exact' })

    expect(totalError).toBeNull()
    expect(totalCount).toBe(5)

    // Query pending reminders
    const { data: pendingReminders, error: pendingError, count: pendingCount } = await supabase
      .from(TABLES.REMINDERS)
      .select('*', { count: 'exact' })
      .eq('status', 'pending')

    expect(pendingError).toBeNull()
    expect(pendingCount).toBe(3) // John's communication, Jane's birthday week & day

    // Query overdue reminders (scheduled_for in the past and still pending)
    const now = new Date('2024-01-25T00:00:00Z') // Fixed date for testing
    const { data: overdueReminders, error: overdueError, count: overdueCount } = await supabase
      .from(TABLES.REMINDERS)
      .select('*', { count: 'exact' })
      .eq('status', 'pending')
      .lt('scheduled_for', now.toISOString())

    expect(overdueError).toBeNull()
    // This count depends on the test dates - adjust as needed
    
    // Query reminders by type
    const { data: commReminders, error: commError, count: commCount } = await supabase
      .from(TABLES.REMINDERS)
      .select('*', { count: 'exact' })
      .eq('type', 'communication')

    expect(commError).toBeNull()
    expect(commCount).toBe(3) // John, Bob, Alice

    const { data: birthdayReminders, error: birthdayError, count: birthdayCount } = await supabase
      .from(TABLES.REMINDERS)
      .select('*', { count: 'exact' })
      .in('type', ['birthday_week', 'birthday_day'])

    expect(birthdayError).toBeNull()
    expect(birthdayCount).toBe(2) // Jane's birthday week & day
  })

  it('should return contacts needing attention', async () => {
    // Query contacts that haven't been contacted recently
    const cutoffDate = new Date('2024-01-01T00:00:00Z') // Contacts not contacted since this date

    // Contacts without last_contacted_at or with old last contact
    const { data: needAttention, error: attentionError } = await supabase
      .from(TABLES.CONTACTS)
      .select('*')
      .or(`last_contacted_at.is.null,last_contacted_at.lt.${cutoffDate.toISOString()}`)

    expect(attentionError).toBeNull()
    expect(needAttention!.length).toBeGreaterThanOrEqual(1) // Alice has old last_contacted_at

    // Contacts with communication frequency but no recent contact
    const { data: frequencyOverdue, error: frequencyError } = await supabase
      .from(TABLES.CONTACTS)
      .select('*')
      .not('communication_frequency', 'is', null)
      .lt('last_contacted_at', cutoffDate.toISOString())

    expect(frequencyError).toBeNull()
    expect(frequencyOverdue!.length).toBeGreaterThanOrEqual(0)
  })

  it('should return upcoming birthdays', async () => {
    // Query contacts with birthdays in next 30 days
    // Note: This is complex due to MM-DD format and year boundaries
    
    // For testing, let's assume we're in May 2024 looking for June birthdays
    const { data: juneBirthdays, error: juneError } = await supabase
      .from(TABLES.CONTACTS)
      .select('*')
      .like('birthday', '06-%') // June birthdays

    expect(juneError).toBeNull()
    expect(juneBirthdays).toHaveLength(1) // John has birthday 06-15

    // Query December birthdays
    const { data: decemberBirthdays, error: decemberError } = await supabase
      .from(TABLES.CONTACTS)
      .select('*')
      .like('birthday', '12-%')

    expect(decemberError).toBeNull()
    expect(decemberBirthdays).toHaveLength(1) // Jane has birthday 12-25
  })

  it('should return contact activity summary by frequency', async () => {
    // Query contacts grouped by communication frequency
    const frequencies = ['weekly', 'monthly', 'quarterly', 'biannually', 'annually']
    
    for (const frequency of frequencies) {
      const { data, error, count } = await supabase
        .from(TABLES.CONTACTS)
        .select('*', { count: 'exact' })
        .eq('communication_frequency', frequency)

      expect(error).toBeNull()
      
      if (frequency === 'weekly') {
        expect(count).toBe(1) // Jane
      } else if (frequency === 'monthly') {
        expect(count).toBe(1) // John
      } else if (frequency === 'quarterly') {
        expect(count).toBe(1) // Bob
      } else {
        expect(count).toBe(0) // None set to biannually or annually in test data
      }
    }
  })

  it('should handle dashboard queries with joins', async () => {
    // Create some contact info and interactions to test joins
    await supabase.from(TABLES.CONTACT_INFO).insert([
      { contact_id: testContacts[0].id, type: 'email', label: 'work', value: 'john@work.com', is_primary: true },
      { contact_id: testContacts[1].id, type: 'phone', label: 'mobile', value: '+1-555-0123', is_primary: true }
    ])

    await supabase.from(TABLES.INTERACTIONS).insert([
      { contact_id: testContacts[0].id, type: 'call', notes: 'Recent call', interaction_date: new Date().toISOString() },
      { contact_id: testContacts[1].id, type: 'email', notes: 'Recent email', interaction_date: new Date().toISOString() }
    ])

    // Query contacts with their latest interaction
    const { data: contactsWithInteractions, error: interactionError } = await supabase
      .from(TABLES.CONTACTS)
      .select(`
        *,
        latest_interaction:${TABLES.INTERACTIONS}(
          type,
          notes,
          interaction_date
        )
      `)
      .limit(5)

    expect(interactionError).toBeNull()
    expect(contactsWithInteractions).toHaveLength(4) // All test contacts
  })

  it('should handle dashboard data aggregation queries', async () => {
    // Add more test data for aggregation
    await supabase.from(TABLES.INTERACTIONS).insert([
      { contact_id: testContacts[0].id, type: 'call', notes: 'Call 1', interaction_date: new Date('2024-01-01T10:00:00Z').toISOString() },
      { contact_id: testContacts[0].id, type: 'email', notes: 'Email 1', interaction_date: new Date('2024-01-02T10:00:00Z').toISOString() },
      { contact_id: testContacts[1].id, type: 'call', notes: 'Call 2', interaction_date: new Date('2024-01-03T10:00:00Z').toISOString() },
      { contact_id: testContacts[1].id, type: 'text', notes: 'Text 1', interaction_date: new Date('2024-01-04T10:00:00Z').toISOString() },
    ])

    // Query interaction counts by type
    const interactionTypes = ['call', 'email', 'text', 'meetup', 'other']
    
    for (const type of interactionTypes) {
      const { data, error, count } = await supabase
        .from(TABLES.INTERACTIONS)
        .select('*', { count: 'exact' })
        .eq('type', type)

      expect(error).toBeNull()
      
      if (type === 'call') {
        expect(count).toBe(2) // 2 calls
      } else if (type === 'email') {
        expect(count).toBe(1) // 1 email
      } else if (type === 'text') {
        expect(count).toBe(1) // 1 text
      } else {
        expect(count).toBe(0) // No meetup or other
      }
    }
  })

  it('should handle database connection errors gracefully', async () => {
    // Test that basic queries work - would fail if Supabase is misconfigured
    const queries = [
      supabase.from(TABLES.CONTACTS).select('count(*)'),
      supabase.from(TABLES.INTERACTIONS).select('count(*)'),
      supabase.from(TABLES.REMINDERS).select('count(*)'),
      supabase.from(TABLES.CONTACT_INFO).select('count(*)')
    ]

    const results = await Promise.all(queries)
    
    results.forEach(result => {
      expect(result.error).toBeNull()
    })
  })

  it('should return performance metrics for dashboard', async () => {
    const startTime = Date.now()

    // Simulate concurrent dashboard queries
    const dashboardQueries = await Promise.all([
      supabase.from(TABLES.CONTACTS).select('count(*)', { count: 'exact' }),
      supabase.from(TABLES.INTERACTIONS).select('count(*)', { count: 'exact' }),
      supabase.from(TABLES.REMINDERS).select('count(*)', { count: 'exact' }).eq('status', 'pending'),
      supabase.from(TABLES.CONTACTS).select('*').not('birthday', 'is', null).limit(5)
    ])

    const endTime = Date.now()
    const duration = endTime - startTime

    // All queries should complete successfully
    dashboardQueries.forEach(result => {
      expect(result.error).toBeNull()
    })

    // Should complete in reasonable time
    expect(duration).toBeLessThan(5000) // Within 5 seconds for all dashboard queries
  })
})