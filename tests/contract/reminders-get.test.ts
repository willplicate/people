import { describe, it, expect, beforeEach } from 'vitest'
import { supabase, TABLES } from '@/lib/supabase'

describe('Contract: GET Reminders', () => {
  let testContactId1: string
  let testContactId2: string

  beforeEach(async () => {
    // Clean up test data
    await supabase.from(TABLES.CONTACTS).delete().neq('id', 'impossible-id')
    await supabase.from(TABLES.REMINDERS).delete().neq('id', 'impossible-id')
    
    // Create test contacts
    const { data: contacts } = await supabase
      .from(TABLES.CONTACTS)
      .insert([
        {
          first_name: 'John',
          last_name: 'Doe',
          birthday: '06-15',
          communication_frequency: 'monthly',
          reminders_paused: false
        },
        {
          first_name: 'Jane',
          last_name: 'Smith',
          birthday: '12-25',
          communication_frequency: 'weekly',
          reminders_paused: false
        }
      ])
      .select()

    testContactId1 = contacts![0].id
    testContactId2 = contacts![1].id
  })

  it('should return empty array when no reminders exist', async () => {
    const { data, error } = await supabase
      .from(TABLES.REMINDERS)
      .select('*')

    expect(error).toBeNull()
    expect(data).toEqual([])
  })

  it('should return all reminders with correct schema', async () => {
    // Add reminders for test contacts
    const remindersData = [
      {
        contact_id: testContactId1,
        type: 'communication' as const,
        scheduled_for: new Date('2024-02-15T10:00:00Z').toISOString(),
        status: 'pending' as const,
        message: 'Time to reach out to John - it\'s been a month since last contact'
      },
      {
        contact_id: testContactId1,
        type: 'birthday_week' as const,
        scheduled_for: new Date('2024-06-08T09:00:00Z').toISOString(),
        status: 'pending' as const,
        message: 'John\'s birthday is coming up in a week (June 15)'
      },
      {
        contact_id: testContactId1,
        type: 'birthday_day' as const,
        scheduled_for: new Date('2024-06-15T09:00:00Z').toISOString(),
        status: 'pending' as const,
        message: 'Today is John\'s birthday!'
      },
      {
        contact_id: testContactId2,
        type: 'communication' as const,
        scheduled_for: new Date('2024-01-22T10:00:00Z').toISOString(),
        status: 'sent' as const,
        message: 'Weekly check-in reminder for Jane',
        sent_at: new Date('2024-01-22T10:05:00Z').toISOString()
      },
      {
        contact_id: testContactId2,
        type: 'birthday_day' as const,
        scheduled_for: new Date('2024-12-25T09:00:00Z').toISOString(),
        status: 'dismissed' as const,
        message: 'Today is Jane\'s birthday!'
      }
    ]

    await supabase.from(TABLES.REMINDERS).insert(remindersData)

    const { data, error } = await supabase
      .from(TABLES.REMINDERS)
      .select('*')
      .order('scheduled_for', { ascending: true })

    expect(error).toBeNull()
    expect(data).toHaveLength(5)

    // Verify schema structure for each reminder
    data!.forEach(reminder => {
      expect(reminder).toHaveProperty('id')
      expect(reminder).toHaveProperty('contact_id')
      expect(reminder).toHaveProperty('type')
      expect(reminder).toHaveProperty('scheduled_for')
      expect(reminder).toHaveProperty('status')
      expect(reminder).toHaveProperty('message')
      expect(reminder).toHaveProperty('created_at')
      expect(reminder).toHaveProperty('sent_at')

      expect(typeof reminder.id).toBe('string')
      expect([testContactId1, testContactId2]).toContain(reminder.contact_id)
      expect(['communication', 'birthday_week', 'birthday_day']).toContain(reminder.type)
      expect(['pending', 'sent', 'dismissed']).toContain(reminder.status)
      expect(typeof reminder.message).toBe('string')
    })
  })

  it('should filter reminders by status', async () => {
    // Add reminders with different statuses
    await supabase.from(TABLES.REMINDERS).insert([
      { contact_id: testContactId1, type: 'communication', scheduled_for: new Date().toISOString(), status: 'pending', message: 'Pending reminder 1' },
      { contact_id: testContactId1, type: 'communication', scheduled_for: new Date().toISOString(), status: 'sent', message: 'Sent reminder 1', sent_at: new Date().toISOString() },
      { contact_id: testContactId2, type: 'communication', scheduled_for: new Date().toISOString(), status: 'pending', message: 'Pending reminder 2' },
      { contact_id: testContactId2, type: 'birthday_day', scheduled_for: new Date().toISOString(), status: 'dismissed', message: 'Dismissed reminder' }
    ])

    // Filter by pending status
    const { data: pendingReminders, error: pendingError } = await supabase
      .from(TABLES.REMINDERS)
      .select('*')
      .eq('status', 'pending')

    expect(pendingError).toBeNull()
    expect(pendingReminders).toHaveLength(2)
    pendingReminders!.forEach(reminder => {
      expect(reminder.status).toBe('pending')
    })

    // Filter by sent status
    const { data: sentReminders, error: sentError } = await supabase
      .from(TABLES.REMINDERS)
      .select('*')
      .eq('status', 'sent')

    expect(sentError).toBeNull()
    expect(sentReminders).toHaveLength(1)
    expect(sentReminders![0].status).toBe('sent')
    expect(sentReminders![0].sent_at).toBeTruthy()
  })

  it('should filter reminders by type', async () => {
    // Add reminders of different types
    await supabase.from(TABLES.REMINDERS).insert([
      { contact_id: testContactId1, type: 'communication', scheduled_for: new Date().toISOString(), status: 'pending', message: 'Communication reminder' },
      { contact_id: testContactId1, type: 'birthday_week', scheduled_for: new Date().toISOString(), status: 'pending', message: 'Birthday week reminder' },
      { contact_id: testContactId1, type: 'birthday_day', scheduled_for: new Date().toISOString(), status: 'pending', message: 'Birthday day reminder' },
      { contact_id: testContactId2, type: 'communication', scheduled_for: new Date().toISOString(), status: 'pending', message: 'Another communication reminder' }
    ])

    // Filter by communication type
    const { data: commReminders, error: commError } = await supabase
      .from(TABLES.REMINDERS)
      .select('*')
      .eq('type', 'communication')

    expect(commError).toBeNull()
    expect(commReminders).toHaveLength(2)
    commReminders!.forEach(reminder => {
      expect(reminder.type).toBe('communication')
    })

    // Filter by birthday types
    const { data: birthdayReminders, error: birthdayError } = await supabase
      .from(TABLES.REMINDERS)
      .select('*')
      .in('type', ['birthday_week', 'birthday_day'])

    expect(birthdayError).toBeNull()
    expect(birthdayReminders).toHaveLength(2)
    birthdayReminders!.forEach(reminder => {
      expect(['birthday_week', 'birthday_day']).toContain(reminder.type)
    })
  })

  it('should filter reminders by contact_id', async () => {
    // Add reminders for both contacts
    await supabase.from(TABLES.REMINDERS).insert([
      { contact_id: testContactId1, type: 'communication', scheduled_for: new Date().toISOString(), status: 'pending', message: 'Reminder for John' },
      { contact_id: testContactId1, type: 'birthday_day', scheduled_for: new Date().toISOString(), status: 'pending', message: 'John birthday' },
      { contact_id: testContactId2, type: 'communication', scheduled_for: new Date().toISOString(), status: 'pending', message: 'Reminder for Jane' }
    ])

    // Filter by first contact
    const { data: contact1Reminders, error: contact1Error } = await supabase
      .from(TABLES.REMINDERS)
      .select('*')
      .eq('contact_id', testContactId1)

    expect(contact1Error).toBeNull()
    expect(contact1Reminders).toHaveLength(2)
    contact1Reminders!.forEach(reminder => {
      expect(reminder.contact_id).toBe(testContactId1)
    })

    // Filter by second contact
    const { data: contact2Reminders, error: contact2Error } = await supabase
      .from(TABLES.REMINDERS)
      .select('*')
      .eq('contact_id', testContactId2)

    expect(contact2Error).toBeNull()
    expect(contact2Reminders).toHaveLength(1)
    expect(contact2Reminders![0].contact_id).toBe(testContactId2)
  })

  it('should order reminders by scheduled_for date', async () => {
    const dates = [
      new Date('2024-01-15T10:00:00Z').toISOString(),
      new Date('2024-01-10T10:00:00Z').toISOString(),
      new Date('2024-01-20T10:00:00Z').toISOString(),
      new Date('2024-01-05T10:00:00Z').toISOString()
    ]

    // Add reminders in mixed order
    await supabase.from(TABLES.REMINDERS).insert([
      { contact_id: testContactId1, type: 'communication', scheduled_for: dates[0], status: 'pending', message: 'Third chronologically' },
      { contact_id: testContactId1, type: 'communication', scheduled_for: dates[1], status: 'pending', message: 'Second chronologically' },
      { contact_id: testContactId1, type: 'communication', scheduled_for: dates[2], status: 'pending', message: 'Fourth chronologically' },
      { contact_id: testContactId1, type: 'communication', scheduled_for: dates[3], status: 'pending', message: 'First chronologically' }
    ])

    // Order by scheduled_for ascending
    const { data: ascending, error: ascError } = await supabase
      .from(TABLES.REMINDERS)
      .select('*')
      .order('scheduled_for', { ascending: true })

    expect(ascError).toBeNull()
    expect(ascending![0].message).toBe('First chronologically')
    expect(ascending![3].message).toBe('Fourth chronologically')

    // Order by scheduled_for descending
    const { data: descending, error: descError } = await supabase
      .from(TABLES.REMINDERS)
      .select('*')
      .order('scheduled_for', { ascending: false })

    expect(descError).toBeNull()
    expect(descending![0].message).toBe('Fourth chronologically')
    expect(descending![3].message).toBe('First chronologically')
  })

  it('should filter reminders by date range', async () => {
    const baseDate = new Date('2024-01-15T00:00:00Z')
    const reminders = [
      {
        contact_id: testContactId1,
        type: 'communication' as const,
        scheduled_for: new Date(baseDate.getTime() - 86400000 * 2).toISOString(), // 2 days before
        status: 'pending' as const,
        message: 'Before range'
      },
      {
        contact_id: testContactId1,
        type: 'communication' as const,
        scheduled_for: baseDate.toISOString(), // Start of range
        status: 'pending' as const,
        message: 'Start of range'
      },
      {
        contact_id: testContactId1,
        type: 'communication' as const,
        scheduled_for: new Date(baseDate.getTime() + 86400000).toISOString(), // 1 day after
        status: 'pending' as const,
        message: 'In range'
      },
      {
        contact_id: testContactId1,
        type: 'communication' as const,
        scheduled_for: new Date(baseDate.getTime() + 86400000 * 5).toISOString(), // 5 days after
        status: 'pending' as const,
        message: 'After range'
      }
    ]

    await supabase.from(TABLES.REMINDERS).insert(reminders)

    // Filter for reminders within a 3-day window
    const endDate = new Date(baseDate.getTime() + 86400000 * 3)
    const { data, error } = await supabase
      .from(TABLES.REMINDERS)
      .select('*')
      .gte('scheduled_for', baseDate.toISOString())
      .lte('scheduled_for', endDate.toISOString())

    expect(error).toBeNull()
    expect(data).toHaveLength(2)
    expect(data!.map(r => r.message)).toEqual(expect.arrayContaining(['Start of range', 'In range']))
  })

  it('should support pagination', async () => {
    // Create 10 reminders
    const reminders = Array.from({ length: 10 }, (_, i) => ({
      contact_id: i % 2 === 0 ? testContactId1 : testContactId2,
      type: 'communication' as const,
      scheduled_for: new Date(Date.now() + (i * 3600000)).toISOString(), // Hourly intervals
      status: 'pending' as const,
      message: `Reminder ${i + 1}`
    }))

    await supabase.from(TABLES.REMINDERS).insert(reminders)

    // Get first 5 reminders
    const { data: page1, error: error1 } = await supabase
      .from(TABLES.REMINDERS)
      .select('*')
      .order('scheduled_for', { ascending: true })
      .limit(5)

    expect(error1).toBeNull()
    expect(page1).toHaveLength(5)

    // Get next 5 reminders
    const { data: page2, error: error2 } = await supabase
      .from(TABLES.REMINDERS)
      .select('*')
      .order('scheduled_for', { ascending: true })
      .range(5, 9)

    expect(error2).toBeNull()
    expect(page2).toHaveLength(5)

    // Verify no overlap
    const page1Ids = page1!.map(r => r.id)
    const page2Ids = page2!.map(r => r.id)
    const intersection = page1Ids.filter(id => page2Ids.includes(id))
    expect(intersection).toHaveLength(0)
  })

  it('should include contact information when requested', async () => {
    // Add reminder
    await supabase.from(TABLES.REMINDERS).insert({
      contact_id: testContactId1,
      type: 'communication',
      scheduled_for: new Date().toISOString(),
      status: 'pending',
      message: 'Reminder with contact info'
    })

    const { data, error } = await supabase
      .from(TABLES.REMINDERS)
      .select(`
        *,
        contact:${TABLES.CONTACTS}(first_name, last_name)
      `)

    expect(error).toBeNull()
    expect(data).toHaveLength(1)
    expect(data![0].contact).toBeTruthy()
    expect(data![0].contact.first_name).toBe('John')
    expect(data![0].contact.last_name).toBe('Doe')
  })

  it('should handle invalid UUID format for contact_id filter', async () => {
    const invalidId = 'not-a-valid-uuid'
    
    const { error } = await supabase
      .from(TABLES.REMINDERS)
      .select('*')
      .eq('contact_id', invalidId)

    expect(error).toBeTruthy()
    expect(error!.message).toContain('invalid input syntax for type uuid')
  })

  it('should search reminders by message content', async () => {
    // Add reminders with different messages
    await supabase.from(TABLES.REMINDERS).insert([
      { contact_id: testContactId1, type: 'communication', scheduled_for: new Date().toISOString(), status: 'pending', message: 'Time to call about the project deadline' },
      { contact_id: testContactId1, type: 'birthday_day', scheduled_for: new Date().toISOString(), status: 'pending', message: 'Birthday celebration reminder' },
      { contact_id: testContactId2, type: 'communication', scheduled_for: new Date().toISOString(), status: 'pending', message: 'Weekly project check-in' },
      { contact_id: testContactId2, type: 'communication', scheduled_for: new Date().toISOString(), status: 'pending', message: 'Casual coffee meeting' }
    ])

    // Search for reminders containing "project"
    const { data, error } = await supabase
      .from(TABLES.REMINDERS)
      .select('*')
      .ilike('message', '%project%')

    expect(error).toBeNull()
    expect(data).toHaveLength(2)
    data!.forEach(reminder => {
      expect(reminder.message.toLowerCase()).toContain('project')
    })
  })

  it('should handle database connection errors gracefully', async () => {
    // This test would fail if Supabase is not properly configured
    const { error } = await supabase
      .from(TABLES.REMINDERS)
      .select('count(*)')

    expect(error).toBeNull()
  })

  it('should filter pending reminders scheduled for today or past', async () => {
    const now = new Date()
    const yesterday = new Date(now.getTime() - 86400000)
    const tomorrow = new Date(now.getTime() + 86400000)

    // Add reminders with different scheduled times
    await supabase.from(TABLES.REMINDERS).insert([
      { contact_id: testContactId1, type: 'communication', scheduled_for: yesterday.toISOString(), status: 'pending', message: 'Overdue reminder' },
      { contact_id: testContactId1, type: 'communication', scheduled_for: now.toISOString(), status: 'pending', message: 'Due now reminder' },
      { contact_id: testContactId1, type: 'communication', scheduled_for: tomorrow.toISOString(), status: 'pending', message: 'Future reminder' },
      { contact_id: testContactId2, type: 'communication', scheduled_for: yesterday.toISOString(), status: 'sent', message: 'Already sent overdue' }
    ])

    // Filter for pending reminders that are due (scheduled_for <= now)
    const { data, error } = await supabase
      .from(TABLES.REMINDERS)
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', now.toISOString())

    expect(error).toBeNull()
    expect(data).toHaveLength(2)
    expect(data!.map(r => r.message)).toEqual(expect.arrayContaining(['Overdue reminder', 'Due now reminder']))
  })
})