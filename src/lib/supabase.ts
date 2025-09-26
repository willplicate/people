import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database table names (prefixed for LinkedinCRM database)
export const TABLES = {
  CONTACTS: 'personal_contacts',
  CONTACT_INFO: 'personal_contact_info',
  INTERACTIONS: 'personal_interactions',
  REMINDERS: 'personal_reminders',
  DELETED_CONTACTS: 'personal_deleted_contacts',
  TASKS: 'personal_tasks',
  SHOPPING_LISTS: 'personal_shopping_lists',
  SHOPPING_ITEMS: 'personal_shopping_items',
  RECIPES: 'personal_recipes',
  HABITS: 'personal_habits',
  HABIT_COMPLETIONS: 'personal_habit_completions',
  MEETING_AGENDAS: 'meeting_agendas'
} as const