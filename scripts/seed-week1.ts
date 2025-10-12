/**
 * Seed Week 1 Data - Quick test import
 *
 * This script:
 * 1. Creates the AI/ML program with intro content
 * 2. Imports Week 1 from curriculum.md
 * 3. Creates topics for Week 1
 *
 * Run: npx tsx scripts/seed-week1.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Supabase connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tdclhoimzksmqmnsaccw.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkY2xob2ltemtzbXFtbnNhY2N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NzAxMjUsImV4cCI6MjA3MjI0NjEyNX0.lkxHRLuT4liiDJWt4AnSk24rFY5E3sceyApZ7kVTGL4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('🚀 Starting Week 1 data import...\n')

  // Step 1: Create program with intro content
  console.log('📚 Creating program...')

  const { data: program, error: programError } = await supabase
    .from('learning_programs')
    .insert({
      name: 'AI/ML Analyst Training',
      description: 'Comprehensive 20-week program to become a professional AI/ML Analyst',
      role_description: `An Applied AI/ML Analyst sits at the intersection of data science, business strategy, and practical problem-solving. Unlike ML Engineers who build production infrastructure or Research Scientists who push theoretical boundaries, Applied AI/ML Analysts take real business problems and solve them with machine learning. Their day-to-day work involves: extracting messy data from databases using SQL, cleaning and preparing it for analysis, building predictive models to answer specific business questions (Will customers churn? What will sales be next month? Which users should we target?), and—critically—explaining their findings to non-technical stakeholders.`,
      total_weeks: 20,
      status: 'active',
      intro_content: `# Welcome to AI/ML Analyst Training

## Program Overview
This 20-week intensive program will take you from beginner to job-ready AI/ML Analyst.

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

## Let's begin!`
    })
    .select()
    .single()

  if (programError) {
    console.error('❌ Error creating program:', programError)
    process.exit(1)
  }

  console.log('✅ Program created:', program.name)
  console.log('   ID:', program.id, '\n')

  // Step 2: Create Week 1
  console.log('📅 Creating Week 1...')

  const { data: week, error: weekError } = await supabase
    .from('learning_weeks')
    .insert({
      program_id: program.id,
      week_number: 1,
      title: 'Data Preparation Fundamentals',
      description: 'Understand what machine learning is and learn how to prepare data for modeling',
      objectives: [
        'Define features and labels in machine learning',
        'Understand different data types (numerical, categorical, text)',
        'Perform exploratory data analysis (EDA)',
        'Handle missing data appropriately',
        'Create visualizations to understand patterns'
      ],
      content: `# Week 1: Data Preparation Fundamentals

## Overview
Welcome to your first week! This week is about understanding the fundamentals of how we structure data for machine learning.

## Core Concepts

### 1. Features
**Features** are input variables that help predict outcomes. Think of these as the "evidence" a model uses to make decisions.

**Examples:**
- Study hours per day
- Energy level (1-5 scale)
- Day of week (Monday, Tuesday, etc.)
- Previous day's productivity

### 2. Labels
**Labels** are the thing you're trying to predict - the "answer" the model learns to predict.

**Examples:**
- Did you skip studying? (yes/no)
- Test score (0-100)
- Tomorrow's energy level (1-5)

### 3. Data Types
- **Numerical**: 1, 2.5, 100 (can do math with these)
- **Categorical**: Monday, Tuesday, Red, Blue (categories or groups)
- **Text**: Notes, descriptions (requires special text processing)

### 4. Missing Data
Empty cells in your dataset. Must be handled by:
- Filling with average/median
- Removing the row
- Flagging as a separate "missing" category

### 5. EDA (Exploratory Data Analysis)
Looking at your data BEFORE modeling:
- What are the distributions?
- Are there outliers?
- What relationships exist between variables?
- Are there patterns over time?

## This Week's Practical Work

### Monday-Tuesday: Study
- Watch videos on features/labels
- Read about data types
- Ask Gemini/Claude questions

### Wednesday: Plan
- Choose a behavior to track (study habits, exercise, etc.)
- Design your CSV structure
- Identify 3-5 features and 1 label

### Thursday-Saturday: Build
1. Create CSV tracking real behavior
2. Load with pandas
3. Check for missing values
4. Create 3 visualizations:
   - Line chart (trend over time)
   - Histogram (distribution)
   - Scatter plot (relationship between variables)
5. Calculate basic statistics (mean, median, min, max)

### Sunday: Reflect
- Write about what patterns you found
- Document your feature choices
- Answer: What might predict your label?

## Key Takeaway
Good machine learning starts with good data preparation. Understanding your features and labels is more important than choosing fancy algorithms!`,
      resources: [
        {
          type: 'video',
          url: 'https://www.youtube.com/watch?v=aircAruvnKk',
          title: 'But what is a neural network? | Chapter 1, Deep learning',
          description: 'Great visual introduction to ML concepts by 3Blue1Brown'
        },
        {
          type: 'video',
          url: 'https://www.youtube.com/watch?v=yN7ypxC7838',
          title: 'Machine Learning Basics | What Is Machine Learning?',
          description: 'Simple explanation of ML fundamentals'
        },
        {
          type: 'article',
          url: 'https://www.kaggle.com/learn/intro-to-machine-learning',
          title: 'Kaggle: Intro to Machine Learning',
          description: 'Free interactive course'
        },
        {
          type: 'article',
          url: 'https://pandas.pydata.org/docs/getting_started/intro_tutorials/index.html',
          title: 'Pandas Getting Started Tutorials',
          description: 'Official pandas documentation'
        },
        {
          type: 'exercise',
          url: 'https://www.kaggle.com/learn/pandas',
          title: 'Kaggle: Pandas Tutorial',
          description: 'Hands-on pandas exercises'
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

  // Step 3: Create topics for Week 1
  console.log('📝 Creating topics...')

  const topics = [
    {
      week_id: week.id,
      topic_order: 1,
      title: 'What is Machine Learning?',
      description: 'Core concepts and definitions of ML, AI, and data science',
      estimated_hours: 2.0,
      is_completed: false
    },
    {
      week_id: week.id,
      topic_order: 2,
      title: 'Features and Labels',
      description: 'Understanding the input (features) and output (labels) of ML models',
      estimated_hours: 2.5,
      is_completed: false
    },
    {
      week_id: week.id,
      topic_order: 3,
      title: 'Data Types',
      description: 'Working with numerical, categorical, and text data',
      estimated_hours: 2.0,
      is_completed: false
    },
    {
      week_id: week.id,
      topic_order: 4,
      title: 'Missing Data Handling',
      description: 'Strategies for dealing with incomplete datasets',
      estimated_hours: 1.5,
      is_completed: false
    },
    {
      week_id: week.id,
      topic_order: 5,
      title: 'Exploratory Data Analysis (EDA)',
      description: 'Visualizing and understanding your data before modeling',
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
  console.log('\n🌐 Visit: http://localhost:3001/learning')
}

main().catch(console.error)
