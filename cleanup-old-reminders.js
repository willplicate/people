// Cleanup script to dismiss old pending reminders that shouldn't exist
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://tdclhoimzksmqmnsaccw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkY2xob2ltemtzbXFtbnNhY2N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NzAxMjUsImV4cCI6MjA3MjI0NjEyNX0.lkxHRLuT4liiDJWt4AnSk24rFY5E3sceyApZ7kVTGL4'
)

async function cleanupReminders() {
  console.log('Fetching all contacts and reminders...')

  // Get all contacts
  const { data: contacts } = await supabase
    .from('personal_contacts')
    .select('*')

  let totalDismissed = 0

  for (const contact of contacts || []) {
    if (!contact.communication_frequency || !contact.last_contacted_at) {
      continue
    }

    // Get all pending reminders for this contact
    const { data: reminders } = await supabase
      .from('personal_reminders')
      .select('*')
      .eq('contact_id', contact.id)
      .eq('status', 'pending')
      .order('scheduled_for', { ascending: true })

    if (!reminders || reminders.length <= 1) {
      continue // If 0 or 1 reminder, nothing to clean up
    }

    // Calculate when the next reminder SHOULD be
    const lastContacted = new Date(contact.last_contacted_at)
    const frequencyDays = {
      daily: 1,
      weekly: 7,
      biweekly: 14,
      monthly: 30,
      quarterly: 90,
      biannual: 180,
      annual: 365
    }[contact.communication_frequency]

    const correctNextDate = new Date(lastContacted)
    correctNextDate.setDate(correctNextDate.getDate() + frequencyDays)

    console.log(`\n${contact.first_name} ${contact.last_name}:`)
    console.log(`  Last contacted: ${contact.last_contacted_at}`)
    console.log(`  Frequency: ${contact.communication_frequency}`)
    console.log(`  Should have reminder around: ${correctNextDate.toISOString()}`)
    console.log(`  Has ${reminders.length} pending reminders:`)

    // Keep only the one closest to the correct date, dismiss the rest
    let closestReminder = reminders[0]
    let closestDiff = Math.abs(new Date(reminders[0].scheduled_for).getTime() - correctNextDate.getTime())

    for (const reminder of reminders) {
      const diff = Math.abs(new Date(reminder.scheduled_for).getTime() - correctNextDate.getTime())
      console.log(`    - ${reminder.scheduled_for} (diff: ${Math.round(diff / (1000 * 60 * 60 * 24))} days)`)

      if (diff < closestDiff) {
        closestReminder = reminder
        closestDiff = diff
      }
    }

    // Dismiss all except the closest one
    for (const reminder of reminders) {
      if (reminder.id !== closestReminder.id) {
        console.log(`  ✗ Dismissing: ${reminder.scheduled_for}`)
        await supabase
          .from('personal_reminders')
          .update({ status: 'dismissed', sent_at: new Date().toISOString() })
          .eq('id', reminder.id)
        totalDismissed++
      } else {
        console.log(`  ✓ Keeping: ${reminder.scheduled_for}`)
      }
    }
  }

  console.log(`\n=== CLEANUP COMPLETE ===`)
  console.log(`Total reminders dismissed: ${totalDismissed}`)
}

cleanupReminders().catch(console.error)
