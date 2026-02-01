import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database table names for Life Coach
export const TABLES = {
  LIFE_HABITS: 'life_habits',
  LIFE_HABIT_LOGS: 'life_habit_logs',
  LIFE_COACH_MESSAGES: 'life_coach_messages',
  LIFE_INSIGHTS: 'life_insights',
  TEAM_WILCAS_TASKS: 'team_wilcas_tasks',
  TURTLE_POSITIONS: 'turtle_positions',
  TURTLE_TRADES: 'turtle_trades',
  TURTLE_MARKET_DATA: 'turtle_market_data',
  TURTLE_ASSIGNMENTS: 'turtle_assignments'
} as const
