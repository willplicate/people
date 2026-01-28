// Database type definitions for Supabase tables

export type Contact = {
  id: string
  first_name: string
  last_name?: string
  nickname?: string
  birthday?: string // MM-DD format
  communication_frequency?: 'weekly' | 'monthly' | 'quarterly' | 'biannually' | 'annually'
  last_contacted_at?: string
  reminders_paused: boolean
  is_emergency: boolean
  christmas_list: boolean
  notes?: string
  created_at: string
  updated_at: string
}

export type ContactInfo = {
  id: string
  contact_id: string
  type: 'phone' | 'email' | 'address'
  label: 'home' | 'work' | 'mobile' | 'other'
  value: string
  is_primary: boolean
  created_at: string
  updated_at: string
}

export type Interaction = {
  id: string
  contact_id: string
  type: 'call' | 'text' | 'email' | 'meetup' | 'other'
  notes: string
  interaction_date: string
  created_at: string
  updated_at: string
}

export type Reminder = {
  id: string
  contact_id: string
  type: 'communication' | 'birthday_week' | 'birthday_day'
  scheduled_for: string
  status: 'pending' | 'sent' | 'dismissed'
  message: string
  created_at: string
  sent_at?: string
}

export type DeletedContact = {
  id: string
  google_resource_name?: string
  email?: string
  full_name: string
  first_name?: string
  last_name?: string
  deleted_at: string
  deleted_by?: string
  reason?: string
  original_contact_id?: string
  created_at: string
}

// Input types for creating/updating records
export type CreateContactInput = Omit<Contact, 'id' | 'created_at' | 'updated_at'>
export type UpdateContactInput = Partial<CreateContactInput>

export type CreateContactInfoInput = Omit<ContactInfo, 'id' | 'created_at' | 'updated_at'>
export type UpdateContactInfoInput = Partial<CreateContactInfoInput>

export type CreateInteractionInput = Omit<Interaction, 'id' | 'created_at' | 'updated_at'>
export type UpdateInteractionInput = Partial<CreateInteractionInput>

export type CreateDeletedContactInput = Omit<DeletedContact, 'id' | 'created_at'>
export type UpdateDeletedContactInput = Partial<CreateDeletedContactInput>

// Personal Tasks and Shopping Lists
export type PersonalTask = {
  id: string
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled'
  due_date?: string
  completed_at?: string
  category?: 'work' | 'personal'
  tags?: string[]
  created_at: string
  updated_at: string
}

export type ShoppingList = {
  id: string
  name: string
  description?: string
  status: 'active' | 'completed' | 'archived'
  created_at: string
  updated_at: string
}

