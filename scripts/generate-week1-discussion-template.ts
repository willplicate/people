/**
 * Generate Wednesday Project Discussion Template for Week 1
 *
 * This creates a pre-filled template with questions to guide your
 * Wednesday discussion with Claude about your Week 1 project.
 *
 * Run AFTER executing add-notes-and-knowledge-schema.sql
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tdclhoimzksmqmnsaccw.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkY2xob2ltemtzbXFtbnNhY2N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NzAxMjUsImV4cCI6MjA3MjI0NjEyNX0.lkxHRLuT4liiDJWt4AnSk24rFY5E3sceyApZ7kVTGL4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('🎯 Generating Week 1 Wednesday discussion template...\n')

  // Get Week 1
  const { data: week } = await supabase
    .from('learning_weeks')
    .select('id')
    .eq('week_number', 1)
    .single()

  if (!week) {
    console.error('❌ Week 1 not found')
    process.exit(1)
  }

  // Calculate next Wednesday (or create for specific date)
  const today = new Date()
  const nextWednesday = new Date(today)
  nextWednesday.setDate(today.getDate() + ((3 - today.getDay() + 7) % 7 || 7))
  const discussionDate = nextWednesday.toISOString().split('T')[0]

  // Week 1 specific template questions based on curriculum
  const templateQuestions = [
    "I want to track [describe behavior: study habits, exercise, spending, sleep, etc.]. What are 3-5 meaningful features I could collect?",
    "For my dataset, what would be a good target label to predict? Should it be categorical (classification) or numerical (regression)?",
    "What's a realistic project scope for Week 1? I have 6-8 hours Thursday-Saturday.",
    "How should I structure my CSV file? What columns do I need at minimum?",
    "What are the most important EDA visualizations for this type of data?",
    "What patterns should I look for when exploring my data?",
    "How can I make this project useful for my actual life, not just a learning exercise?"
  ]

  // Create the discussion template
  const { data: discussion, error } = await supabase
    .from('project_discussions')
    .insert({
      week_id: week.id,
      discussion_date: discussionDate,
      status: 'pending',
      template_questions: templateQuestions
    })
    .select()
    .single()

  if (error) {
    console.error('❌ Error creating discussion template:', error)
    process.exit(1)
  }

  console.log('✅ Created Wednesday discussion template!')
  console.log(`   Discussion ID: ${discussion.id}`)
  console.log(`   Scheduled for: ${discussionDate}`)
  console.log(`   Questions: ${templateQuestions.length}`)
  console.log('\n📋 Template Questions:')
  templateQuestions.forEach((q, i) => {
    console.log(`   ${i + 1}. ${q}`)
  })

  console.log('\n💡 Next Wednesday, you will:')
  console.log('   1. Open the week page')
  console.log('   2. See the Wednesday discussion reminder')
  console.log('   3. Click to start discussion with Claude')
  console.log('   4. Use these pre-filled questions')
  console.log('   5. Record your project plan')
  console.log('\n🎯 This keeps you accountable to the weekly structure!')
}

main().catch(console.error)
