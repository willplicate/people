// ============================================================================
// LEARNING MANAGEMENT SYSTEM (LMS) TYPES
// ============================================================================
// Type definitions for your 20-week AI/ML training program
// ============================================================================

/**
 * LearningProgram - The overall training program
 *
 * Example: Your 20-week AI/ML Analyst training
 *
 * Contains:
 *   - Program info (name, description, role you're training for)
 *   - Timeline (start date, target end date)
 *   - Intro content (the overview page shown before Week 1)
 */
export type LearningProgram = {
  id: string
  name: string // e.g., "AI/ML Analyst Training"
  description?: string // What this program covers
  role_description?: string // Description of the target role

  // TIMELINE
  total_weeks: number // e.g., 20
  start_date?: string // When you started (YYYY-MM-DD)
  target_end_date?: string // When you plan to finish

  // STATUS
  status: 'active' | 'completed' | 'paused'

  // INTRO CONTENT
  // This is the "overview" page - shown before jumping into Week 1
  intro_content?: string // Supports Markdown

  created_at: string
  updated_at: string
}

/**
 * LearningWeek - One week of the curriculum
 *
 * Example: "Week 3: Linear Regression"
 *
 * Contains:
 *   - Week number (1-20)
 *   - Title and description
 *   - Learning objectives (what you should accomplish)
 *   - Content (the lesson material)
 *   - Resources (links to videos, articles, courses)
 */
export type LearningWeek = {
  id: string
  program_id: string
  week_number: number // 1-20

  // CONTENT
  title: string // e.g., "Introduction to Machine Learning"
  description?: string // Brief overview of the week
  objectives?: string[] // What you'll learn: ["Build first model", "Understand supervised learning"]
  content?: string // Main lesson content (Markdown)

  // RESOURCES
  // External links: videos, articles, courses
  // Structure: [{ type: 'video', url: 'youtube.com/...', title: 'Intro to ML' }]
  resources?: LearningResource[]

  created_at: string
  updated_at: string
}

/**
 * LearningResource - External learning materials
 *
 * Links to videos, articles, courses, etc.
 */
export type LearningResource = {
  type: 'video' | 'article' | 'course' | 'book' | 'exercise' | 'other'
  url: string
  title: string
  description?: string
  duration_minutes?: number // For videos/courses
}

/**
 * LearningTopic - Individual topic within a week
 *
 * Example: Within "Week 3: Linear Regression", topics might be:
 *   1. "What is Linear Regression?"
 *   2. "Cost Functions"
 *   3. "Gradient Descent"
 *
 * Why separate from weeks?
 *   - Each week covers multiple topics
 *   - You can mark individual topics as completed
 *   - You can track difficulty per topic
 *   - Helps break down learning into manageable chunks
 */
export type LearningTopic = {
  id: string
  week_id: string
  topic_order: number // Order within the week (1, 2, 3...)

  // CONTENT
  title: string // e.g., "Linear Regression Basics"
  description?: string
  content?: string // Detailed explanation (Markdown)

  // TIME ESTIMATE
  estimated_hours?: number // How long this should take (e.g., 2.5)

  // COMPLETION
  // You manually mark this when you feel you've mastered it
  is_completed: boolean
  completed_at?: string

  // DIFFICULTY
  // Your self-assessment: 1=easy, 5=very hard
  difficulty_rating?: number // 1-5

  created_at: string
  updated_at: string
}

/**
 * LearningSession - A record of studying
 *
 * WHY we track sessions:
 *   - See how much time you're spending
 *   - Track which days you study (consistency)
 *   - Save your notes and reflections
 *   - Later analysis: identify difficult topics, best study times, etc.
 *
 * Example session:
 *   {
 *     session_date: "2025-01-15",
 *     week_id: "week-3-id",
 *     duration_minutes: 90,
 *     engagement_level: 4,
 *     session_notes: "Finally understood gradient descent! The animation helped a lot."
 *   }
 */
export type LearningSession = {
  id: string

  // WHAT YOU STUDIED
  program_id: string
  week_id: string
  topic_id?: string // Optional: specific topic

  // WHEN YOU STUDIED
  session_date: string // YYYY-MM-DD
  start_time?: string // Full timestamp
  end_time?: string // Full timestamp
  duration_minutes?: number // Can be calculated from start/end or entered manually

  // YOUR REFLECTIONS
  session_notes?: string // Key takeaways, questions, breakthroughs

  // HOW IT WENT
  engagement_level?: number // 1-5: How focused were you?
  difficulty_encountered?: number // 1-5: How hard was the material?
  mood?: 'energized' | 'focused' | 'tired' | 'frustrated' | 'motivated' | 'confused' | 'confident'

  // TAGS
  // Flexible tagging for later analysis
  // Examples: ["breakthrough", "struggled-with-math", "need-review", "late-night"]
  tags?: string[]

  created_at: string
  updated_at: string
}

/**
 * WeekProgress - Calculated progress for a week
 *
 * This combines data from multiple tables to show:
 *   - How many topics are completed
 *   - How much time you've spent studying this week
 *   - Your average engagement level
 *
 * Calculated from the database view, not stored directly
 */
export type WeekProgress = {
  week_id: string
  program_id: string
  week_number: number
  title: string

  // TOPIC COMPLETION
  total_topics: number
  completed_topics: number
  completion_percentage: number // 0-100

  // STUDY TIME
  total_sessions: number
  total_study_minutes: number
  avg_engagement?: number // Average engagement level across all sessions

  // TIMELINE
  first_studied?: string // First time you studied this week
  last_studied?: string // Most recent study session
}