export type ShoppingItem = {
  id: string
  shopping_list_id: string
  name: string
  description?: string
  quantity: number
  unit?: string
  category?: string
  priority: 'low' | 'medium' | 'high'
  is_completed: boolean
  estimated_price?: number
  actual_price?: number
  notes?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

// Personal Recipes
export type PersonalRecipe = {
  id: string
  title: string
  description?: string
  ingredients: string
  instructions?: string
  servings?: number
  prep_time?: number
  cook_time?: number
  category?: string
  difficulty: 'easy' | 'medium' | 'hard'
  rating?: number
  notes?: string
  tags?: string[]
  is_favorite: boolean
  created_at: string
  updated_at: string
}

// Input types for personal tasks and shopping
export type CreatePersonalTaskInput = Omit<PersonalTask, 'id' | 'created_at' | 'updated_at'>
export type UpdatePersonalTaskInput = Partial<CreatePersonalTaskInput>

export type CreateShoppingListInput = Omit<ShoppingList, 'id' | 'created_at' | 'updated_at'>
export type UpdateShoppingListInput = Partial<CreateShoppingListInput>

export type CreateShoppingItemInput = Omit<ShoppingItem, 'id' | 'created_at' | 'updated_at'>
export type UpdateShoppingItemInput = Partial<CreateShoppingItemInput>

export type CreatePersonalRecipeInput = Omit<PersonalRecipe, 'id' | 'created_at' | 'updated_at'>
export type UpdatePersonalRecipeInput = Partial<CreatePersonalRecipeInput>

// Habit Tracker Types
export type Habit = {
  id: string
  name: string
  description?: string
  frequency_type: 'daily' | 'weekly' | 'monthly' | 'specific_days'
  frequency_days?: number[] // Array of day numbers (0=Sunday, 1=Monday, ..., 6=Saturday)
  is_active: boolean
  created_at: string
  updated_at: string
}

export type HabitCompletion = {
  id: string
  habit_id: string
  completed_date: string // Date in YYYY-MM-DD format
  completed_at: string
  notes?: string
  created_at: string
}

// Input types for habits
export type CreateHabitInput = Omit<Habit, 'id' | 'created_at' | 'updated_at'>
export type UpdateHabitInput = Partial<CreateHabitInput>

export type CreateHabitCompletionInput = Omit<HabitCompletion, 'id' | 'completed_at' | 'created_at'>
export type UpdateHabitCompletionInput = Partial<CreateHabitCompletionInput>

// Meeting Agendas Types
export type MeetingAgenda = {
  id: string
  title: string
  attendees: string[] // Array of attendee names
  meeting_date?: string
  agenda?: string // Pre-meeting agenda/bullet points
  notes?: string // Meeting notes
  fireflies_link?: string // Optional link to Fireflies recording
  tags?: string[] // Optional tags for categorization
  created_at: string
  updated_at: string
}

// Input types for meeting agendas
export type CreateMeetingAgendaInput = Omit<MeetingAgenda, 'id' | 'created_at' | 'updated_at'>
export type UpdateMeetingAgendaInput = Partial<CreateMeetingAgendaInput>

// Daily Quotes Types
export type DailyQuote = {
  id: string
  quote_text: string
  author?: string
  image_url?: string
  date_assigned?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Input types for daily quotes
export type CreateDailyQuoteInput = Omit<DailyQuote, 'id' | 'created_at' | 'updated_at'>
export type UpdateDailyQuoteInput = Partial<CreateDailyQuoteInput>

// Budget Tracking Types
export type ExpenseCategory = {
  id: string
  name: string
  color: string // Hex color for charts (e.g., '#10b981')
  icon?: string // Optional emoji or icon name
  is_excludable: boolean // Can be toggled off in charts
  sort_order: number
  created_at: string
  updated_at: string
}

export type BudgetMonth = {
  id: string
  year: number
  month: number // 1-12
  is_finalized: boolean
  finalized_at?: string
  finalized_by?: string
  total_budget?: number // Optional global monthly budget limit
  created_at: string
  updated_at: string
}

export type CategoryBudget = {
  id: string
  month_id: string
  category_id: string
  budget_limit: number
  created_at: string
  updated_at: string
}

export type SplitType = 'individual' | 'shared_50_50' | 'custom'

export type Expense = {
  id: string
  month_id: string
  category_id: string
  amount: number // decimal(10,2)
  description?: string
  expense_date: string // Date
  paid_by_user_id: string
  split_type: SplitType
  split_percentage?: number // For custom splits (0-100)
  split_with_user_id?: string
  created_by: string
  created_at: string
  updated_at: string
}

// Extended types with joined data
export type ExpenseWithDetails = Expense & {
  category: ExpenseCategory
  paid_by_email?: string
  split_with_email?: string
}

export type CategoryTotal = {
  category_id: string
  category_name: string
  category_color: string
  category_icon?: string
  total_amount: number
  expense_count: number
  paid_by_current_user: number
  paid_by_partner: number
  shared_amount: number
}

export type MonthlyBalance = {
  month_id: string
  year: number
  month: number
  current_user_paid: number // Total paid by current user
  partner_paid: number // Total paid by partner
  current_user_owes: number // Amount current user owes for shared expenses
  partner_owes: number // Amount partner owes for shared expenses
  net_balance: number // Positive = partner owes current user, Negative = current user owes partner
  net_balance_description: string // Human-readable description
}

// Input types for budget tracking
export type CreateExpenseCategoryInput = Omit<ExpenseCategory, 'id' | 'created_at' | 'updated_at'>
export type UpdateExpenseCategoryInput = Partial<CreateExpenseCategoryInput>

export type CreateBudgetMonthInput = Omit<BudgetMonth, 'id' | 'created_at' | 'updated_at'>
export type UpdateBudgetMonthInput = Partial<CreateBudgetMonthInput>

export type CreateExpenseInput = Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'created_by'>
export type UpdateExpenseInput = Partial<CreateExpenseInput>

// Filter types for expense queries
export type ExpenseFilters = {
  month_id?: string
  category_id?: string
  paid_by_user_id?: string
  split_type?: SplitType
  date_from?: string
  date_to?: string
  search?: string
}

// Homework Journal Types
export type JournalContentItem = {
  text: string
  timestamp: string // ISO 8601 timestamp
}

export type JournalEntry = {
  id: string
  date: string // YYYY-MM-DD format
  content: JournalContentItem[] // Array of timestamped text entries
  created_by: string
  created_at: string
  updated_at: string
}

// Input types for journal entries
export type CreateJournalEntryInput = {
  date: string
  text: string // The text content to add
}

export type AppendJournalEntryInput = {
  text: string // The text content to append
}

export type UpdateJournalEntryInput = Partial<CreateJournalEntryInput>

// Trading Tracker Types
export type TradingSession = {
  id: string
  user_id: string
  session_date: string // DATE
  notes?: string
  account_balance?: number // DECIMAL(12,2)
  balance_updated_at?: string
  created_at: string
  updated_at: string
}

export type OptionType = 'CALL' | 'PUT'
export type TradeAction = 'BUY' | 'SELL'
export type TradeStatus = 'OPEN' | 'CLOSED' | 'EXPIRED' | 'ASSIGNED'

export type OptionsTrade = {
  id: string
  session_id: string
  user_id: string
  trade_date: string // DATE
  ticker_symbol: string
  option_type: OptionType
  action: TradeAction
  strike_price: number // DECIMAL(10,2)
  premium_per_contract: number // DECIMAL(10,2)
  number_of_contracts: number
  expiration_date: string // DATE
  delta?: number // DECIMAL(5,4)
  status: TradeStatus
  closing_date?: string // DATE
  closing_premium?: number // DECIMAL(10,2)
  realized_pl?: number // DECIMAL(10,2) - Profit/Loss
  trade_rationale?: string
  framework_notes?: string
  strategy_group_id?: string // UUID - Links multi-leg strategies together
  strategy_name?: string // e.g., 'PUT_CONDOR', 'IRON_CONDOR', 'VERTICAL_SPREAD'
  created_at: string
  updated_at: string
}

export type ChatMessageRole = 'user' | 'assistant'

export type TradingChatMessage = {
  id: string
  session_id: string
  user_id: string
  role: ChatMessageRole
  content: string
  created_at: string
}

// Input types for trading
export type CreateTradingSessionInput = Omit<TradingSession, 'id' | 'created_at' | 'updated_at'>
export type UpdateTradingSessionInput = Partial<CreateTradingSessionInput>

export type CreateOptionsTradeInput = Omit<OptionsTrade, 'id' | 'created_at' | 'updated_at'>
export type UpdateOptionsTradeInput = Partial<CreateOptionsTradeInput>

export type CreateTradingChatMessageInput = Omit<TradingChatMessage, 'id' | 'created_at'>

// Trade data extracted from screenshot
export type ExtractedTradeData = {
  ticker?: string
  optionType?: OptionType
  action?: TradeAction
  strikePrice?: number
  premiumPerContract?: number
  numberOfContracts?: number
  expirationDate?: string
  delta?: number
}

// Life Coach Types
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

// Personal Encounter Journal Types
export type PersonalEncounter = {
  id: string
  encounter_date: string
  partner_description?: string
  location?: string
  private_notes?: string
  created_by: string
  created_at: string
  updated_at: string
}

export type CreatePersonalEncounterInput = Omit<PersonalEncounter, 'id' | 'created_at' | 'updated_at' | 'created_by'>
export type UpdatePersonalEncounterInput = Partial<CreatePersonalEncounterInput>

// Telegram Bot Types
export type TelegramUser = {
  id: string
  telegram_chat_id: number
  telegram_username?: string
  telegram_first_name?: string
  user_id: string
  is_active: boolean
  notifications_enabled: boolean
  created_at: string
  updated_at: string
}

export type TelegramMessage = {
  id: string
  telegram_user_id: string
  direction: 'inbound' | 'outbound'
  message_text: string
  command?: string
  context_type?: 'crm' | 'trading' | 'habits' | 'ai_chat'
  telegram_message_id?: number
  error_message?: string
  created_at: string
}

export type TelegramConversationState = {
  id: string
  telegram_user_id: string
  state_key: string
  state_data?: Record<string, any>
  expires_at?: string
  created_at: string
  updated_at: string
}

// Input types for Telegram
export type CreateTelegramUserInput = Omit<TelegramUser, 'id' | 'created_at' | 'updated_at'>
export type UpdateTelegramUserInput = Partial<CreateTelegramUserInput>

export type CreateTelegramMessageInput = Omit<TelegramMessage, 'id' | 'created_at'>

export type CreateTelegramConversationStateInput = Omit<TelegramConversationState, 'id' | 'created_at' | 'updated_at'>
export type UpdateTelegramConversationStateInput = Partial<CreateTelegramConversationStateInput>

