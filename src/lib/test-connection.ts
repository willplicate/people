// Test Supabase connection
import { supabase, TABLES } from './supabase'

export async function testSupabaseConnection() {
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from(TABLES.CONTACTS)
      .select('count(*)', { count: 'exact', head: true })

    if (error) {
      console.error('❌ Supabase connection failed:', error.message)
      return false
    }

    console.log('✅ Supabase connection successful')
    console.log(`📊 Found ${data?.length || 0} records in personal_contacts table`)
    return true
  } catch (err) {
    console.error('❌ Supabase connection error:', err)
    return false
  }
}

// Test all table access
export async function testAllTables() {
  const tables = Object.values(TABLES)
  const results: Record<string, boolean> = {}

  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('count(*)', { count: 'exact', head: true })

      results[table] = !error
      console.log(error ? `❌ ${table}: ${error.message}` : `✅ ${table}: accessible`)
    } catch (err) {
      results[table] = false
      console.log(`❌ ${table}: ${err}`)
    }
  }

  return results
}