/**
 * RecentSession - Session with full context
 *
 * Includes program name, week title, topic title
 * Used for displaying recent activity
 */
export type RecentSession = {
  id: string
  session_date: string
  duration_minutes?: number
  engagement_level?: number
  session_notes?: string
  tags?: string[]

  // CONTEXT (joined from other tables)
  program_name: string
  week_number: number
  week_title: string
  topic_title?: string

  created_at: string
}

/**
 * WeekSection - One of three sections within a week
 *
 * Each week is divided into:
 * 1. Study Focus (Monday-Tuesday) - Concepts to learn
 * 2. Practical Experiments (Wednesday-Saturday) - Hands-on work
 * 3. Knowledge Check (Sunday) - Reflection and portfolio
 *
 * This structure provides better formatting and clearer organization
 */
export type WeekSection = {
  id: string
  week_id: string

  // SECTION IDENTIFICATION
  section_type: 'study_focus' | 'practical_experiments' | 'knowledge_check'
  section_order: number // 1, 2, 3

  // SECTION METADATA
  title: string // e.g., "Study Focus (Monday-Tuesday)"
  day_range?: string // e.g., "Monday-Tuesday", "Wednesday-Saturday", "Sunday"

  // CONTENT (Markdown)
  content: string

  created_at: string
  updated_at: string
}

// ============================================================================
// INPUT TYPES (for creating/updating records)
// ============================================================================

export type CreateProgramInput = Omit<LearningProgram, 'id' | 'created_at' | 'updated_at'>
export type UpdateProgramInput = Partial<CreateProgramInput>

export type CreateWeekInput = Omit<LearningWeek, 'id' | 'created_at' | 'updated_at'>
export type UpdateWeekInput = Partial<CreateWeekInput>

export type CreateTopicInput = Omit<LearningTopic, 'id' | 'created_at' | 'updated_at'>
export type UpdateTopicInput = Partial<CreateTopicInput>

export type CreateSessionInput = Omit<LearningSession, 'id' | 'created_at' | 'updated_at'>
export type UpdateSessionInput = Partial<CreateSessionInput>

export type CreateWeekSectionInput = Omit<WeekSection, 'id' | 'created_at' | 'updated_at'>
export type UpdateWeekSectionInput = Partial<CreateWeekSectionInput>

/**
 * WeekNote - Freeform notes for a week
 *
 * Use this to capture:
 * - General observations and thoughts
 * - Breakthroughs and "aha!" moments
 * - Questions that come up
 * - Struggles you're facing
 * - Project ideas
 * - Review notes
 */
export type WeekNote = {
  id: string
  week_id: string
  note_date: string // YYYY-MM-DD
  content: string
  note_type?: 'general' | 'breakthrough' | 'question' | 'struggle' | 'project_idea' | 'review'
  tags?: string[]
  created_at: string
  updated_at: string
}

/**
 * KnowledgeConcept - Structured concept in your knowledge base
 *
 * This builds your personal ML/AI encyclopedia for:
 * - Quick reference and review
 * - Generating quizzes with Gemini
 * - Tracking what you truly understand
 */
export type KnowledgeConcept = {
  id: string
  week_id: string
  topic_id?: string

  // Core concept info
  concept_name: string // e.g., "Features"
  definition: string // e.g., "Input variables that help predict outcomes"
  explanation?: string // Why it matters, how it works
  examples?: string[] // Real-world examples
  related_concepts?: string[] // Links to other concepts

  // Learning tracking
  understanding_level?: number // 1-5: 1=basic, 5=expert
  last_reviewed?: string // YYYY-MM-DD
  times_reviewed: number

  // Quiz generation hints
  quiz_difficulty?: 'easy' | 'medium' | 'hard'
  quiz_focus?: 'definition' | 'application' | 'comparison' | 'calculation'

  created_at: string
  updated_at: string
}

/**
 * ProjectDiscussion - Wednesday project planning with Claude
 *
 * Each Wednesday, after studying Mon-Tue concepts, you discuss your project idea with Claude.
 * This structure helps you:
 * - Remember to have the discussion
 * - Have guided questions ready
 * - Record the conversation and decisions
 */
export type ProjectDiscussion = {
  id: string
  week_id: string
  discussion_date: string // YYYY-MM-DD
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'

  // Pre-generated template
  template_questions?: string[] // Questions to ask Claude

  // Your discussion
  project_idea?: string // What you want to build
  claude_feedback?: string // Claude's suggestions
  refined_approach?: string // Your plan after discussion
  implementation_notes?: string // How to implement

  // Outcome
  confidence_level?: number // 1-5: How confident you feel
  estimated_hours?: number // Time estimate

  created_at: string
  updated_at: string
}

export type CreateWeekNoteInput = Omit<WeekNote, 'id' | 'created_at' | 'updated_at'>
export type UpdateWeekNoteInput = Partial<CreateWeekNoteInput>

export type CreateKnowledgeConceptInput = Omit<KnowledgeConcept, 'id' | 'created_at' | 'updated_at' | 'times_reviewed'>
export type UpdateKnowledgeConceptInput = Partial<CreateKnowledgeConceptInput>

export type CreateProjectDiscussionInput = Omit<ProjectDiscussion, 'id' | 'created_at' | 'updated_at'>
export type UpdateProjectDiscussionInput = Partial<CreateProjectDiscussionInput>
