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

// Turtle Trading Types
export type PositionStatus = 'active' | 'closed' | 'called_away'
export type TradeAction = 'sell' | 'buy_to_close' | 'roll_call' | 'assignment'
export type AssignmentType = 'stock_assigned' | 'expires_worthless' | 'leaps_called_away'

export type TurtlePosition = {
  id: string
  position_name: string
  symbol: string
  leaps_strike: number
  leaps_expiry: string // YYYY-MM-DD format
  leaps_cost_basis: number
  current_value?: number
  current_delta?: number
  contracts: number
  status: PositionStatus
  created_at: string
  updated_at: string
}

export type TurtleTrade = {
  id: string
  position_id: string
  trade_date: string // YYYY-MM-DD format
  action: TradeAction
  strike?: number
  premium: number
  expiry?: string // YYYY-MM-DD format
  notes?: string
  created_at: string
}

export type TurtleMarketData = {
  id: string
  symbol: string
  price: number
  ema21?: number
  ema50?: number
  rsi?: number
  vix?: number
  timestamp: string
  last_api_update: string
}

export type TurtleAssignment = {
  id: string
  position_id: string
  trade_id: string
  assignment_date: string // YYYY-MM-DD format
  assignment_type: AssignmentType
  spy_price_at_assignment?: number
  pnl_impact: number
  notes?: string
}

// Input types for Turtle Trading
export type CreateTurtlePositionInput = Omit<TurtlePosition, 'id' | 'created_at' | 'updated_at'>
export type UpdateTurtlePositionInput = Partial<CreateTurtlePositionInput>

export type CreateTurtleTradeInput = Omit<TurtleTrade, 'id' | 'created_at'>
export type UpdateTurtleTradeInput = Partial<CreateTurtleTradeInput>

export type CreateTurtleMarketDataInput = Omit<TurtleMarketData, 'id'>
export type UpdateTurtleMarketDataInput = Partial<CreateTurtleMarketDataInput>

export type CreateTurtleAssignmentInput = Omit<TurtleAssignment, 'id'>
export type UpdateTurtleAssignmentInput = Partial<CreateTurtleAssignmentInput>
