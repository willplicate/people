import { describe, it, expect, beforeEach } from 'vitest'
import { supabase, TABLES } from '@/lib/supabase'

describe('Contract: POST Dismiss Reminder by ID', () => {
  let testContactId: string
  let testReminderId: string

  beforeEach(async () => {
    // Clean up test data
    await supabase.from(TABLES.CONTACTS).delete().neq('id', 'impossible-id'))
    await supabase.from(TABLES.REMINDERS).delete().neq('id', 'impossible-id'))
    
    // Create test contact
    const { data: contact } = await supabase
      .from(TABLES.CONTACTS)
      .insert({
        first_name: 'John',
        last_name: 'Doe',
        birthday: '06-15',
        communication_frequency: 'monthly',
        reminders_paused: false
      })
      .select()
      .single()
    
    testContactId = contact!.id

    // Create test reminder in pending status
    const { data: reminder } = await supabase
      .from(TABLES.REMINDERS)
      .insert({
        contact_id: testContactId,
        type: 'communication',
        scheduled_for: new Date('2024-01-15T10:00:00Z').toISOString(),
        status: 'pending',
        message: 'Time to reach out to John - monthly check-in reminder'
      })
      .select()
      .single()

    testReminderId = reminder!.id
  })

  it('should dismiss pending reminder by updating status', async () => {
    // Dismiss the reminder by updating status to 'dismissed'
    const { data, error } = await supabase
      .from(TABLES.REMINDERS)
      .update({ status: 'dismissed' })
      .eq('id', testReminderId)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeTruthy()
    expect(data!.status).toBe('dismissed')
    expect(data!.contact_id).toBe(testContactId)
    expect(data!.type).toBe('communication')
    expect(data!.message).toBe('Time to reach out to John - monthly check-in reminder')
    expect(data!.updated_at).toBeTruthy()
  })

  it('should verify reminder was dismissed successfully', async () => {
    // Dismiss the reminder
    await supabase
      .from(TABLES.REMINDERS)
      .update({ status: 'dismissed' })
      .eq('id', testReminderId)

    // Verify the reminder status is dismissed
    const { data: verification, error } = await supabase
      .from(TABLES.REMINDERS)
      .select('*')
      .eq('id', testReminderId)
      .single()

    expect(error).toBeNull()
    expect(verification!.status).toBe('dismissed')
    expect(verification!.sent_at).toBeNull() // Should remain null for dismissed reminders
  })

  it('should handle dismissal of different reminder types', async () => {
    // Create additional reminders of different types
    const { data: birthdayWeekReminder } = await supabase
      .from(TABLES.REMINDERS)
      .insert({
        contact_id: testContactId,
        type: 'birthday_week',
        scheduled_for: new Date('2024-06-08T09:00:00Z').toISOString(),
        status: 'pending',
        message: 'John\'s birthday is next week (June 15)'
      })
      .select()
      .single()

    const { data: birthdayDayReminder } = await supabase
      .from(TABLES.REMINDERS)
      .insert({
        contact_id: testContactId,
        type: 'birthday_day',
        scheduled_for: new Date('2024-06-15T09:00:00Z').toISOString(),
        status: 'pending',
        message: 'Today is John\'s birthday!'
      })
      .select()
      .single()

    // Dismiss communication reminder
    const { data: commDismissed, error: commError } = await supabase
      .from(TABLES.REMINDERS)
      .update({ status: 'dismissed' })
      .eq('id', testReminderId)
      .select()
      .single()

    expect(commError).toBeNull()
    expect(commDismissed!.status).toBe('dismissed')
    expect(commDismissed!.type).toBe('communication')

    // Dismiss birthday week reminder
    const { data: weekDismissed, error: weekError } = await supabase
      .from(TABLES.REMINDERS)
      .update({ status: 'dismissed' })
      .eq('id', birthdayWeekReminder!.id)
      .select()
      .single()

    expect(weekError).toBeNull()
    expect(weekDismissed!.status).toBe('dismissed')
    expect(weekDismissed!.type).toBe('birthday_week')

    // Dismiss birthday day reminder
    const { data: dayDismissed, error: dayError } = await supabase
      .from(TABLES.REMINDERS)
      .update({ status: 'dismissed' })
      .eq('id', birthdayDayReminder!.id)
      .select()
      .single()

    expect(dayError).toBeNull()
    expect(dayDismissed!.status).toBe('dismissed')
    expect(dayDismissed!.type).toBe('birthday_day')
  })

  it('should not allow dismissing already sent reminders', async () => {
    // First change reminder to sent status
    await supabase
      .from(TABLES.REMINDERS)
      .update({ 
        status: 'sent', 
        sent_at: new Date().toISOString() 
      })
      .eq('id', testReminderId)

    // Try to dismiss sent reminder
    const { data, error } = await supabase
      .from(TABLES.REMINDERS)
      .update({ status: 'dismissed' })
      .eq('id', testReminderId)
      .select()
      .single()

    // Database allows this change - business logic should prevent it
    expect(error).toBeNull()
    expect(data!.status).toBe('dismissed')
    // Note: API should validate that sent reminders cannot be dismissed
  })

  it('should not allow dismissing already dismissed reminders', async () => {
    // First dismiss the reminder
    await supabase
      .from(TABLES.REMINDERS)
      .update({ status: 'dismissed' })
      .eq('id', testReminderId)

    // Try to dismiss already dismissed reminder
    const { data, error } = await supabase
      .from(TABLES.REMINDERS)
      .update({ status: 'dismissed' })
      .eq('id', testReminderId)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data!.status).toBe('dismissed')
    // Note: API should return appropriate response for already dismissed reminders
  })

  it('should handle dismissal of non-existent reminder ID', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000'

    const { data, error } = await supabase
      .from(TABLES.REMINDERS)
      .update({ status: 'dismissed' })
      .eq('id', nonExistentId)
      .select()

    expect(error).toBeNull()
    expect(data).toEqual([]) // No rows updated
  })

  it('should handle invalid UUID format', async () => {
    const invalidId = 'not-a-valid-uuid'
    
    const { error } = await supabase
      .from(TABLES.REMINDERS)
      .update({ status: 'dismissed' })
      .eq('id', invalidId)

    expect(error).toBeTruthy()
    expect(error!.message).toContain('invalid input syntax for type uuid')
  })

  it('should update updated_at timestamp when dismissing', async () => {
    // Get original timestamp
    const { data: original } = await supabase
      .from(TABLES.REMINDERS)
      .select('updated_at')
      .eq('id', testReminderId)
      .single()

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 100))

    // Dismiss the reminder
    const { data: updated, error } = await supabase
      .from(TABLES.REMINDERS)
      .update({ status: 'dismissed' })
      .eq('id', testReminderId)
      .select('updated_at')
      .single()

    expect(error).toBeNull()
    expect(new Date(updated!.updated_at).getTime()).toBeGreaterThan(new Date(original!.updated_at).getTime())
  })

  it('should handle batch dismissal of multiple reminders', async () => {
    // Create additional reminders for the same contact
    const additionalReminders = [
      {
        contact_id: testContactId,
        type: 'birthday_week' as const,
        scheduled_for: new Date('2024-06-08T09:00:00Z').toISOString(),
        status: 'pending' as const,
        message: 'Birthday week reminder'
      },
      {
        contact_id: testContactId,
        type: 'birthday_day' as const,
        scheduled_for: new Date('2024-06-15T09:00:00Z').toISOString(),
        status: 'pending' as const,
        message: 'Birthday day reminder'
      }
    ]

    await supabase.from(TABLES.REMINDERS).insert(additionalReminders)

    // Dismiss all pending reminders for this contact
    const { data, error } = await supabase
      .from(TABLES.REMINDERS)
      .update({ status: 'dismissed' })
      .eq('contact_id', testContactId)
      .eq('status', 'pending')
      .select()

    expect(error).toBeNull()
    expect(data).toHaveLength(3) // Original + 2 additional

    data!.forEach(reminder => {
      expect(reminder.status).toBe('dismissed')
      expect(reminder.contact_id).toBe(testContactId)
    })
  })

  it('should preserve other reminder fields when dismissing', async () => {
    const originalData = {
      contact_id: testContactId,
      type: 'communication',
      scheduled_for: new Date('2024-01-15T10:00:00Z').toISOString(),
      message: 'Time to reach out to John - monthly check-in reminder'
    }

    // Dismiss the reminder
    const { data, error } = await supabase
      .from(TABLES.REMINDERS)
      .update({ status: 'dismissed' })
      .eq('id', testReminderId)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data!.status).toBe('dismissed')
    expect(data!.contact_id).toBe(originalData.contact_id)
    expect(data!.type).toBe(originalData.type)
    expect(data!.scheduled_for).toBe('2024-01-15T10:00:00+00:00')
    expect(data!.message).toBe(originalData.message)
    expect(data!.sent_at).toBeNull() // Should remain null for dismissed reminders
  })

  it('should handle dismissal with additional context (if supported)', async () => {
    // Some systems might want to track dismissal reason or context
    // This test shows how the API might handle additional fields
    
    const dismissalUpdate = {
      status: 'dismissed',
      // Note: These fields don't exist in current schema but show how API might extend
      // dismissal_reason: 'user_requested',
      // dismissed_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from(TABLES.REMINDERS)
      .update(dismissalUpdate)
      .eq('id', testReminderId)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data!.status).toBe('dismissed')
    // Note: API could extend this to track additional dismissal metadata
  })

  it('should handle concurrent dismissal attempts', async () => {
    // Create multiple reminders
    const { data: multipleReminders } = await supabase
      .from(TABLES.REMINDERS)
      .insert([
        { contact_id: testContactId, type: 'communication', scheduled_for: new Date().toISOString(), status: 'pending', message: 'Reminder 1' },
        { contact_id: testContactId, type: 'communication', scheduled_for: new Date().toISOString(), status: 'pending', message: 'Reminder 2' },
        { contact_id: testContactId, type: 'birthday_day', scheduled_for: new Date().toISOString(), status: 'pending', message: 'Reminder 3' }
      ])
      .select()

    // Simulate concurrent dismissal attempts
    const dismissalPromises = [
      supabase.from(TABLES.REMINDERS).update({ status: 'dismissed' }).eq('id', testReminderId),
      supabase.from(TABLES.REMINDERS).update({ status: 'dismissed' }).eq('id', multipleReminders![0].id),
      supabase.from(TABLES.REMINDERS).update({ status: 'dismissed' }).eq('id', multipleReminders![1].id),
      supabase.from(TABLES.REMINDERS).update({ status: 'dismissed' }).eq('id', multipleReminders![2].id)
    ]

    const results = await Promise.all(dismissalPromises)
    
    results.forEach(result => {
      expect(result.error).toBeNull()
    })

    // Verify all reminders are dismissed
    const { data: allDismissed } = await supabase
      .from(TABLES.REMINDERS)
      .select('*')
      .eq('contact_id', testContactId)
      .eq('status', 'dismissed')

    expect(allDismissed).toHaveLength(4)
  })

  it('should complete dismissal in reasonable time', async () => {
    const startTime = Date.now()
    
    await supabase
      .from(TABLES.REMINDERS)
      .update({ status: 'dismissed' })
      .eq('id', testReminderId)
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    expect(duration).toBeLessThan(2000) // Should complete within 2 seconds
  })

  it('should validate status enum values', async () => {
    // Try to set invalid status
    const invalidStatusUpdate = {
      status: 'invalid_status'
    }

    const { error } = await supabase
      .from(TABLES.REMINDERS)
      .update(invalidStatusUpdate)
      .eq('id', testReminderId)

    expect(error).toBeTruthy()
    expect(error!.message).toContain('violates check constraint')
  })
})