// Debug script to check reminder states
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://tdclhoimzksmqmnsaccw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkY2xob2ltemtzbXFtbnNhY2N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NzAxMjUsImV4cCI6MjA3MjI0NjEyNX0.lkxHRLuT4liiDJWt4AnSk24rFY5E3sceyApZ7kVTGL4'
)

async function checkReminders() {
  // Get contacts named Laura, Alexis, Aaron
  const { data: contacts } = await supabase
    .from('personal_contacts')
    .select('id, first_name, last_name, last_contacted_at, communication_frequency')
    .or('first_name.eq.Laura,first_name.eq.Alexis,first_name.eq.Aaron')

  console.log('\n=== CONTACTS ===')
  for (const contact of contacts || []) {
    console.log(`\n${contact.first_name} ${contact.last_name}:`)
    console.log(`  ID: ${contact.id}`)
    console.log(`  Last Contacted: ${contact.last_contacted_at}`)
    console.log(`  Frequency: ${contact.communication_frequency}`)

    // Get all reminders for this contact
    const { data: reminders } = await supabase
      .from('personal_reminders')
      .select('*')
      .eq('contact_id', contact.id)
      .order('scheduled_for', { ascending: false })

    console.log(`  Reminders (${reminders?.length || 0}):`)
    for (const reminder of reminders || []) {
      console.log(`    - Status: ${reminder.status}, Scheduled: ${reminder.scheduled_for}, Type: ${reminder.type}`)
    }
  }
}

checkReminders().catch(console.error)
