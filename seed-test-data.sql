-- ============================================================================
-- SEED TEST DATA - Quick setup for testing LMS
-- ============================================================================
-- Run this AFTER running lms-database-schema.sql
-- This creates minimal test data so you can see the UI working
-- ============================================================================

-- STEP 1: Create a test program
INSERT INTO learning_programs (name, description, role_description, total_weeks, status, intro_content)
VALUES (
  'AI/ML Analyst Training',
  'Comprehensive 20-week program to become a professional AI/ML Analyst',
  'An Applied AI/ML Analyst sits at the intersection of data science, business strategy, and practical problem-solving. Unlike ML Engineers who build production infrastructure or Research Scientists who push theoretical boundaries, Applied AI/ML Analysts take real business problems and solve them with machine learning.',
  20,
  'active',
  '# Welcome to AI/ML Analyst Training

## Program Overview
This 20-week intensive program will take you from beginner to job-ready AI/ML Analyst.

## What You''ll Learn
- Python programming and data analysis
- Machine learning fundamentals
- Model building and evaluation
- Real-world project experience
- Communication and presentation skills

## Time Commitment
- **Recommended**: 10-15 hours per week
- **Minimum**: 7 hours per week

Let''s begin!'
)
RETURNING id; -- Copy this ID for next steps

-- ============================================================================
-- STEP 2: Copy the program ID from above, then run the rest
-- Replace 'YOUR-PROGRAM-ID-HERE' with the actual UUID
-- ============================================================================

-- Week 1: Data Preparation Fundamentals
INSERT INTO learning_weeks (program_id, week_number, title, description, objectives, content, resources)
VALUES (
  'YOUR-PROGRAM-ID-HERE', -- REPLACE THIS
  1,
  'Data Preparation Fundamentals',
  'Understand what machine learning is and learn how to prepare data',
  ARRAY[
    'Define features and labels in machine learning',
    'Understand different data types',
    'Perform basic exploratory data analysis'
  ],
  '# Week 1: Data Preparation Fundamentals

## Overview
Welcome to your first week! This week is about understanding the fundamentals of how we structure data for machine learning.

## Key Concepts

### Features
Features are the input variables that help predict outcomes. Think of them as the "evidence" a model uses to make decisions.

Examples:
- Study hours per day
- Energy level (1-5)
- Day of week
- Time of day

### Labels
Labels are what you''re trying to predict - the "answer" the model learns to predict.

Examples:
- Did you skip studying? (yes/no)
- Test score (0-100)
- Energy level tomorrow (1-5)

### Data Types
- **Numerical**: 1, 2.5, 100 (can do math with these)
- **Categorical**: Monday, Tuesday, Red, Blue (categories/groups)
- **Text**: Notes, descriptions (requires special handling)

## This Week''s Tasks

1. Create a CSV tracking a real behavior
2. Load it with pandas and explore
3. Create 3 visualizations
4. Identify potential features

## Resources
Check the Resources section below for videos and articles!',
  '[
    {
      "type": "video",
      "url": "https://www.youtube.com/watch?v=aircAruvnKk",
      "title": "But what is a neural network? | Deep learning, chapter 1",
      "description": "Great visual introduction to ML concepts"
    },
    {
      "type": "article",
      "url": "https://www.kaggle.com/learn/intro-to-machine-learning",
      "title": "Kaggle: Intro to Machine Learning",
      "description": "Free interactive course"
    }
  ]'::jsonb
)
RETURNING id; -- Copy this week ID for topics

-- ============================================================================
-- STEP 3: Replace 'YOUR-WEEK-ID-HERE' with the week ID from above
-- ============================================================================

-- Topic 1: What is Machine Learning?
INSERT INTO learning_topics (week_id, topic_order, title, description, estimated_hours, is_completed)
VALUES (
  'YOUR-WEEK-ID-HERE', -- REPLACE THIS
  1,
  'What is Machine Learning?',
  'Core concepts and definitions of ML, AI, and data science',
  2.0,
  false
);

-- Topic 2: Features and Labels
INSERT INTO learning_topics (week_id, topic_order, title, description, estimated_hours, is_completed)
VALUES (
  'YOUR-WEEK-ID-HERE', -- REPLACE THIS
  2,
  'Features and Labels',
  'Understanding the input (features) and output (labels) of ML models',
  2.5,
  false
);

-- Topic 3: Data Types
INSERT INTO learning_topics (week_id, topic_order, title, description, estimated_hours, is_completed)
VALUES (
  'YOUR-WEEK-ID-HERE', -- REPLACE THIS
  3,
  'Data Types and Preparation',
  'Working with numerical, categorical, and text data',
  3.0,
  false
);

-- Topic 4: Exploratory Data Analysis (EDA)
INSERT INTO learning_topics (week_id, topic_order, title, description, estimated_hours, is_completed)
VALUES (
  'YOUR-WEEK-ID-HERE', -- REPLACE THIS
  4,
  'Exploratory Data Analysis',
  'Visualizing and understanding your data before modeling',
  2.5,
  false
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check program was created
SELECT id, name, status, total_weeks FROM learning_programs;

-- Check week was created
SELECT id, week_number, title FROM learning_weeks;

-- Check topics were created
SELECT id, topic_order, title FROM learning_topics ORDER BY topic_order;

-- Check progress view works
SELECT * FROM week_progress_summary;

-- ============================================================================
-- DONE! Now visit http://localhost:3001/learning
-- ============================================================================
