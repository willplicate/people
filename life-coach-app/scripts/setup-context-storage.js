const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function setup() {
  console.log('Setting up context storage...')

  // Read SQL file
  const sql = fs.readFileSync(path.join(__dirname, 'add-context-storage.sql'), 'utf-8')

  // Execute SQL (Note: This requires direct database access, not just anon key)
  console.log('\nPlease run this SQL in your Supabase SQL Editor:')
  console.log('https://supabase.com/dashboard/project/tdclhoimzksmqmnsaccw/sql/new')
  console.log('\n--- SQL TO RUN ---')
  console.log(sql)
  console.log('--- END SQL ---\n')

  // After running SQL, seed with current files
  console.log('After running the SQL, press Enter to seed the data...')
  process.stdin.once('data', async () => {
    await seedData()
  })
}

async function seedData() {
  console.log('Seeding context data from files...')

  // Read current context files
  const lifeCoach = fs.readFileSync(path.join(__dirname, '..', 'LIFE_COACH.md'), 'utf-8')
  const lifeNow = fs.readFileSync(path.join(__dirname, '..', 'LIFE_NOW.md'), 'utf-8')

  // Insert/update in Supabase
  const { error: error1 } = await supabase
    .from('life_coach_context')
    .upsert({ key: 'LIFE_COACH_FRAMEWORK', content: lifeCoach })

  const { error: error2 } = await supabase
    .from('life_coach_context')
    .upsert({ key: 'LIFE_NOW', content: lifeNow })

  if (error1 || error2) {
    console.error('Error seeding data:', error1 || error2)
    process.exit(1)
  }

  console.log('✓ Successfully seeded context data!')
  process.exit(0)
}

setup()
