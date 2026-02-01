/**
 * Fix existing telegram_users record that has 'default-user' as user_id
 * Run with: node scripts/fix-existing-telegram-user.js
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Fixing telegram_users records with invalid user_id...\n')

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixTelegramUsers() {
  try {
    // Find records with 'default-user' as user_id
    console.log('1. Searching for telegram_users with user_id = "default-user"...')
    const { data: badRecords, error: searchError } = await supabase
      .from('telegram_users')
      .select('*')

    if (searchError) {
      console.error('❌ Error searching:', searchError.message)
      return
    }

    console.log(`   Found ${badRecords.length} telegram_users record(s)`)

    if (badRecords.length === 0) {
      console.log('✅ No records to fix!')
      return
    }

    // Fix each record
    for (const record of badRecords) {
      console.log(`\n2. Fixing record ${record.id}...`)
      console.log(`   Chat ID: ${record.telegram_chat_id}`)
      console.log(`   Current user_id: ${record.user_id}`)

      // Update user_id to be the same as id
      const { data: updated, error: updateError } = await supabase
        .from('telegram_users')
        .update({ user_id: record.id })
        .eq('id', record.id)
        .select()
        .single()

      if (updateError) {
        console.error(`❌ Error updating record: ${updateError.message}`)
        continue
      }

      console.log(`✅ Fixed! New user_id: ${updated.user_id}`)
    }

    console.log('\n✅ All records fixed!')
    console.log('\nYou can now test the Telegram bot again.')
  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

fixTelegramUsers()
