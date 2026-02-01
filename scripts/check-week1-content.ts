/**
 * Check what's actually stored in Week 1
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tdclhoimzksmqmnsaccw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkY2xob2ltemtzbXFtbnNhY2N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NzAxMjUsImV4cCI6MjA3MjI0NjEyNX0.lkxHRLuT4liiDJWt4AnSk24rFY5E3sceyApZ7kVTGL4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  const { data, error } = await supabase
    .from('learning_weeks')
    .select('content')
    .eq('week_number', 1)
    .single()

  if (error) {
    console.error('Error:', error)
    process.exit(1)
  }

  console.log('=== FIRST 800 CHARACTERS ===')
  console.log(data.content.substring(0, 800))
  console.log('\n=== CHECKING FOR DOUBLE NEWLINES ===')

  // Check if we have proper spacing
  if (data.content.includes('## Core Concepts\n\n### 1. Features')) {
    console.log('✅ Has double newlines between headers')
  } else if (data.content.includes('## Core Concepts\n### 1. Features')) {
    console.log('❌ Only single newline between headers')
  }

  if (data.content.includes('Think of these as the "evidence" a model uses.\n\n### 2. Labels')) {
    console.log('✅ Has double newlines between paragraphs')
  } else if (data.content.includes('Think of these as the "evidence" a model uses.\n### 2. Labels')) {
    console.log('❌ Only single newline between paragraphs')
  }
}

main().catch(console.error)
