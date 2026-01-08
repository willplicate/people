import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database table names for Life Coach
export const TABLES = {
  LIFE_HABITS: 'life_habits',
  LIFE_HABIT_LOGS: 'life_habit_logs',
  LIFE_COACH_MESSAGES: 'life_coach_messages',
  LIFE_INSIGHTS: 'life_insights'
} as const
