/**
 * Generate Complete Week Template from curriculum.md
 *
 * This script:
 * 1. Reads Week 1 from curriculum.md
 * 2. Extracts the three sections (Study Focus, Practical Experiments, Knowledge Check)
 * 3. Creates week_sections entries
 * 4. Generates Wednesday discussion template with relevant questions
 * 5. Pre-populates knowledge concepts from Core Concepts section
 *
 * This becomes the template for importing all 20 weeks
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tdclhoimzksmqmnsaccw.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkY2xob2ltemtzbXFtbnNhY2N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NzAxMjUsImV4cCI6MjA3MjI0NjEyNX0.lkxHRLuT4liiDJWt4AnSk24rFY5E3sceyApZ7kVTGL4'

const supabase = createClient(supabaseUrl, supabaseKey)

interface ParsedWeek {
  weekNumber: number
  title: string
  coreConcepts: Array<{ name: string; definition: string }>
  studyFocus: string
  practicalExperiments: string
  knowledgeCheck: string
  portfolioDeliverable: string
}

/**
 * Parse Week 1 from curriculum.md
 */
function parseWeek1FromCurriculum(): ParsedWeek {
  const curriculumPath = path.join(process.cwd(), 'curriculum.md')
  const content = fs.readFileSync(curriculumPath, 'utf-8')

  // Extract Week 1 section
  const week1Match = content.match(/### \*\*Week 1: (.+?)\*\*\n\n\*\*Core Concepts:\*\*\n([\s\S]+?)\n\n\*\*Study Focus \(Mon-Tue\):\*\*\n([\s\S]+?)\n\n\*\*Practical Experiments \(Wed-Sat\):\*\*\n([\s\S]+?)\n\n\*\*Knowledge Check \(Sunday\):\*\*\n([\s\S]+?)\n\n\*\*Portfolio Deliverable:\*\* (.+?)\n/)

  if (!week1Match) {
    throw new Error('Could not parse Week 1 from curriculum.md')
  }

  const [, title, coreConceptsText, studyFocus, practicalExperiments, knowledgeCheck, portfolioDeliverable] = week1Match

  // Parse core concepts (numbered list with **Name** - definition)
  const conceptRegex = /\d+\.\s+\*\*(.+?)\*\* - (.+?)(?=\n\d+\.|\n\n|$)/g
  const conceptMatches = Array.from(coreConceptsText.matchAll(conceptRegex))
  const coreConcepts = conceptMatches.map(match => ({
    name: match[1].trim(),
    definition: match[2].trim()
  }))

  return {
    weekNumber: 1,
    title: title.trim(),
    coreConcepts,
    studyFocus: studyFocus.trim(),
    practicalExperiments: practicalExperiments.trim(),
    knowledgeCheck: knowledgeCheck.trim(),
    portfolioDeliverable: portfolioDeliverable.trim()
  }
}

async function main() {
  console.log('🚀 Generating complete Week 1 template from curriculum.md...\n')

  // Parse curriculum.md
  console.log('📖 Reading curriculum.md...')
  const parsed = parseWeek1FromCurriculum()
  console.log(`✅ Parsed: Week ${parsed.weekNumber} - ${parsed.title}`)
  console.log(`   Core Concepts: ${parsed.coreConcepts.length}`)
  console.log('')

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

  // STEP 1: Create/Update Week Sections
  console.log('📝 Creating week sections...')

  await supabase.from('week_sections').delete().eq('week_id', week.id)

  const sections = [
    {
      week_id: week.id,
      section_type: 'study_focus',
      section_order: 1,
      title: 'Study Focus (Monday-Tuesday)',
      day_range: 'Monday-Tuesday',
      content: `## Core Concepts\n\n${parsed.coreConcepts.map((c, i) => `${i + 1}. **${c.name}** - ${c.definition}`).join('\n\n')}\n\n---\n\n## What to Study\n\n${parsed.studyFocus}`
    },
    {
      week_id: week.id,
      section_type: 'practical_experiments',
      section_order: 2,
      title: 'Practical Experiments (Wednesday-Saturday)',
      day_range: 'Wednesday-Saturday',
      content: `## Hands-On Work\n\n${parsed.practicalExperiments}`
    },
    {
      week_id: week.id,
      section_type: 'knowledge_check',
      section_order: 3,
      title: 'Knowledge Check (Sunday)',
      day_range: 'Sunday',
      content: `## Quiz Yourself\n\n${parsed.knowledgeCheck}\n\n---\n\n## Portfolio Deliverable\n\n${parsed.portfolioDeliverable}`
    }
  ]

  const { error: sectionsError } = await supabase.from('week_sections').insert(sections)
  if (sectionsError) {
    console.error('❌ Error creating sections:', sectionsError)
    process.exit(1)
  }
  console.log('✅ Created 3 sections\n')

  // STEP 2: Pre-populate Knowledge Concepts
  console.log('🧠 Pre-populating knowledge concepts...')

  await supabase.from('knowledge_concepts').delete().eq('week_id', week.id)

  const concepts = parsed.coreConcepts.map(c => ({
    week_id: week.id,
    concept_name: c.name,
    definition: c.definition,
    understanding_level: 1, // Start at basic
    times_reviewed: 0
  }))

  const { error: conceptsError } = await supabase.from('knowledge_concepts').insert(concepts)
  if (conceptsError) {
    console.error('❌ Error creating concepts:', conceptsError)
    process.exit(1)
  }
  console.log(`✅ Created ${concepts.length} knowledge concepts\n`)

  // STEP 3: Generate Wednesday Discussion Template
  console.log('💬 Generating Wednesday discussion template...')

  await supabase.from('project_discussions').delete().eq('week_id', week.id)

  const today = new Date()
  const nextWednesday = new Date(today)
  nextWednesday.setDate(today.getDate() + ((3 - today.getDay() + 7) % 7 || 7))

  const templateQuestions = [
    `Given the concepts I learned (${parsed.coreConcepts.map(c => c.name).join(', ')}), what's a practical project I could build this week?`,
    "What behavior or data should I track? What are 3-5 meaningful features?",
    "What should my target label be? Classification or regression?",
    "How should I structure my CSV file?",
    "What EDA visualizations will be most insightful for this data?",
    "How can I make this project useful for my real life?",
    "What's realistic to complete in 6-8 hours Thu-Sat?"
  ]

  const { error: discussionError } = await supabase
    .from('project_discussions')
    .insert({
      week_id: week.id,
      discussion_date: nextWednesday.toISOString().split('T')[0],
      status: 'pending',
      template_questions: templateQuestions
    })

  if (discussionError) {
    console.error('❌ Error creating discussion:', discussionError)
    process.exit(1)
  }
  console.log(`✅ Created discussion template (${templateQuestions.length} questions)\n`)

  console.log('🎉 Week 1 complete template generated!')
  console.log('\n📊 Summary:')
  console.log(`   Week: ${parsed.title}`)
  console.log(`   Sections: 3`)
  console.log(`   Knowledge Concepts: ${concepts.length}`)
  console.log(`   Discussion Questions: ${templateQuestions.length}`)
  console.log('\n🌐 View at: http://localhost:3000/learning/week/1')
}

main().catch(console.error)
