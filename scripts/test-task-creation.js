/**
 * Test script to verify task creation works
 * Run with: node scripts/test-task-creation.js
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

console.log('Testing task creation...')
console.log('Supabase URL:', supabaseUrl)
console.log('Using anon key:', supabaseKey?.substring(0, 20) + '...')

const supabase = createClient(supabaseUrl, supabaseKey)

async function testTaskCreation() {
  try {
    // Test 1: Check if table exists
    console.log('\n1. Checking if personal_tasks table exists...')
    const { data: tables, error: tableError } = await supabase
      .from('personal_tasks')
      .select('id')
      .limit(1)

    if (tableError) {
      console.error('❌ Error accessing table:', tableError.message)
      console.error('   Code:', tableError.code)
      console.error('   Details:', tableError.details)
      return
    }
    console.log('✅ Table exists')

    // Test 2: Try to insert a task
    console.log('\n2. Attempting to create a task...')
    const { data, error } = await supabase
      .from('personal_tasks')
      .insert({
        title: 'Test task from script',
        description: 'Testing task creation',
        priority: 'medium',
        status: 'todo',
        category: 'personal'
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating task:', error.message)
      console.error('   Code:', error.code)
      console.error('   Details:', error.details)
      console.error('   Hint:', error.hint)

      if (error.code === '42501') {
        console.error('\n⚠️  This is a Row Level Security (RLS) policy error!')
        console.error('   The anon key is blocked by RLS policies.')
        console.error('\n   Solution: Run this SQL in Supabase SQL Editor:')
        console.error('   DROP POLICY IF EXISTS "Allow all operations on personal_tasks" ON personal_tasks;')
        console.error('   CREATE POLICY "Allow all operations on personal_tasks" ON personal_tasks FOR ALL USING (true);')
      }
      return
    }

    console.log('✅ Task created successfully!')
    console.log('   ID:', data.id)
    console.log('   Title:', data.title)

    // Test 3: Clean up - delete the test task
    console.log('\n3. Cleaning up test task...')
    const { error: deleteError } = await supabase
      .from('personal_tasks')
      .delete()
      .eq('id', data.id)

    if (deleteError) {
      console.error('❌ Error deleting task:', deleteError.message)
    } else {
      console.log('✅ Test task deleted')
    }

    console.log('\n✅ All tests passed! Telegram bot should work now.')
  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

testTaskCreation()
