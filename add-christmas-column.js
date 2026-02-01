const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function addChristmasListColumn() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  console.log('Adding christmas_list column to contacts table...')

  // Try to add the column directly
  const { data, error } = await supabase
    .from('contacts')
    .select('christmas_list')
    .limit(1)

  if (error && error.code === '42703') {
    // Column doesn't exist, so we'll update via Supabase dashboard
    console.log('Column christmas_list does not exist. Please add it manually in Supabase dashboard:')
    console.log('1. Go to https://supabase.com/dashboard')
    console.log('2. Select your project')
    console.log('3. Go to Table Editor > contacts')
    console.log('4. Add a new column:')
    console.log('   - Name: christmas_list')
    console.log('   - Type: boolean')
    console.log('   - Default value: false')
    console.log('5. Save the column')
  } else if (error) {
    console.error('Unexpected error:', error)
  } else {
    console.log('Column christmas_list already exists!')
  }
}

addChristmasListColumn()