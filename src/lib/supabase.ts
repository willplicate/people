import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database table names (prefixed for LinkedinCRM database)
export const TABLES = {
  CONTACTS: 'personal_contacts',
  CONTACT_INFO: 'personal_contact_info', 
  INTERACTIONS: 'personal_interactions',
  REMINDERS: 'personal_reminders'
} as const