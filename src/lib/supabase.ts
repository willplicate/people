import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tdclhoimzksmqmnsaccw.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkY2xob2ltemtzbXFtbnNhY2N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NzAxMjUsImV4cCI6MjA3MjI0NjEyNX0.lkxHRLuT4liiDJWt4AnSk24rFY5E3sceyApZ7kVTGL4'

// Create client with proper error handling for build time
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Prevent issues during build time
    detectSessionInUrl: false // Don't try to detect sessions during build
  },
  global: {
    fetch: typeof fetch !== 'undefined' ? fetch : (() => Promise.reject(new Error('Fetch not available during build'))) as any
  }
})

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