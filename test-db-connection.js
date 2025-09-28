const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function testConnection() {
  console.log('Testing Supabase connection...')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('personal_contacts')
      .select('count')
      .limit(1)

    if (error) {
      console.error('❌ Database connection failed:', error.message)
      if (error.message.includes('relation "personal_contacts" does not exist')) {
        console.log('\n📋 Next steps:')
        console.log('1. Go to your Supabase dashboard')
        console.log('2. Open the SQL Editor')
        console.log('3. Run the setup-database.sql script')
      }
    } else {
      console.log('✅ Database connection successful!')
      console.log('📊 Tables are ready for use')
    }
  } catch (err) {
    console.error('❌ Connection test failed:', err.message)
  }
}

testConnection()