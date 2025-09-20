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

// Input types for creating/updating records
export type CreateContactInput = Omit<Contact, 'id' | 'created_at' | 'updated_at'>
export type UpdateContactInput = Partial<CreateContactInput>

export type CreateContactInfoInput = Omit<ContactInfo, 'id' | 'created_at' | 'updated_at'>
export type UpdateContactInfoInput = Partial<CreateContactInfoInput>

export type CreateInteractionInput = Omit<Interaction, 'id' | 'created_at' | 'updated_at'>
export type UpdateInteractionInput = Partial<CreateInteractionInput>