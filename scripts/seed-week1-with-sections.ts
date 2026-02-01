/**
 * Seed Week 1 with Sections Structure
 *
 * This creates Week 1 with three separate sections:
 * 1. Study Focus (Monday-Tuesday)
 * 2. Practical Experiments (Wednesday-Saturday)
 * 3. Knowledge Check (Sunday)
 *
 * Run AFTER executing add-week-sections-schema.sql in Supabase
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tdclhoimzksmqmnsaccw.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkY2xob2ltemtzbXFtbnNhY2N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NzAxMjUsImV4cCI6MjA3MjI0NjEyNX0.lkxHRLuT4liiDJWt4AnSk24rFY5E3sceyApZ7kVTGL4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('🚀 Seeding Week 1 with sections structure...\n')

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

  console.log('✅ Found Week 1:', week.id)

  // Delete existing sections (if any)
  await supabase
    .from('week_sections')
    .delete()
    .eq('week_id', week.id)

  console.log('🧹 Cleaned existing sections\n')

  // SECTION 1: Study Focus (Monday-Tuesday)
  const studyFocusSection = {
    week_id: week.id,
    section_type: 'study_focus',
    section_order: 1,
    title: 'Study Focus (Monday-Tuesday)',
    day_range: 'Monday-Tuesday',
    content: `## Core Concepts

1. **Features** - Input variables that help predict outcomes (e.g., study hours, energy level, day of week). Think of these as the "evidence" a model uses.

2. **Labels** - The thing you're trying to predict (e.g., did you skip studying: yes/no). This is the "answer" the model learns to predict.

3. **Data Types** - Numerical (1, 2.5, 100), categorical (Monday, Tuesday), text (notes, descriptions). Models handle each differently.

4. **Missing Data** - Empty cells in your dataset. Must be handled (fill with average, remove row, or flag as missing).

5. **EDA (Exploratory Data Analysis)** - Looking at your data before modeling: distributions, patterns, outliers, relationships between variables.

---

## What to Study

- **Search YouTube:** "machine learning features and labels explained", "exploratory data analysis tutorial"

- **Ask Gemini:**
  - "What's the difference between features and labels in ML with 3 real-world examples?"
  - "Why is EDA important before building models?"
  - "How do I handle missing data in datasets?"

- **Reflect:** Read your data as a human first: What patterns do YOU see? What might predict your target variable?`
  }

  // SECTION 2: Practical Experiments (Wednesday-Saturday)
  const practicalSection = {
    week_id: week.id,
    section_type: 'practical_experiments',
    section_order: 2,
    title: 'Practical Experiments (Wednesday-Saturday)',
    day_range: 'Wednesday-Saturday',
    content: `## Hands-On Work

1. **Create structured data:** Build a CSV tracking a real behavior (study habits, exercise, spending, sleep). Include date, 3-5 features, 1 target label.

2. **Load and explore:** Use pandas to load CSV. Print first 5 rows, check for missing values, get column data types.

3. **Visualize patterns:** Create 3 plots:
   - Line chart (trend over time)
   - Histogram (distribution)
   - Scatter plot (relationship between 2 variables)

4. **Statistical summary:** Calculate mean, median, min, max for numerical columns. Count occurrences for categorical columns.

5. **Identify features:** Look at your data - which columns might help predict your label? Write down your hypothesis.`
  }

  // SECTION 3: Knowledge Check (Sunday)
  const knowledgeCheckSection = {
    week_id: week.id,
    section_type: 'knowledge_check',
    section_order: 3,
    title: 'Knowledge Check (Sunday)',
    day_range: 'Sunday',
    content: `## Quiz Yourself

- **Quiz prompt for Gemini:** "Create 5 multiple choice questions about features, labels, and data types in machine learning"

- **Write in own words:** "Features are X. Labels are Y. In my project, I chose [columns] as features because..."

- **Code challenge:** Open your CSV, add a new feature column (e.g., is_weekend), verify it was added correctly.

---

## Portfolio Deliverable

Create:
- CSV with real data
- Python script showing EDA
- Write 300 words: "How I Structured Data for ML: Features, Labels, and Why They Matter"`
  }

  // Insert all three sections
  const { data: sections, error } = await supabase
    .from('week_sections')
    .insert([studyFocusSection, practicalSection, knowledgeCheckSection])
    .select()

  if (error) {
    console.error('❌ Error creating sections:', error)
    process.exit(1)
  }

  console.log('✅ Created 3 sections for Week 1:')
  sections?.forEach(section => {
    console.log(`   ${section.section_order}. ${section.title}`)
  })

  console.log('\n🎉 Week 1 sections imported!')
  console.log('\n📝 Next steps:')
  console.log('   1. Update the week page component to fetch and display sections')
  console.log('   2. Test at: http://localhost:3000/learning/week/1')
}

main().catch(console.error)
