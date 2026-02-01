/**
 * Seed Week 2 Data - EXACT CURRICULUM MATCH
 *
 * This script imports Week 2 exactly as written in curriculum.md
 * Week 2: Your First ML Model (Supervised Learning Fundamentals)
 *
 * Run: npx tsx scripts/seed-week2.ts
 */

import { createClient } from '@supabase/supabase-js'

// Supabase connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tdclhoimzksmqmnsaccw.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkY2xob2ltemtzbXFtbnNhY2N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NzAxMjUsImV4cCI6MjA3MjI0NjEyNX0.lkxHRLuT4liiDJWt4AnSk24rFY5E3sceyApZ7kVTGL4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('🚀 Starting Week 2 data import (EXACT curriculum match)...\n')

  // STEP 1: Get existing program
  console.log('📚 Finding program...')

  const { data: program, error: programError } = await supabase
    .from('learning_programs')
    .select('id')
    .eq('name', 'AI/ML Analyst Training')
    .maybeSingle()

  if (programError || !program) {
    console.error('❌ Error finding program:', programError)
    console.error('💡 Run seed-week1-exact.ts first to create the program')
    process.exit(1)
  }

  console.log('✅ Program found:', program.id, '\n')

  // STEP 2: Clean up existing Week 2 if it exists
  console.log('🧹 Cleaning up old Week 2 data...')

  const { data: existingWeek } = await supabase
    .from('learning_weeks')
    .select('id')
    .eq('program_id', program.id)
    .eq('week_number', 2)
    .maybeSingle()

  if (existingWeek) {
    await supabase.from('learning_weeks').delete().eq('id', existingWeek.id)
    console.log('✅ Cleaned up old Week 2 data\n')
  }

  // STEP 3: Create Week 2 with EXACT curriculum content
  console.log('📅 Creating Week 2 (exact curriculum format)...')

  const { data: week, error: weekError } = await supabase
    .from('learning_weeks')
    .insert({
      program_id: program.id,
      week_number: 2,
      title: 'Your First ML Model (Supervised Learning Fundamentals)',
      description: 'Build a working classification model and understand the complete ML workflow',
      objectives: [
        'Understand supervised vs unsupervised learning',
        'Build classification models with Logistic Regression and Decision Trees',
        'Implement proper train/test split workflow',
        'Compare model performance using accuracy metrics',
        'Recognize overfitting patterns in models'
      ],
      content: `# Week 2: Your First ML Model (Supervised Learning Fundamentals)

**Goal:** Build a working classification model and understand the complete ML workflow.

---

## Gemini Tutoring Plan (Mon-Tue, 2-3 hours)

### Session 1: Supervised Learning Concepts (1 hour)

Ask Gemini to explain with examples:

- "What is supervised learning vs unsupervised learning? Give me 3 real-world examples of each."
- "What's the difference between classification and regression? Is predicting yoga attendance classification or regression?"
- "Explain train/test split like I'm 5. Why can't I test on training data?"
- "What happens during model training? What is the model actually learning?"

### Session 2: Classification Algorithms Basics (1 hour)

Ask Gemini:

- "Explain Logistic Regression in simple terms. When would I use it?"
- "What is a Decision Tree? How does it make predictions?"
- "What does 'accuracy' mean for a classification model?"
- "If my model predicts 'yes yoga' or 'no yoga', how do I know if it's good?"

### Session 3: Practical Sklearn Workflow (1 hour)

Ask Gemini to show you code examples:

- "Show me how to split data into X (features) and y (labels) in pandas"
- "Show me sklearn code for train_test_split with 70/30 ratio"
- "Show me how to train a LogisticRegression model in sklearn"
- "Show me how to make predictions and calculate accuracy"

---

## Wed-Sat Building Phase (6-8 hours)

### Project: Yoga Attendance Predictor

#### Phase 1: Set up the problem (1 hour)

1. Open your yoga CSV
2. Identify label: attended (yes/no binary)
3. Identify features: minutes_previous_day, mood_score, day_of_week, etc.
4. Ask Gemini: "Which of my columns should be features for predicting yoga attendance?"

#### Phase 2: Train/test split (1 hour)

1. Use sklearn's train_test_split
2. Split 70% training, 30% testing
3. Verify: print shapes of X_train, X_test, y_train, y_test
4. Ask Gemini if stuck: "My train_test_split is giving an error, here's my code..."

#### Phase 3: First model - Logistic Regression (2 hours)

1. Import LogisticRegression from sklearn
2. Fit model on training data only: \`model.fit(X_train, y_train)\`
3. Predict on training data: \`train_predictions = model.predict(X_train)\`
4. Calculate training accuracy: \`accuracy_score(y_train, train_predictions)\`
5. Predict on test data: \`test_predictions = model.predict(X_test)\`
6. Calculate test accuracy: \`accuracy_score(y_test, test_predictions)\`
7. **Critical question:** Are train and test accuracy similar? If train is much higher, why?

#### Phase 4: Second model - Decision Tree (2 hours)

1. Import DecisionTreeClassifier from sklearn
2. Train same way as Logistic Regression
3. Compare train vs test accuracy
4. Try different max_depth values (3, 5, 10, 20)
5. Which depth gives best test accuracy?
6. **Key insight:** When does overfitting happen?

#### Phase 5: Compare and document (1-2 hours)

1. Create comparison table: Model | Train Acc | Test Acc
2. Which model would you choose and why?
3. Save predictions to CSV to see where model was right/wrong
4. Write notes: "I chose [model] because..."

---

## Sunday Documentation (2 hours)

### Portfolio deliverable:

Working Jupyter notebook or Python script showing:

1. Data loading and feature/label split
2. Train/test split code
3. Two trained models (Logistic Regression + Decision Tree)
4. Accuracy comparison table
5. Your conclusion about which works better

### 300-word article: "My First Real ML Model: Predicting Yoga Attendance"

Must include:

- What problem you're solving (classification: will I attend yoga?)
- Which features you used and why
- Train/test split explanation (why you can't cheat by testing on training data)
- Which model performed better
- What surprised you (e.g., "Decision Tree overfit when depth was too high")
- One thing you still don't understand (honest gap)

---

## Key Gemini Prompts for When You're Stuck

- "My train accuracy is 95% but test accuracy is 60%. What's happening?"
- "How do I handle categorical features like 'day_of_week' in sklearn?"
- "My model gives error: 'could not convert string to float'. What does this mean?"
- "Explain overfitting using my yoga model as the example"
- "Should I use all my features or remove some? How do I decide?"

---

## Success Criteria for Week 2

By Sunday you should be able to say YES to:

- ✓ I understand what train/test split prevents
- ✓ I've trained two different classification models
- ✓ I can compare model performance using accuracy
- ✓ I recognize overfitting when I see it (100% train, 70% test)
- ✓ I know which sklearn methods to use (.fit, .predict, accuracy_score)
- ✓ I can explain my model to a non-technical person`,
      resources: [
        {
          type: 'video',
          url: 'https://www.youtube.com/results?search_query=supervised+learning+explained',
          title: 'YouTube: Supervised Learning Explained',
          description: 'Learn the fundamentals of supervised learning'
        },
        {
          type: 'video',
          url: 'https://www.youtube.com/results?search_query=logistic+regression+intuition',
          title: 'YouTube: Logistic Regression',
          description: 'Understand how logistic regression works'
        },
        {
          type: 'video',
          url: 'https://www.youtube.com/results?search_query=decision+tree+explained',
          title: 'YouTube: Decision Trees',
          description: 'Visual explanation of decision tree algorithms'
        },
        {
          type: 'article',
          url: 'https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.train_test_split.html',
          title: 'Sklearn: train_test_split Documentation',
          description: 'Official documentation for splitting data'
        },
        {
          type: 'article',
          url: 'https://scikit-learn.org/stable/supervised_learning.html',
          title: 'Sklearn: Supervised Learning Guide',
          description: 'Complete guide to supervised learning in sklearn'
        }
      ]
    })
    .select()
    .single()

  if (weekError) {
    console.error('❌ Error creating week:', weekError)
    process.exit(1)
  }

  console.log('✅ Week 2 created:', week.title)
  console.log('   ID:', week.id, '\n')

  // STEP 4: Create topics (from the sessions and phases)
  console.log('📝 Creating topics...')

  const topics = [
    {
      week_id: week.id,
      topic_order: 1,
      title: 'Supervised Learning Concepts',
      description: 'Understand supervised vs unsupervised learning, classification vs regression',
      estimated_hours: 1.0,
      is_completed: false
    },
    {
      week_id: week.id,
      topic_order: 2,
      title: 'Classification Algorithms Basics',
      description: 'Learn Logistic Regression and Decision Trees',
      estimated_hours: 1.0,
      is_completed: false
    },
    {
      week_id: week.id,
      topic_order: 3,
      title: 'Sklearn Workflow',
      description: 'Master train_test_split, fit, predict, and accuracy_score',
      estimated_hours: 1.0,
      is_completed: false
    },
    {
      week_id: week.id,
      topic_order: 4,
      title: 'Build Logistic Regression Model',
      description: 'Train your first classification model and calculate accuracy',
      estimated_hours: 2.0,
      is_completed: false
    },
    {
      week_id: week.id,
      topic_order: 5,
      title: 'Build Decision Tree Model',
      description: 'Train decision tree and compare with logistic regression',
      estimated_hours: 2.0,
      is_completed: false
    },
    {
      week_id: week.id,
      topic_order: 6,
      title: 'Compare Models & Document',
      description: 'Analyze results, understand overfitting, write learning article',
      estimated_hours: 2.0,
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

  console.log('\n🎉 Week 2 import complete!')
  console.log('\n📊 Summary:')
  console.log('   Program: AI/ML Analyst Training')
  console.log('   Week 2:', week.title)
  console.log('   Topics:', createdTopics.length)
  console.log('   Format: Matches curriculum.md exactly')
  console.log('\n✅ Content includes:')
  console.log('   - Gemini Tutoring Plan (Mon-Tue, 3 sessions)')
  console.log('   - Building Phase (Wed-Sat, 5 phases)')
  console.log('   - Sunday Documentation (Portfolio + Article)')
  console.log('   - Key Gemini Prompts for troubleshooting')
  console.log('   - Success Criteria checklist')
  console.log('\n🌐 Visit: http://localhost:3001/learning/week/2')
}

main().catch(console.error)
