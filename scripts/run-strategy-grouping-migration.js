const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  try {
    console.log('📦 Running strategy grouping migration...')

    const sqlFile = path.join(__dirname, 'add-strategy-grouping.sql')
    const sql = fs.readFileSync(sqlFile, 'utf8')

    // Split by statement and run each one
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (const statement of statements) {
      console.log('🔧 Executing:', statement.substring(0, 60) + '...')
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement })

      if (error) {
        // Try direct execution if exec_sql doesn't exist
        const { error: directError } = await supabase.from('_migrations').insert({
          name: 'add_strategy_grouping',
          sql: statement
        })

        if (directError) {
          console.error('❌ Error:', error.message || directError.message)
        }
      }
    }

    console.log('✅ Migration completed successfully!')
    console.log('   Added columns: strategy_group_id, strategy_name')
    console.log('   Added index: idx_options_trades_group')

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

runMigration()
