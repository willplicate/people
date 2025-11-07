import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { JournalService } from '@/services/JournalService'
import { supabase } from '@/lib/supabase'

describe('Integration Test: Journal Entry Management', () => {
  // Store created entry IDs for cleanup
  const createdEntryIds: string[] = []

  afterEach(async () => {
    // Clean up test data
    for (const id of createdEntryIds) {
      try {
        await JournalService.delete(id)
      } catch (error) {
        console.warn('Failed to delete test entry:', id, error)
      }
    }
    createdEntryIds.length = 0
  })

  describe('Creating and Retrieving Entries', () => {
    it('should create a new journal entry for a specific date', async () => {
      const testDate = '2024-01-15'
      const testText = 'This is a test entry for learning about integration tests.'

      const entry = await JournalService.createEntry({
        date: testDate,
        text: testText
      })

      createdEntryIds.push(entry.id)

      expect(entry).toBeDefined()
      expect(entry.date).toBe(testDate)
      expect(entry.content).toHaveLength(1)
      expect(entry.content[0].text).toBe(testText)
      expect(entry.content[0].timestamp).toBeDefined()
      expect(entry.created_by).toBeDefined()
      expect(entry.created_at).toBeDefined()
    })

    it('should retrieve an entry by date', async () => {
      const testDate = '2024-01-16'
      const testText = 'Another test entry'

      const created = await JournalService.createEntry({
        date: testDate,
        text: testText
      })
      createdEntryIds.push(created.id)

      const retrieved = await JournalService.getByDate(testDate)

      expect(retrieved).toBeDefined()
      expect(retrieved?.id).toBe(created.id)
      expect(retrieved?.date).toBe(testDate)
      expect(retrieved?.content[0].text).toBe(testText)
    })

    it('should return null when retrieving non-existent entry', async () => {
      const nonExistentDate = '1999-12-31'
      const entry = await JournalService.getByDate(nonExistentDate)

      expect(entry).toBeNull()
    })
  })

  describe('Appending to Entries', () => {
    it('should append text to an existing entry', async () => {
      const testDate = '2024-01-17'
      const firstText = 'First reflection of the day'
      const secondText = 'Second reflection later in the day'

      // Create initial entry
      const created = await JournalService.createEntry({
        date: testDate,
        text: firstText
      })
      createdEntryIds.push(created.id)

      // Wait a moment to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 100))

      // Append to the entry
      const updated = await JournalService.appendToEntry(testDate, {
        text: secondText
      })

      expect(updated.id).toBe(created.id)
      expect(updated.content).toHaveLength(2)
      expect(updated.content[0].text).toBe(firstText)
      expect(updated.content[1].text).toBe(secondText)
      expect(updated.content[0].timestamp).not.toBe(updated.content[1].timestamp)
    })

    it('should create a new entry when appending to a non-existent date', async () => {
      const testDate = '2024-01-18'
      const testText = 'Creating via append'

      const entry = await JournalService.appendToEntry(testDate, {
        text: testText
      })
      createdEntryIds.push(entry.id)

      expect(entry).toBeDefined()
      expect(entry.date).toBe(testDate)
      expect(entry.content).toHaveLength(1)
      expect(entry.content[0].text).toBe(testText)
    })

    it('should allow multiple appends to the same entry', async () => {
      const testDate = '2024-01-19'
      const texts = [
        'Morning reflection',
        'Afternoon insight',
        'Evening learning'
      ]

      // Create initial entry
      const created = await JournalService.createEntry({
        date: testDate,
        text: texts[0]
      })
      createdEntryIds.push(created.id)

      // Append twice more
      for (let i = 1; i < texts.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 100))
        await JournalService.appendToEntry(testDate, { text: texts[i] })
      }

      // Retrieve and verify
      const final = await JournalService.getByDate(testDate)
      expect(final?.content).toHaveLength(3)
      texts.forEach((text, i) => {
        expect(final?.content[i].text).toBe(text)
      })
    })
  })

  describe('Recent Entries', () => {
    it('should retrieve recent entries in descending date order', async () => {
      const dates = ['2024-01-20', '2024-01-21', '2024-01-22']
      const entries = []

      // Create entries for different dates
      for (const date of dates) {
        const entry = await JournalService.createEntry({
          date,
          text: `Entry for ${date}`
        })
        createdEntryIds.push(entry.id)
        entries.push(entry)
      }

      const recent = await JournalService.getRecentEntries(5)

      // Find our test entries
      const testEntries = recent.filter(e =>
        dates.includes(e.date)
      )

      expect(testEntries.length).toBeGreaterThanOrEqual(3)

      // Verify descending order
      const testDates = testEntries.map(e => e.date)
      const sortedDates = [...testDates].sort((a, b) => b.localeCompare(a))
      expect(testDates).toEqual(sortedDates)
    })

    it('should respect the limit parameter', async () => {
      const recent = await JournalService.getRecentEntries(2)
      expect(recent.length).toBeLessThanOrEqual(2)
    })
  })

  describe('Streak Calculation', () => {
    it('should calculate streak correctly', async () => {
      // Note: Streak calculation depends on real-time data and today's date
      // This test just verifies the function runs without error
      const streak = await JournalService.getCurrentStreak()

      expect(typeof streak).toBe('number')
      expect(streak).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Date Range Queries', () => {
    it('should retrieve entries within a date range', async () => {
      const dates = ['2024-02-01', '2024-02-05', '2024-02-10']

      // Create entries
      for (const date of dates) {
        const entry = await JournalService.createEntry({
          date,
          text: `Entry for ${date}`
        })
        createdEntryIds.push(entry.id)
      }

      // Query range that includes all dates
      const entries = await JournalService.getEntriesByDateRange('2024-02-01', '2024-02-10')

      const testEntries = entries.filter(e => dates.includes(e.date))
      expect(testEntries.length).toBe(3)
    })

    it('should not retrieve entries outside the date range', async () => {
      const insideDate = '2024-03-05'
      const outsideDate = '2024-03-15'

      // Create entries
      const insideEntry = await JournalService.createEntry({
        date: insideDate,
        text: 'Inside range'
      })
      createdEntryIds.push(insideEntry.id)

      const outsideEntry = await JournalService.createEntry({
        date: outsideDate,
        text: 'Outside range'
      })
      createdEntryIds.push(outsideEntry.id)

      // Query narrow range
      const entries = await JournalService.getEntriesByDateRange('2024-03-01', '2024-03-10')

      const foundInside = entries.some(e => e.id === insideEntry.id)
      const foundOutside = entries.some(e => e.id === outsideEntry.id)

      expect(foundInside).toBe(true)
      expect(foundOutside).toBe(false)
    })
  })

  describe('Entry Deletion', () => {
    it('should delete an entry successfully', async () => {
      const testDate = '2024-04-01'
      const entry = await JournalService.createEntry({
        date: testDate,
        text: 'To be deleted'
      })

      // Delete the entry
      await JournalService.delete(entry.id)

      // Verify it's gone
      const retrieved = await JournalService.getByDate(testDate)
      expect(retrieved).toBeNull()
    })
  })
})
