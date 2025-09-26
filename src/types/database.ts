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

