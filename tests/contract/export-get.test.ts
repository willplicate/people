import { describe, it, expect, beforeEach } from 'vitest'
import { supabase, TABLES } from '@/lib/supabase'

describe('Contract: GET Export Data', () => {
  let testContacts: any[] = []

  beforeEach(async () => {
    // Clean up test data
    await supabase.from(TABLES.CONTACTS).delete().neq('id', 'impossible-id'))
    await supabase.from(TABLES.CONTACT_INFO).delete().neq('id', 'impossible-id'))
    await supabase.from(TABLES.INTERACTIONS).delete().neq('id', 'impossible-id'))
    await supabase.from(TABLES.REMINDERS).delete().neq('id', 'impossible-id'))
    
    // Create comprehensive test dataset
    const { data: contacts } = await supabase
      .from(TABLES.CONTACTS)
      .insert([
        {
          first_name: 'John',
          last_name: 'Doe',
          nickname: 'JD',
          birthday: '06-15',
          communication_frequency: 'monthly',
          last_contacted_at: new Date('2024-01-15T10:30:00Z').toISOString(),
          reminders_paused: false,
          notes: 'Close friend from college, works in tech industry'
        },
        {
          first_name: 'Jane',
          last_name: 'Smith',
          birthday: '12-25',
          communication_frequency: 'weekly',
          last_contacted_at: new Date('2024-01-20T14:00:00Z').toISOString(),
          reminders_paused: false,
          notes: 'Work colleague and running partner'
        },
        {
          first_name: 'Bob',
          last_name: 'Johnson',
          communication_frequency: 'quarterly',
          reminders_paused: true,
          notes: 'Former neighbor, moved to different city'
        }
      ])
      .select()

    testContacts = contacts!
  })

  it('should export empty dataset when no data exists', async () => {
    // Clean all data to test empty export
    await supabase.from(TABLES.CONTACTS).delete().neq('id', 'impossible-id'))

    // Test empty export queries
    const { data: contacts, error: contactsError } = await supabase
      .from(TABLES.CONTACTS)
      .select('*')

    const { data: contactInfo, error: contactInfoError } = await supabase
      .from(TABLES.CONTACT_INFO)
      .select('*')

    const { data: interactions, error: interactionsError } = await supabase
      .from(TABLES.INTERACTIONS)
      .select('*')

    const { data: reminders, error: remindersError } = await supabase
      .from(TABLES.REMINDERS)
      .select('*')

    expect(contactsError).toBeNull()
    expect(contacts).toEqual([])

    expect(contactInfoError).toBeNull()
    expect(contactInfo).toEqual([])

    expect(interactionsError).toBeNull()
    expect(interactions).toEqual([])

    expect(remindersError).toBeNull()
    expect(reminders).toEqual([])
  })

  it('should export all contacts with complete data structure', async () => {
    const { data: contacts, error } = await supabase
      .from(TABLES.CONTACTS)
      .select('*')
      .order('created_at', { ascending: true })

    expect(error).toBeNull()
    expect(contacts).toHaveLength(3)

    // Verify complete contact data structure
    contacts!.forEach(contact => {
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

      expect(typeof contact.id).toBe('string')
      expect(typeof contact.first_name).toBe('string')
      expect(contact.first_name.length).toBeGreaterThan(0)
    })

    // Verify specific test data
    const john = contacts!.find(c => c.first_name === 'John')
    expect(john!.last_name).toBe('Doe')
    expect(john!.nickname).toBe('JD')
    expect(john!.birthday).toBe('06-15')
    expect(john!.communication_frequency).toBe('monthly')
    expect(john!.reminders_paused).toBe(false)
  })

  it('should export all contact info with relationships', async () => {
    // Create contact info for export testing
    const contactInfo = [
      { contact_id: testContacts[0].id, type: 'email', label: 'work', value: 'john.doe@company.com', is_primary: true },
      { contact_id: testContacts[0].id, type: 'phone', label: 'mobile', value: '+1-555-0123', is_primary: true },
      { contact_id: testContacts[0].id, type: 'address', label: 'home', value: '123 Main St, Anytown, AN 12345', is_primary: true },
      { contact_id: testContacts[1].id, type: 'email', label: 'personal', value: 'jane@personal.com', is_primary: true },
      { contact_id: testContacts[1].id, type: 'phone', label: 'work', value: '+1-555-0456', is_primary: false },
      { contact_id: testContacts[2].id, type: 'email', label: 'home', value: 'bob@home.com', is_primary: true }
    ]

    await supabase.from(TABLES.CONTACT_INFO).insert(contactInfo)

    // Export contact info data
    const { data: exportedContactInfo, error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .select('*')
      .order('created_at', { ascending: true })

    expect(error).toBeNull()
    expect(exportedContactInfo).toHaveLength(6)

    // Verify complete contact info structure
    exportedContactInfo!.forEach(info => {
      expect(info).toHaveProperty('id')
      expect(info).toHaveProperty('contact_id')
      expect(info).toHaveProperty('type')
      expect(info).toHaveProperty('label')
      expect(info).toHaveProperty('value')
      expect(info).toHaveProperty('is_primary')
      expect(info).toHaveProperty('created_at')
      expect(info).toHaveProperty('updated_at')

      expect(['phone', 'email', 'address']).toContain(info.type)
      expect(['home', 'work', 'mobile', 'other']).toContain(info.label)
      expect(typeof info.is_primary).toBe('boolean')
    })
  })

  it('should export all interactions with complete history', async () => {
    // Create comprehensive interaction history
    const interactions = [
      {
        contact_id: testContacts[0].id, // John
        type: 'call',
        notes: 'Initial catch-up call about work and life changes. Discussed his new job at tech startup.',
        interaction_date: new Date('2024-01-01T10:00:00Z').toISOString()
      },
      {
        contact_id: testContacts[0].id, // John
        type: 'email',
        notes: 'Follow-up email with resources about React development he mentioned needing.',
        interaction_date: new Date('2024-01-05T14:30:00Z').toISOString()
      },
      {
        contact_id: testContacts[0].id, // John
        type: 'meetup',
        notes: 'Coffee meeting downtown. Great conversation about industry trends and mutual connections.',
        interaction_date: new Date('2024-01-15T16:00:00Z').toISOString()
      },
      {
        contact_id: testContacts[1].id, // Jane
        type: 'text',
        notes: 'Quick check-in about weekend running plans. Confirmed Saturday morning 8am start.',
        interaction_date: new Date('2024-01-10T19:30:00Z').toISOString()
      },
      {
        contact_id: testContacts[1].id, // Jane
        type: 'call',
        notes: 'Long conversation about her promotion and new team responsibilities. Very excited about challenges.',
        interaction_date: new Date('2024-01-18T12:00:00Z').toISOString()
      },
      {
        contact_id: testContacts[2].id, // Bob
        type: 'email',
        notes: 'Birthday wishes and update on family news. He shared photos from recent vacation.',
        interaction_date: new Date('2023-12-20T11:00:00Z').toISOString()
      }
    ]

    await supabase.from(TABLES.INTERACTIONS).insert(interactions)

    // Export interactions data
    const { data: exportedInteractions, error } = await supabase
      .from(TABLES.INTERACTIONS)
      .select('*')
      .order('interaction_date', { ascending: true })

    expect(error).toBeNull()
    expect(exportedInteractions).toHaveLength(6)

    // Verify complete interaction structure
    exportedInteractions!.forEach(interaction => {
      expect(interaction).toHaveProperty('id')
      expect(interaction).toHaveProperty('contact_id')
      expect(interaction).toHaveProperty('type')
      expect(interaction).toHaveProperty('notes')
      expect(interaction).toHaveProperty('interaction_date')
      expect(interaction).toHaveProperty('created_at')
      expect(interaction).toHaveProperty('updated_at')

      expect(['call', 'text', 'email', 'meetup', 'other']).toContain(interaction.type)
      expect(typeof interaction.notes).toBe('string')
      expect(interaction.notes.length).toBeGreaterThan(0)
    })

    // Verify chronological ordering
    const dates = exportedInteractions!.map(i => new Date(i.interaction_date).getTime())
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i]).toBeGreaterThanOrEqual(dates[i - 1])
    }
  })

  it('should export all reminders with complete scheduling data', async () => {
    // Create comprehensive reminder data
    const reminders = [
      {
        contact_id: testContacts[0].id, // John
        type: 'communication',
        scheduled_for: new Date('2024-02-15T10:00:00Z').toISOString(),
        status: 'pending',
        message: 'Monthly check-in reminder for John - discuss project updates'
      },
      {
        contact_id: testContacts[0].id, // John
        type: 'birthday_week',
        scheduled_for: new Date('2024-06-08T09:00:00Z').toISOString(),
        status: 'pending',
        message: 'John\'s birthday is coming up next week (June 15)'
      },
      {
        contact_id: testContacts[1].id, // Jane
        type: 'communication',
        scheduled_for: new Date('2024-01-27T10:00:00Z').toISOString(),
        status: 'sent',
        message: 'Weekly check-in reminder for Jane',
        sent_at: new Date('2024-01-27T10:05:00Z').toISOString()
      },
      {
        contact_id: testContacts[1].id, // Jane
        type: 'birthday_day',
        scheduled_for: new Date('2024-12-25T09:00:00Z').toISOString(),
        status: 'pending',
        message: 'Today is Jane\'s birthday! 🎉'
      },
      {
        contact_id: testContacts[2].id, // Bob
        type: 'communication',
        scheduled_for: new Date('2024-01-20T10:00:00Z').toISOString(),
        status: 'dismissed',
        message: 'Quarterly reminder for Bob (reminders currently paused)'
      }
    ]

    await supabase.from(TABLES.REMINDERS).insert(reminders)

    // Export reminders data
    const { data: exportedReminders, error } = await supabase
      .from(TABLES.REMINDERS)
      .select('*')
      .order('scheduled_for', { ascending: true })

    expect(error).toBeNull()
    expect(exportedReminders).toHaveLength(5)

    // Verify complete reminder structure
    exportedReminders!.forEach(reminder => {
      expect(reminder).toHaveProperty('id')
      expect(reminder).toHaveProperty('contact_id')
      expect(reminder).toHaveProperty('type')
      expect(reminder).toHaveProperty('scheduled_for')
      expect(reminder).toHaveProperty('status')
      expect(reminder).toHaveProperty('message')
      expect(reminder).toHaveProperty('created_at')
      expect(reminder).toHaveProperty('sent_at')

      expect(['communication', 'birthday_week', 'birthday_day']).toContain(reminder.type)
      expect(['pending', 'sent', 'dismissed']).toContain(reminder.status)
      expect(typeof reminder.message).toBe('string')
      expect(reminder.message.length).toBeGreaterThan(0)
    })

    // Verify sent_at is properly set for sent reminders
    const sentReminder = exportedReminders!.find(r => r.status === 'sent')
    expect(sentReminder!.sent_at).toBeTruthy()

    const pendingReminder = exportedReminders!.find(r => r.status === 'pending')
    expect(pendingReminder!.sent_at).toBeNull()
  })

  it('should export data with relationships intact', async () => {
    // Create related data across all tables
    await supabase.from(TABLES.CONTACT_INFO).insert([
      { contact_id: testContacts[0].id, type: 'email', label: 'work', value: 'john@work.com', is_primary: true }
    ])

    await supabase.from(TABLES.INTERACTIONS).insert([
      { contact_id: testContacts[0].id, type: 'call', notes: 'Work discussion', interaction_date: new Date().toISOString() }
    ])

    await supabase.from(TABLES.REMINDERS).insert([
      { contact_id: testContacts[0].id, type: 'communication', scheduled_for: new Date().toISOString(), status: 'pending', message: 'Follow up' }
    ])

    // Export with relationships
    const { data: contactsWithRelations, error } = await supabase
      .from(TABLES.CONTACTS)
      .select(`
        *,
        contact_info:${TABLES.CONTACT_INFO}(*),
        interactions:${TABLES.INTERACTIONS}(*),
        reminders:${TABLES.REMINDERS}(*)
      `)

    expect(error).toBeNull()
    expect(contactsWithRelations).toBeTruthy()

    // Verify John has all related data
    const johnWithRelations = contactsWithRelations!.find(c => c.first_name === 'John')
    expect(johnWithRelations!.contact_info).toHaveLength(1)
    expect(johnWithRelations!.interactions).toHaveLength(1)
    expect(johnWithRelations!.reminders).toHaveLength(1)
  })

  it('should export data in different formats/structures', async () => {
    // Test different export query structures

    // Flat export - all contacts with selected fields
    const { data: flatExport, error: flatError } = await supabase
      .from(TABLES.CONTACTS)
      .select('first_name, last_name, birthday, communication_frequency, notes')

    expect(flatError).toBeNull()
    expect(flatExport).toHaveLength(3)
    flatExport!.forEach(contact => {
      expect(contact).not.toHaveProperty('id')
      expect(contact).not.toHaveProperty('created_at')
      expect(contact).toHaveProperty('first_name')
      expect(contact).toHaveProperty('notes')
    })

    // Filtered export - only contacts with birthdays
    const { data: birthdayExport, error: birthdayError } = await supabase
      .from(TABLES.CONTACTS)
      .select('*')
      .not('birthday', 'is', null)

    expect(birthdayError).toBeNull()
    expect(birthdayExport).toHaveLength(2) // John and Jane have birthdays
    birthdayExport!.forEach(contact => {
      expect(contact.birthday).toBeTruthy()
    })
  })

  it('should handle large dataset export efficiently', async () => {
    // Create larger dataset for performance testing
    const batchSize = 50
    const contactsBatch = Array.from({ length: batchSize }, (_, i) => ({
      first_name: `Contact${i}`,
      last_name: `LastName${i}`,
      reminders_paused: false,
      notes: `Test contact ${i} for export performance testing`
    }))

    await supabase.from(TABLES.CONTACTS).insert(contactsBatch)

    const startTime = Date.now()

    // Export all contacts
    const { data: allContacts, error } = await supabase
      .from(TABLES.CONTACTS)
      .select('*')

    const endTime = Date.now()
    const duration = endTime - startTime

    expect(error).toBeNull()
    expect(allContacts).toHaveLength(53) // 3 original + 50 batch

    // Should complete export in reasonable time
    expect(duration).toBeLessThan(5000) // Within 5 seconds
  })

  it('should export data with proper ordering for consistency', async () => {
    // Export with consistent ordering
    const { data: orderedContacts, error: contactsError } = await supabase
      .from(TABLES.CONTACTS)
      .select('*')
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true })

    expect(contactsError).toBeNull()
    expect(orderedContacts![0].last_name).toBe('Doe') // John Doe
    expect(orderedContacts![1].last_name).toBe('Johnson') // Bob Johnson  
    expect(orderedContacts![2].last_name).toBe('Smith') // Jane Smith
  })

  it('should export data with date range filtering', async () => {
    // Add interactions with different dates
    const interactionsBatch = [
      { contact_id: testContacts[0].id, type: 'call', notes: '2023 interaction', interaction_date: new Date('2023-06-15T10:00:00Z').toISOString() },
      { contact_id: testContacts[1].id, type: 'email', notes: '2024 Q1 interaction', interaction_date: new Date('2024-01-15T10:00:00Z').toISOString() },
      { contact_id: testContacts[2].id, type: 'text', notes: 'Recent interaction', interaction_date: new Date('2024-01-25T10:00:00Z').toISOString() }
    ]

    await supabase.from(TABLES.INTERACTIONS).insert(interactionsBatch)

    // Export only 2024 interactions
    const { data: filtered2024, error: filterError } = await supabase
      .from(TABLES.INTERACTIONS)
      .select('*')
      .gte('interaction_date', '2024-01-01T00:00:00Z')
      .lt('interaction_date', '2025-01-01T00:00:00Z')

    expect(filterError).toBeNull()
    expect(filtered2024).toHaveLength(2) // 2024 Q1 and Recent interactions

    filtered2024!.forEach(interaction => {
      const year = new Date(interaction.interaction_date).getFullYear()
      expect(year).toBe(2024)
    })
  })

  it('should handle export errors gracefully', async () => {
    // Test export queries that should handle errors properly
    
    // Invalid column name should fail gracefully
    const { data: invalidColumn, error: invalidError } = await supabase
      .from(TABLES.CONTACTS)
      .select('invalid_column_name')

    expect(invalidError).toBeTruthy()
    expect(invalidColumn).toBeNull()

    // Valid queries should still work
    const { data: validExport, error: validError } = await supabase
      .from(TABLES.CONTACTS)
      .select('first_name, last_name')

    expect(validError).toBeNull()
    expect(validExport).toHaveLength(3)
  })

  it('should complete full data export in reasonable time', async () => {
    // Add some data to all tables for complete export test
    await supabase.from(TABLES.CONTACT_INFO).insert([
      { contact_id: testContacts[0].id, type: 'email', label: 'work', value: 'export@test.com', is_primary: true }
    ])

    await supabase.from(TABLES.INTERACTIONS).insert([
      { contact_id: testContacts[0].id, type: 'call', notes: 'Export test interaction', interaction_date: new Date().toISOString() }
    ])

    await supabase.from(TABLES.REMINDERS).insert([
      { contact_id: testContacts[0].id, type: 'communication', scheduled_for: new Date().toISOString(), status: 'pending', message: 'Export test reminder' }
    ])

    const startTime = Date.now()

    // Run all export queries
    const exportQueries = await Promise.all([
      supabase.from(TABLES.CONTACTS).select('*'),
      supabase.from(TABLES.CONTACT_INFO).select('*'),
      supabase.from(TABLES.INTERACTIONS).select('*'),
      supabase.from(TABLES.REMINDERS).select('*')
    ])

    const endTime = Date.now()
    const duration = endTime - startTime

    // All exports should succeed
    exportQueries.forEach(result => {
      expect(result.error).toBeNull()
    })

    // Should complete full export in reasonable time
    expect(duration).toBeLessThan(5000) // Within 5 seconds for complete export
  })
})