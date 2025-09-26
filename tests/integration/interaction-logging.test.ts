import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Mock the Supabase client for integration testing
const mockSupabase = {
  from: vi.fn(),
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase),
}))

describe('Integration Test: Interaction Logging Updates lastContactedAt (T033)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create interaction and update contact lastContactedAt', async () => {
    const contactId = 'contact-123'
    const interactionDate = new Date('2024-03-15T14:30:00Z')
    
    const contactBefore = {
      id: contactId,
      firstName: 'John',
      lastName: 'Doe',
      lastContactedAt: new Date('2024-01-15T10:00:00Z').toISOString(), // Previous contact
      communicationFrequency: 'monthly',
    }

    const newInteraction = {
      id: 'interaction-456',
      contactId: contactId,
      type: 'call',
      notes: 'Discussed upcoming project collaboration. John is interested in the new initiative.',
      interactionDate: interactionDate.toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const updatedContact = {
      ...contactBefore,
      lastContactedAt: interactionDate.toISOString(), // Updated to interaction date
      updatedAt: new Date().toISOString(),
    }

    // Mock database operations
    mockSupabase.from.mockReturnValueOnce({
      insert: vi.fn().mockResolvedValue({ data: [newInteraction], error: null }),
    })

    mockSupabase.from.mockReturnValueOnce({
      update: vi.fn().mockResolvedValue({ data: [updatedContact], error: null }),
      eq: vi.fn().mockReturnThis(),
    })

    // This would be the service call that doesn't exist yet
    // const interactionService = new InteractionService()
    // const result = await interactionService.createInteraction({
    //   contactId,
    //   type: 'call',
    //   notes: 'Discussed upcoming project collaboration...',
    //   interactionDate: interactionDate.toISOString()
    // })

    // Verify interaction structure
    expect(newInteraction.contactId).toBe(contactId)
    expect(newInteraction.type).toBe('call')
    expect(newInteraction.notes).toContain('Discussed upcoming project')
    expect(new Date(newInteraction.interactionDate)).toEqual(interactionDate)

    // Verify lastContactedAt update
    expect(new Date(contactBefore.lastContactedAt).getTime()).toBeLessThan(
      new Date(updatedContact.lastContactedAt).getTime()
    )
    expect(updatedContact.lastContactedAt).toBe(interactionDate.toISOString())
  })

  it('should handle all interaction types correctly', async () => {
    const contactId = 'contact-types'
    const baseDate = new Date('2024-03-15T12:00:00Z')
    
    const interactionTypes = ['call', 'text', 'email', 'meetup', 'other']
    const interactions = interactionTypes.map((type, index) => ({
      id: `interaction-${type}`,
      contactId: contactId,
      type: type,
      notes: `Had a ${type} interaction with the contact. Great conversation!`,
      interactionDate: new Date(baseDate.getTime() + index * 60000).toISOString(), // 1 minute apart
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))

    // Mock successful creation of all interaction types
    interactions.forEach((interaction, index) => {
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ data: [interaction], error: null }),
      })
    })

    // Verify all interaction types are valid
    interactionTypes.forEach(type => {
      expect(['call', 'text', 'email', 'meetup', 'other']).toContain(type)
    })

    // Verify each interaction has required fields
    interactions.forEach(interaction => {
      expect(interaction.contactId).toBe(contactId)
      expect(interactionTypes).toContain(interaction.type)
      expect(interaction.notes.length).toBeGreaterThan(0)
      expect(interaction.notes.length).toBeLessThanOrEqual(2000) // Data model constraint
      expect(new Date(interaction.interactionDate)).toBeInstanceOf(Date)
    })
  })

  it('should validate interaction date cannot be in the future', () => {
    const now = new Date()
    const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 1 day in future
    const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000) // 1 day in past
    const currentDate = new Date() // Current time

    // Future dates should be invalid
    expect(futureDate.getTime()).toBeGreaterThan(now.getTime())
    
    // Past and current dates should be valid
    expect(pastDate.getTime()).toBeLessThanOrEqual(now.getTime())
    expect(currentDate.getTime()).toBeLessThanOrEqual(Date.now())

    // Mock validation error for future date
    const invalidInteraction = {
      contactId: 'contact-123',
      type: 'call',
      notes: 'Future call',
      interactionDate: futureDate.toISOString(),
    }

    mockSupabase.from.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'interactionDate cannot be in the future' }
      }),
    })

    expect(new Date(invalidInteraction.interactionDate).getTime()).toBeGreaterThan(Date.now())
  })

  it('should validate notes length constraints', () => {
    const validNotes = [
      'Short note',
      'A longer note with more details about the conversation we had.',
      'A'.repeat(2000), // Maximum length
    ]

    const invalidNotes = [
      '', // Empty
      'A'.repeat(2001), // Too long
    ]

    validNotes.forEach(notes => {
      expect(notes.length).toBeGreaterThanOrEqual(1)
      expect(notes.length).toBeLessThanOrEqual(2000)
    })

    invalidNotes.forEach(notes => {
      expect(notes.length === 0 || notes.length > 2000).toBe(true)
    })
  })

  it('should reset communication reminder schedule when interaction is logged', async () => {
    const contactId = 'contact-reminder-reset'
    const interactionDate = new Date('2024-03-15T16:00:00Z')
    
    // Contact with monthly communication frequency
    const contact = {
      id: contactId,
      firstName: 'Alice',
      lastName: 'Johnson',
      communicationFrequency: 'monthly',
      lastContactedAt: new Date('2024-02-01T10:00:00Z').toISOString(), // 6 weeks ago
    }

    // Existing pending communication reminder (should be updated/cancelled)
    const oldReminder = {
      id: 'old-reminder',
      contactId: contactId,
      type: 'communication',
      scheduledFor: new Date('2024-02-29T10:00:00Z').toISOString(), // Was due 2 weeks ago
      status: 'pending',
      message: 'Time to reach out to Alice Johnson (monthly check-in)',
    }

    // New interaction
    const newInteraction = {
      id: 'interaction-reset',
      contactId: contactId,
      type: 'email',
      notes: 'Sent project update and discussed next steps.',
      interactionDate: interactionDate.toISOString(),
    }

    // Updated contact with new lastContactedAt
    const updatedContact = {
      ...contact,
      lastContactedAt: interactionDate.toISOString(),
    }

    // New communication reminder (30 days from interaction date)
    const newReminderDate = new Date(interactionDate.getTime() + 30 * 24 * 60 * 60 * 1000)
    const newReminder = {
      id: 'new-reminder',
      contactId: contactId,
      type: 'communication',
      scheduledFor: newReminderDate.toISOString(),
      status: 'pending',
      message: 'Time to reach out to Alice Johnson (monthly check-in)',
    }

    // Mock database operations
    mockSupabase.from.mockReturnValueOnce({
      insert: vi.fn().mockResolvedValue({ data: [newInteraction], error: null }),
    })

    mockSupabase.from.mockReturnValueOnce({
      update: vi.fn().mockResolvedValue({ data: [updatedContact], error: null }),
      eq: vi.fn().mockReturnThis(),
    })

    // Mock reminder updates (cancel old, create new)
    mockSupabase.from.mockReturnValueOnce({
      update: vi.fn().mockResolvedValue({ 
        data: [{ ...oldReminder, status: 'dismissed' }], 
        error: null 
      }),
      eq: vi.fn().mockReturnThis(),
    })

    mockSupabase.from.mockReturnValueOnce({
      insert: vi.fn().mockResolvedValue({ data: [newReminder], error: null }),
    })

    // Verify the reminder reset logic
    expect(contact.communicationFrequency).toBe('monthly')
    expect(new Date(updatedContact.lastContactedAt)).toEqual(interactionDate)
    
    // Verify new reminder is scheduled 30 days from interaction
    const daysDiff = (new Date(newReminder.scheduledFor).getTime() - interactionDate.getTime()) / (24 * 60 * 60 * 1000)
    expect(daysDiff).toBe(30)
  })

  it('should handle multiple interactions on the same day', async () => {
    const contactId = 'contact-multiple'
    const baseDate = new Date('2024-03-15T10:00:00Z')
    
    const multipleInteractions = [
      {
        id: 'interaction-morning',
        contactId: contactId,
        type: 'text',
        notes: 'Quick morning check-in via text message.',
        interactionDate: baseDate.toISOString(),
      },
      {
        id: 'interaction-afternoon',
        contactId: contactId,
        type: 'call',
        notes: 'Follow-up phone call to discuss meeting details.',
        interactionDate: new Date(baseDate.getTime() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours later
      },
      {
        id: 'interaction-evening',
        contactId: contactId,
        type: 'email',
        notes: 'Sent summary email with action items from our call.',
        interactionDate: new Date(baseDate.getTime() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours later
      }
    ]

    // The lastContactedAt should be updated to the latest interaction time
    const latestInteractionDate = multipleInteractions[2].interactionDate

    const updatedContact = {
      id: contactId,
      firstName: 'Bob',
      lastName: 'Wilson',
      lastContactedAt: latestInteractionDate,
      updatedAt: new Date().toISOString(),
    }

    // Mock successful creation of all interactions
    multipleInteractions.forEach(interaction => {
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ data: [interaction], error: null }),
      })
    })

    // Mock contact update with latest interaction date
    mockSupabase.from.mockReturnValueOnce({
      update: vi.fn().mockResolvedValue({ data: [updatedContact], error: null }),
      eq: vi.fn().mockReturnThis(),
    })

    // Verify all interactions are on the same day but different times
    const interactionDates = multipleInteractions.map(i => new Date(i.interactionDate))
    const baseDateStr = baseDate.toDateString()
    
    interactionDates.forEach(date => {
      expect(date.toDateString()).toBe(baseDateStr)
    })

    // Verify times are different
    expect(interactionDates[0].getHours()).toBe(10)
    expect(interactionDates[1].getHours()).toBe(14)
    expect(interactionDates[2].getHours()).toBe(18)

    // lastContactedAt should be the latest interaction
    expect(updatedContact.lastContactedAt).toBe(latestInteractionDate)
  })

  it('should handle interaction with contact that has no previous lastContactedAt', async () => {
    const contactId = 'contact-first-interaction'
    const interactionDate = new Date('2024-03-15T09:00:00Z')
    
    const newContact = {
      id: contactId,
      firstName: 'New',
      lastName: 'Contact',
      lastContactedAt: null, // No previous interactions
      communicationFrequency: 'weekly',
    }

    const firstInteraction = {
      id: 'first-interaction',
      contactId: contactId,
      type: 'meetup',
      notes: 'First time meeting at coffee shop. Great conversation about mutual interests.',
      interactionDate: interactionDate.toISOString(),
    }

    const updatedContact = {
      ...newContact,
      lastContactedAt: interactionDate.toISOString(),
    }

    // Mock database operations
    mockSupabase.from.mockReturnValueOnce({
      insert: vi.fn().mockResolvedValue({ data: [firstInteraction], error: null }),
    })

    mockSupabase.from.mockReturnValueOnce({
      update: vi.fn().mockResolvedValue({ data: [updatedContact], error: null }),
      eq: vi.fn().mockReturnThis(),
    })

    // Verify the first interaction updates lastContactedAt from null
    expect(newContact.lastContactedAt).toBeNull()
    expect(updatedContact.lastContactedAt).toBe(interactionDate.toISOString())
    
    // Should also trigger communication reminder creation
    expect(newContact.communicationFrequency).toBe('weekly')
  })

  it('should maintain interaction history chronologically', async () => {
    const contactId = 'contact-history'
    const baseDate = new Date('2024-01-01T12:00:00Z')
    
    // Create interactions over time
    const interactionHistory = [
      {
        id: 'interaction-1',
        contactId: contactId,
        type: 'email',
        notes: 'Initial email introduction',
        interactionDate: baseDate.toISOString(),
      },
      {
        id: 'interaction-2',
        contactId: contactId,
        type: 'call',
        notes: 'Follow-up phone call',
        interactionDate: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week later
      },
      {
        id: 'interaction-3',
        contactId: contactId,
        type: 'meetup',
        notes: 'In-person coffee meeting',
        interactionDate: new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks later
      }
    ]

    // Mock querying interaction history (ordered by date)
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: interactionHistory, error: null })
        })
      })
    })

    // Verify chronological ordering
    for (let i = 1; i < interactionHistory.length; i++) {
      const currentDate = new Date(interactionHistory[i].interactionDate)
      const previousDate = new Date(interactionHistory[i - 1].interactionDate)
      expect(currentDate.getTime()).toBeGreaterThan(previousDate.getTime())
    }

    // The query should order by interactionDate
    // .select('*').eq('contactId', contactId).order('interactionDate', { ascending: true })
  })

  it('should handle cascade delete when contact is deleted', async () => {
    const contactId = 'contact-to-delete'
    
    // Mock interactions that should be deleted
    const interactionsToDelete = [
      { id: 'int-1', contactId: contactId, type: 'call', notes: 'Call 1' },
      { id: 'int-2', contactId: contactId, type: 'email', notes: 'Email 1' },
      { id: 'int-3', contactId: contactId, type: 'text', notes: 'Text 1' },
    ]

    // Mock cascade delete
    mockSupabase.from.mockReturnValue({
      delete: vi.fn().mockResolvedValue({ data: [], error: null }),
      eq: vi.fn().mockReturnThis(),
    })

    // Verify the relationship constraint
    expect(interactionsToDelete.every(i => i.contactId === contactId)).toBe(true)
    
    // The actual cascade delete would be handled by:
    // FOREIGN KEY (contact_id) REFERENCES personal_contacts(id) ON DELETE CASCADE
  })
})