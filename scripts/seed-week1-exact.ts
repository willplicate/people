/**
 * Seed Week 1 Data - EXACT CURRICULUM MATCH
 *
 * This script imports Week 1 exactly as written in curriculum.md
 * Including: Core Concepts, Study Focus, Practical Experiments, Knowledge Check, Portfolio Deliverable
 *
 * Run: npx tsx scripts/seed-week1-exact.ts
 */

import { createClient } from '@supabase/supabase-js'

// Supabase connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tdclhoimzksmqmnsaccw.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkY2xob2ltemtzbXFtbnNhY2N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NzAxMjUsImV4cCI6MjA3MjI0NjEyNX0.lkxHRLuT4liiDJWt4AnSk24rFY5E3sceyApZ7kVTGL4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('🚀 Starting Week 1 data import (EXACT curriculum match)...\n')

  // STEP 1: Clean up existing data
  console.log('🧹 Cleaning up old data...')

  const { data: existingProgram } = await supabase
    .from('learning_programs')
    .select('id')
    .eq('name', 'AI/ML Analyst Training')
    .maybeSingle()

  if (existingProgram) {
    // Delete will cascade to weeks, topics, sessions
    await supabase.from('learning_programs').delete().eq('id', existingProgram.id)
    console.log('✅ Cleaned up old program data\n')
  }

  // STEP 2: Create program with intro content
  console.log('📚 Creating program...')

  const { data: program, error: programError } = await supabase
    .from('learning_programs')
    .insert({
      name: 'AI/ML Analyst Training',
      description: 'Comprehensive 20-week program to become a professional AI/ML Analyst',
      role_description: `An Applied AI/ML Analyst sits at the intersection of data science, business strategy, and practical problem-solving. Unlike ML Engineers who build production infrastructure or Research Scientists who push theoretical boundaries, Applied AI/ML Analysts take real business problems and solve them with machine learning. Their day-to-day work involves: extracting messy data from databases using SQL, cleaning and preparing it for analysis, building predictive models to answer specific business questions (Will customers churn? What will sales be next month? Which users should we target?), and—critically—explaining their findings to non-technical stakeholders. They don't just build accurate models; they build interpretable models and communicate why the model made certain predictions, what features drive outcomes, and how much business value the solution provides. They compare different modeling approaches, run A/B tests to validate improvements, deploy models as interactive dashboards or APIs, and monitor performance over time to catch when models degrade. The role demands equal parts technical skill (Python, ML algorithms, statistics) and business acumen (translating technical metrics into ROI, presenting to executives, framing problems correctly). This curriculum is designed to build both capabilities: you'll learn the technical concepts through hands-on projects, but you'll also practice the communication, interpretation, and business thinking that separates good analysts from great ones.`,
      total_weeks: 20,
      status: 'active',
      intro_content: `# Welcome to AI/ML Analyst Training

## Program Overview
This 20-week intensive program will take you from beginner to job-ready AI/ML Analyst.

## Curriculum Structure

**Pattern:** Learn concepts → Discuss project with Claude → Build with understanding → Document learning

**Each week follows this pattern:**
- **Monday-Tuesday:** Study assigned concepts (2-3 hours total)
- **Wednesday:** Discuss project idea with Claude (30 mins)
- **Thursday-Saturday:** Build project implementing concepts (6-8 hours)
- **Sunday:** Write learning article, update portfolio (2 hours)

## What You'll Learn
- Python programming and data analysis
- Machine learning fundamentals
- Model building and evaluation
- Real-world project experience
- Communication and presentation skills

## Time Commitment
- **Recommended**: 10-15 hours per week
- **Minimum**: 7 hours per week
- **Includes**: Video lectures, readings, coding exercises, projects

Let's begin!`
    })
    .select()
    .single()

  if (programError) {
    console.error('❌ Error creating program:', programError)
    process.exit(1)
  }

  console.log('✅ Program created:', program.name)
  console.log('   ID:', program.id, '\n')

  // STEP 3: Create Week 1 with EXACT curriculum content
  console.log('📅 Creating Week 1 (exact curriculum format)...')

  const { data: week, error: weekError } = await supabase
    .from('learning_weeks')
    .insert({
      program_id: program.id,
      week_number: 1,
      title: 'Data Preparation Fundamentals',
      description: 'Learn about features, labels, data types, missing data, and exploratory data analysis',
      objectives: [
        'Define features and labels in machine learning',
        'Understand different data types (numerical, categorical, text)',
        'Handle missing data appropriately',
        'Perform exploratory data analysis (EDA)',
        'Create structured data for ML projects'
      ],
      content: `# Week 1: Data Preparation Fundamentals

## Core Concepts

### 1. Features
Input variables that help predict outcomes (e.g., study hours, energy level, day of week). Think of these as the "evidence" a model uses.

### 2. Labels
The thing you're trying to predict (e.g., did you skip studying: yes/no). This is the "answer" the model learns to predict.

### 3. Data Types
- **Numerical**: 1, 2.5, 100
- **Categorical**: Monday, Tuesday, Red, Blue
- **Text**: notes, descriptions

Models handle each differently.

### 4. Missing Data
Empty cells in your dataset. Must be handled by:
- Fill with average/median
- Remove row
- Flag as missing

### 5. EDA (Exploratory Data Analysis)
Looking at your data before modeling: distributions, patterns, outliers, relationships between variables.

---

## Study Focus (Mon-Tue)

**Search YouTube:**
- "machine learning features and labels explained"
- "exploratory data analysis tutorial"

**Ask Gemini:**
- "What's the difference between features and labels in ML with 3 real-world examples?"
- "Why is EDA important before building models?"
- "How do I handle missing data in datasets?"

**Reflect:**
- Read your data as a human first: What patterns do YOU see?
- What might predict your target variable?

---

## Practical Experiments (Wed-Sat)

### 1. Create structured data
Build a CSV tracking a real behavior (study habits, exercise, spending, sleep). Include date, 3-5 features, 1 target label.

### 2. Load and explore
Use pandas to load CSV. Print first 5 rows, check for missing values, get column data types.

### 3. Visualize patterns
Create 3 plots:
- Line chart (trend over time)
- Histogram (distribution)
- Scatter plot (relationship between 2 variables)

### 4. Statistical summary
Calculate mean, median, min, max for numerical columns. Count occurrences for categorical columns.

### 5. Identify features
Look at your data - which columns might help predict your label? Write down your hypothesis.

---

## Knowledge Check (Sunday)

**Quiz yourself:**
- Ask Gemini: "Create 5 multiple choice questions about features, labels, and data types in machine learning"

**Write in your own words:**
- "Features are X. Labels are Y. In my project, I chose [columns] as features because..."

**Code challenge:**
- Open your CSV, add a new feature column (e.g., is_weekend), verify it was added correctly.

---

## Portfolio Deliverable

Create:
- CSV with real data
- Python script showing EDA
- Write 300 words: "How I Structured Data for ML: Features, Labels, and Why They Matter"`,
      resources: [
        {
          type: 'video',
          url: 'https://www.youtube.com/results?search_query=machine+learning+features+and+labels+explained',
          title: 'YouTube: Machine Learning Features and Labels',
          description: 'Search for beginner-friendly explanations'
        },
        {
          type: 'video',
          url: 'https://www.youtube.com/results?search_query=exploratory+data+analysis+tutorial',
          title: 'YouTube: Exploratory Data Analysis Tutorial',
          description: 'Learn EDA basics'
        },
        {
          type: 'article',
          url: 'https://www.kaggle.com/learn/intro-to-machine-learning',
          title: 'Kaggle: Intro to Machine Learning',
          description: 'Free interactive course on ML fundamentals'
        },
        {
          type: 'article',
          url: 'https://pandas.pydata.org/docs/getting_started/intro_tutorials/index.html',
          title: 'Pandas Getting Started',
          description: 'Official pandas tutorials for data manipulation'
        }
      ]
    })
    .select()
    .single()

  if (weekError) {
    console.error('❌ Error creating week:', weekError)
    process.exit(1)
  }

  console.log('✅ Week 1 created:', week.title)
  console.log('   ID:', week.id, '\n')

  // STEP 4: Create topics (from Study Focus sections)
  console.log('📝 Creating topics...')

  const topics = [
    {
      week_id: week.id,
      topic_order: 1,
      title: 'Features and Labels',
      description: 'Understand what features (inputs) and labels (outputs) are in ML',
      estimated_hours: 2.0,
      is_completed: false
    },
    {
      week_id: week.id,
      topic_order: 2,
      title: 'Data Types',
      description: 'Learn about numerical, categorical, and text data',
      estimated_hours: 1.5,
      is_completed: false
    },
    {
      week_id: week.id,
      topic_order: 3,
      title: 'Missing Data Handling',
      description: 'Strategies for dealing with incomplete datasets',
      estimated_hours: 1.5,
      is_completed: false
    },
    {
      week_id: week.id,
      topic_order: 4,
      title: 'Exploratory Data Analysis (EDA)',
      description: 'Visualize and understand your data before modeling',
      estimated_hours: 2.0,
      is_completed: false
    },
    {
      week_id: week.id,
      topic_order: 5,
      title: 'Create Structured Data',
      description: 'Build your own CSV with features and labels',
      estimated_hours: 3.0,
      is_completed: false
    }
  ]

  const { data: createdTopics, error: topicsError } = await supabase
    .from('learning_topics')
    .insert(topics)
    .select()

  if (topicsError) {
    console.error('❌ Error creating topics:', topicsError)
    process.exit(1)
  }

  console.log('✅ Created', createdTopics.length, 'topics')
  createdTopics.forEach(topic => {
    console.log(`   ${topic.topic_order}. ${topic.title}`)
  })

  console.log('\n🎉 Week 1 import complete!')
  console.log('\n📊 Summary:')
  console.log('   Program:', program.name)
  console.log('   Week 1:', week.title)
  console.log('   Topics:', createdTopics.length)
  console.log('   Format: Matches curriculum.md exactly')
  console.log('\n✅ Content includes:')
  console.log('   - Core Concepts (5 key concepts)')
  console.log('   - Study Focus (Mon-Tue)')
  console.log('   - Practical Experiments (Wed-Sat)')
  console.log('   - Knowledge Check (Sunday)')
  console.log('   - Portfolio Deliverable')
  console.log('\n📝 Daily tracking available at bottom of week page:')
  console.log('   - Date picker')
  console.log('   - Duration (minutes)')
  console.log('   - Engagement level (1-5)')
  console.log('   - Notes field for reflections')
  console.log('   - Optional topic selection')
  console.log('\n🌐 Visit: http://localhost:3000/learning')
}

main().catch(console.error)
