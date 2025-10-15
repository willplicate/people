// Fix all pending reminders to match current last_contacted_at dates
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://tdclhoimzksmqmnsaccw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkY2xob2ltemtzbXFtbnNhY2N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NzAxMjUsImV4cCI6MjA3MjI0NjEyNX0.lkxHRLuT4liiDJWt4AnSk24rFY5E3sceyApZ7kVTGL4'
)

const FREQUENCY_DAYS = {
  daily: 1,
  weekly: 7,
  biweekly: 14,
  monthly: 30,
  quarterly: 90,
  biannual: 180,
  biannually: 180,  // Support both forms
  annual: 365,
  annually: 365
}

async function fixReminders() {
  console.log('Fetching all contacts with pending reminders...\n')

  // Get all contacts with communication frequency
  const { data: contacts } = await supabase
    .from('personal_contacts')
    .select('*')
    .not('communication_frequency', 'is', null)

  let fixed = 0
  let dismissed = 0

  for (const contact of contacts || []) {
    const { data: reminders } = await supabase
      .from('personal_reminders')
      .select('*')
      .eq('contact_id', contact.id)
      .eq('status', 'pending')
      .eq('type', 'communication')

    if (!reminders || reminders.length === 0) {
      continue
    }

    // Calculate correct next reminder date
    const lastContacted = contact.last_contacted_at ? new Date(contact.last_contacted_at) : new Date()
    const frequencyDays = FREQUENCY_DAYS[contact.communication_frequency]
    const correctDate = new Date(lastContacted)
    correctDate.setDate(correctDate.getDate() + frequencyDays)

    const now = new Date()
    const daysSinceContact = Math.floor((now - lastContacted) / (1000 * 60 * 60 * 24))

    console.log(`${contact.first_name} ${contact.last_name}:`)
    console.log(`  Last contacted: ${daysSinceContact} days ago (${contact.last_contacted_at})`)
    console.log(`  Frequency: ${contact.communication_frequency} (${frequencyDays} days)`)
    console.log(`  Correct next reminder: ${correctDate.toISOString().split('T')[0]}`)
    console.log(`  Current reminders: ${reminders.length}`)

    // Dismiss all current reminders
    for (const reminder of reminders) {
      const scheduledDate = new Date(reminder.scheduled_for)
      const diff = Math.abs(scheduledDate - correctDate) / (1000 * 60 * 60 * 24)

      console.log(`    - ${reminder.scheduled_for.split('T')[0]} (${Math.round(diff)} days off) - dismissing`)

      await supabase
        .from('personal_reminders')
        .update({ status: 'dismissed' })
        .eq('id', reminder.id)

      dismissed++
    }

    // Create new reminder with correct date
    console.log(`  ✓ Creating new reminder for ${correctDate.toISOString().split('T')[0]}`)

    await supabase
      .from('personal_reminders')
      .insert({
        contact_id: contact.id,
        type: 'communication',
        status: 'pending',
        scheduled_for: correctDate.toISOString(),
        message: `Time to contact ${contact.first_name} ${contact.last_name}`
      })

    fixed++
    console.log('')
  }

  console.log(`=== COMPLETE ===`)
  console.log(`Contacts fixed: ${fixed}`)
  console.log(`Old reminders dismissed: ${dismissed}`)
}

fixReminders().catch(console.error)
