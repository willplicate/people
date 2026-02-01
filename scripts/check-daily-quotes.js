/**
 * Check if daily_quotes table exists and has data
 */
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkDailyQuotes() {
  console.log('=== Checking Daily Quotes Table ===\n')

  try {
    // Check if table exists and get all quotes
    const { data, error } = await supabase
      .from('personal_daily_quotes')
      .select('id, quote_text, author, image_url, is_active')
      .limit(5)

    if (error) {
      console.error('❌ Error accessing table:', error.message)
      console.error('\nThe table might not exist. Run this SQL script:')
      console.error('  create-daily-quotes-table.sql')
      return
    }

    if (!data || data.length === 0) {
      console.log('⚠️  Table exists but has no data')
      console.log('Run the SQL script to seed data: create-daily-quotes-table.sql')
      return
    }

    console.log(`✅ Table exists with ${data.length} quotes (showing first 5):\n`)
    data.forEach((quote, i) => {
      console.log(`${i + 1}. "${quote.quote_text.substring(0, 60)}..."`)
      console.log(`   Author: ${quote.author || 'Unknown'}`)
      console.log(`   Has image: ${quote.image_url ? 'Yes ✅' : 'No ❌'}`)
      console.log(`   Active: ${quote.is_active ? 'Yes' : 'No'}`)
      console.log()
    })

    // Count total and those with images
    const { count: totalCount } = await supabase
      .from('personal_daily_quotes')
      .select('*', { count: 'exact', head: true })

    const { count: withImages } = await supabase
      .from('personal_daily_quotes')
      .select('*', { count: 'exact', head: true })
      .not('image_url', 'is', null)

    console.log(`📊 Statistics:`)
    console.log(`   Total quotes: ${totalCount || 0}`)
    console.log(`   Quotes with images: ${withImages || 0}`)
    console.log(`   Quotes without images: ${(totalCount || 0) - (withImages || 0)}`)

    if ((withImages || 0) === 0) {
      console.log('\n💡 Next step: Run the Google Photos sync script:')
      console.log('   node scripts/sync-google-photos.js')
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

checkDailyQuotes()
