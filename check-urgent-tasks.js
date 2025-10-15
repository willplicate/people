// Quick script to check urgent tasks in the database
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://tdclhoimzksmqmnsaccw.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkY2xob2ltemtzbXFtbnNhY2N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NzAxMjUsImV4cCI6MjA3MjI0NjEyNX0.lkxHRLuT4liiDJWt4AnSk24rFY5E3sceyApZ7kVTGL4'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkUrgentTasks() {
  console.log('Fetching all urgent tasks...\n')

  const { data: allTasks, error } = await supabase
    .from('urgent_tasks')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log(`Total tasks: ${allTasks.length}`)
  console.log(`Completed tasks: ${allTasks.filter(t => t.is_completed).length}`)
  console.log(`Incomplete tasks: ${allTasks.filter(t => !t.is_completed).length}\n`)

  console.log('All tasks:')
  allTasks.forEach(task => {
    console.log(`  [${task.is_completed ? '✓' : ' '}] ${task.title} (id: ${task.id.substring(0, 8)}...)`)
  })

  console.log('\nTasks that should be hidden (completed):')
  const completedTasks = allTasks.filter(t => t.is_completed)
  completedTasks.forEach(task => {
    console.log(`  ✓ ${task.title}`)
  })

  console.log('\nTasks that should show (incomplete):')
  const incompleteTasks = allTasks.filter(t => !t.is_completed)
  incompleteTasks.forEach(task => {
    console.log(`  - ${task.title}`)
  })
}

checkUrgentTasks().then(() => {
  console.log('\nDone!')
  process.exit(0)
})
