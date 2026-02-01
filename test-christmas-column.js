const { createClient } = require('@supabase/supabase-js')

// Use environment variables directly
const supabaseUrl = 'https://tdclhoimzksmqmnsaccw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkY2xob2ltemtzbXFtbnNhY2N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NzAxMjUsImV4cCI6MjA3MjI0NjEyNX0.lkxHRLuT4liiDJWt4AnSk24rFY5E3sceyApZ7kVTGL4'

async function testChristmasColumn() {
  const supabase = createClient(supabaseUrl, supabaseKey)

  console.log('Testing christmas_list column...')

  const { data, error } = await supabase
    .from('contacts')
    .select('christmas_list')
    .limit(1)

  if (error) {
    if (error.code === '42703') {
      console.log('❌ Column christmas_list does not exist')
      console.log('\n📋 Please add the column manually:')
      console.log('1. Go to https://supabase.com/dashboard')
      console.log('2. Select your project (tdclhoimzksmqmnsaccw)')
      console.log('3. Go to Table Editor > contacts')
      console.log('4. Click "Add Column"')
      console.log('5. Name: christmas_list')
      console.log('6. Type: boolean')
      console.log('7. Default value: false')
      console.log('8. Click "Save"')
    } else {
      console.error('Unexpected error:', error.message)
    }
  } else {
    console.log('✅ Column christmas_list already exists!')
  }
}

testChristmasColumn()