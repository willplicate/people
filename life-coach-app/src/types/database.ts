// Database type definitions for Life Coach

export type HabitType = 'cultivate' | 'eliminate' | 'limit'
export type HabitFrequency = 'daily' | 'weekly' | 'monthly'

export type LifeHabit = {
  id: string
  user_id: string
  name: string
  type: HabitType
  frequency: HabitFrequency
  target_count: number // For "max 2x daily" type limits
  current_streak: number
  longest_streak: number
  created_at: string
  updated_at: string
}

export type LifeHabitLog = {
  id: string
  habit_id: string
  log_date: string // YYYY-MM-DD format
  completed: boolean
  count: number // For countable habits
  notes?: string
  created_at: string
}

export type CoachMessageRole = 'user' | 'assistant'

export type LifeCoachMessage = {
  id: string
  user_id: string
  message_date: string // YYYY-MM-DD format
  timestamp: string
  role: CoachMessageRole
  content: string
  context_type?: string // 'morning' | 'anxiety' | 'trading' | 'reflection' | etc.
  created_at: string
}

export type LifeInsight = {
  id: string
  user_id: string
  insight_date: string // YYYY-MM-DD format
  pattern_type?: string // 'imposter' | 'catastrophizing' | 'trading_drift' | etc.
  title: string
  description?: string
  evidence?: string[] // Array of references to specific messages or events
  created_at: string
}

// Input types for Life Coach
export type CreateLifeHabitInput = Omit<LifeHabit, 'id' | 'created_at' | 'updated_at'>
export type UpdateLifeHabitInput = Partial<CreateLifeHabitInput>

export type CreateLifeHabitLogInput = Omit<LifeHabitLog, 'id' | 'created_at'>
export type UpdateLifeHabitLogInput = Partial<CreateLifeHabitLogInput>

export type CreateLifeCoachMessageInput = Omit<LifeCoachMessage, 'id' | 'created_at'>

export type CreateLifeInsightInput = Omit<LifeInsight, 'id' | 'created_at'>
export type UpdateLifeInsightInput = Partial<CreateLifeInsightInput>
