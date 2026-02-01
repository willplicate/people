import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tdclhoimzksmqmnsaccw.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY not found. Server-side operations may fail.')
}

/**
 * Admin Supabase client with service role key
 * IMPORTANT: Only use this on the server-side (API routes, server components, server actions)
 * This client bypasses Row Level Security (RLS) policies
 */
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey || '',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)
