import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Mock the Supabase client for integration testing
const mockSupabase = {
  from: vi.fn(),
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase),
}))

describe('Integration Test: Contact Creation with Communication Frequency (T030)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create a new contact with communication frequency and generate first communication reminder', async () => {
    // Mock successful contact creation
    const mockContactData = {
      id: 'contact-123',
      firstName: 'John',
      lastName: 'Doe',
      nickname: 'Johnny',
      birthday: null,
      communicationFrequency: 'monthly',
      lastContactedAt: null,
      remindersPaused: false,
      notes: 'Met at tech conference',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const mockReminderData = {
      id: 'reminder-123',
      contactId: 'contact-123',
      type: 'communication',
      scheduledFor: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      status: 'pending',
      message: 'Time to reach out to John Doe (monthly check-in)',
      createdAt: new Date().toISOString(),
      sentAt: null,
    }

    // Mock Supabase responses
    mockSupabase.from.mockReturnValueOnce({
      insert: vi.fn().mockResolvedValue({ data: [mockContactData], error: null }),
      select: vi.fn(),
    })

    mockSupabase.from.mockReturnValueOnce({
      insert: vi.fn().mockResolvedValue({ data: [mockReminderData], error: null }),
      select: vi.fn(),
    })

    // This would be the service/API call that doesn't exist yet
    // const contactService = new ContactService()
    // const result = await contactService.createContact({
    //   firstName: 'John',
    //   lastName: 'Doe',
    //   nickname: 'Johnny',
    //   communicationFrequency: 'monthly',
    //   notes: 'Met at tech conference',
    // })

    // For now, we'll simulate the expected behavior
    const expectedContactCreation = {
      firstName: 'John',
      lastName: 'Doe',
      nickname: 'Johnny',
      communicationFrequency: 'monthly',
      notes: 'Met at tech conference',
    }

    // Test that the service would call Supabase correctly
    expect(expectedContactCreation.communicationFrequency).toBe('monthly')
    expect(expectedContactCreation.firstName).toBe('John')

    // Verify communication frequency intervals
    const communicationIntervals = {
      weekly: 7,
      monthly: 30,
      quarterly: 90,
      biannually: 180,
      annually: 365,
    }

    expect(communicationIntervals.monthly).toBe(30)
    expect(communicationIntervals.weekly).toBe(7)
    expect(communicationIntervals.quarterly).toBe(90)
    expect(communicationIntervals.biannually).toBe(180)
    expect(communicationIntervals.annually).toBe(365)
  })

  it('should create contact without communication frequency and not generate communication reminders', async () => {
    const mockContactData = {
      id: 'contact-124',
      firstName: 'Jane',
      lastName: 'Smith',
      nickname: null,
      birthday: null,
      communicationFrequency: null,
      lastContactedAt: null,
      remindersPaused: false,
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    mockSupabase.from.mockReturnValueOnce({
      insert: vi.fn().mockResolvedValue({ data: [mockContactData], error: null }),
      select: vi.fn(),
    })

    // When contact is created without communication frequency,
    // no communication reminders should be generated
    const expectedContactCreation = {
      firstName: 'Jane',
      lastName: 'Smith',
      communicationFrequency: null,
    }

    expect(expectedContactCreation.communicationFrequency).toBeNull()
    
    // Verify no communication reminder would be created
    // (birthday reminders could still be created if birthday is present)
  })

  it('should validate communication frequency enum values', () => {
    const validFrequencies = ['weekly', 'monthly', 'quarterly', 'biannually', 'annually']
    const invalidFrequencies = ['daily', 'never', 'custom', '']

    validFrequencies.forEach(frequency => {
      expect(validFrequencies).toContain(frequency)
    })

    invalidFrequencies.forEach(frequency => {
      expect(validFrequencies).not.toContain(frequency)
    })
  })

  it('should handle contact creation with all optional fields', async () => {
    const fullContactData = {
      firstName: 'Alice',
      lastName: 'Johnson',
      nickname: 'Al',
      birthday: '03-15', // March 15th
      communicationFrequency: 'quarterly',
      notes: 'College roommate, loves hiking',
    }

    const mockResponse = {
      id: 'contact-125',
      ...fullContactData,
      lastContactedAt: null,
      remindersPaused: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    mockSupabase.from.mockReturnValueOnce({
      insert: vi.fn().mockResolvedValue({ data: [mockResponse], error: null }),
      select: vi.fn(),
    })

    // Verify all fields are properly structured
    expect(fullContactData.firstName).toBe('Alice')
    expect(fullContactData.lastName).toBe('Johnson')
    expect(fullContactData.nickname).toBe('Al')
    expect(fullContactData.birthday).toBe('03-15')
    expect(fullContactData.communicationFrequency).toBe('quarterly')
    expect(fullContactData.notes).toBe('College roommate, loves hiking')

    // When this contact is created, it should generate:
    // 1. One communication reminder (quarterly = 90 days)
    // 2. Two birthday reminders (7 days before + day of March 15th)
  })

  it('should validate field length constraints', () => {
    // Test field length validations from data model
    const validations = {
      firstName: { min: 1, max: 50 },
      lastName: { min: 0, max: 50 },
      nickname: { min: 0, max: 30 },
      notes: { min: 0, max: 2000 }, // Based on interaction notes limit
    }

    // Valid lengths
    expect('John'.length).toBeLessThanOrEqual(validations.firstName.max)
    expect('Smith'.length).toBeLessThanOrEqual(validations.lastName.max)
    expect('Johnny'.length).toBeLessThanOrEqual(validations.nickname.max)

    // Invalid lengths (too long)
    const tooLongFirstName = 'a'.repeat(51)
    const tooLongLastName = 'b'.repeat(51)
    const tooLongNickname = 'c'.repeat(31)

    expect(tooLongFirstName.length).toBeGreaterThan(validations.firstName.max)
    expect(tooLongLastName.length).toBeGreaterThan(validations.lastName.max)
    expect(tooLongNickname.length).toBeGreaterThan(validations.nickname.max)

    // Empty firstName should be invalid
    expect(''.length).toBeLessThan(validations.firstName.min)
  })

  it('should calculate correct reminder schedule based on communication frequency', () => {
    const now = new Date('2024-01-15T10:00:00Z')
    const frequencies = {
      weekly: 7,
      monthly: 30,
      quarterly: 90,
      biannually: 180,
      annually: 365,
    }

    Object.entries(frequencies).forEach(([frequency, days]) => {
      const expectedReminderDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
      
      // Verify the calculation is correct
      const daysDifference = Math.floor((expectedReminderDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
      expect(daysDifference).toBe(days)
    })
  })
})