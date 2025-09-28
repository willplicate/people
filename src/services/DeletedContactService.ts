import { supabase, TABLES } from '@/lib/supabase'
import { DeletedContact, CreateDeletedContactInput, Contact, ContactInfo } from '@/types/database'

export class DeletedContactService {
  /**
   * Record a contact as deleted to prevent re-import during sync
   */
  static async recordDeletion(
    contact: Contact,
    contactInfo?: ContactInfo[],
    deletedBy?: string
  ): Promise<DeletedContact> {
    // Get primary email if available
    const primaryEmail = contactInfo?.find(ci => ci.type === 'email' && ci.is_primary)?.value ||
                        contactInfo?.find(ci => ci.type === 'email')?.value

    const deletedContactData: CreateDeletedContactInput = {
      google_resource_name: undefined, // We don't have this from the original import
      email: primaryEmail || undefined,
      full_name: `${contact.first_name} ${contact.last_name || ''}`.trim(),
      first_name: contact.first_name,
      last_name: contact.last_name,
      deleted_at: new Date().toISOString(),
      deleted_by: deletedBy || 'user',
      reason: 'user_deleted',
      original_contact_id: contact.id
    }

    const { data, error } = await supabase
      .from(TABLES.DELETED_CONTACTS)
      .insert(deletedContactData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to record deleted contact: ${error.message}`)
    }

    return data
  }

  /**
   * Check if a contact was previously deleted by email or name
   */
  static async wasContactDeleted(email?: string, fullName?: string): Promise<boolean> {
    if (!email && !fullName) return false

    let query = supabase.from(TABLES.DELETED_CONTACTS).select('id')

    if (email && fullName) {
      // Check by both email and name for better accuracy
      query = query.or(`email.eq.${email},full_name.eq.${fullName}`)
    } else if (email) {
      query = query.eq('email', email)
    } else if (fullName) {
      query = query.eq('full_name', fullName)
    }

    const { data, error } = await query.limit(1)

    if (error) {
      console.error('Error checking deleted contacts:', error)
      return false // Fail safe - allow sync if we can't check
    }

    return (data?.length || 0) > 0
  }

  /**
   * Check if a Google contact was previously deleted (for sync)
   */
  static async wasGoogleContactDeleted(
    googleResourceName?: string,
    email?: string,
    displayName?: string
  ): Promise<boolean> {
    if (!googleResourceName && !email && !displayName) return false

    const conditions: string[] = []

    if (googleResourceName) {
      conditions.push(`google_resource_name.eq.${googleResourceName}`)
    }
    if (email) {
      conditions.push(`email.eq.${email}`)
    }
    if (displayName) {
      conditions.push(`full_name.eq.${displayName}`)
    }

    if (conditions.length === 0) return false

    const { data, error } = await supabase
      .from(TABLES.DELETED_CONTACTS)
      .select('id')
      .or(conditions.join(','))
      .limit(1)

    if (error) {
      console.error('Error checking deleted Google contacts:', error)
      return false // Fail safe - allow sync if we can't check
    }

    return (data?.length || 0) > 0
  }

  /**
   * Get all deleted contacts (for admin/debugging)
   */
  static async getAll(options?: {
    limit?: number
    offset?: number
  }): Promise<DeletedContact[]> {
    let query = supabase
      .from(TABLES.DELETED_CONTACTS)
      .select()
      .order('deleted_at', { ascending: false })

    if (options?.limit) {
      query = query.limit(options.limit)
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to get deleted contacts: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get count of deleted contacts
   */
  static async getCount(): Promise<number> {
    const { count, error } = await supabase
      .from(TABLES.DELETED_CONTACTS)
      .select('*', { count: 'exact', head: true })

    if (error) {
      throw new Error(`Failed to get deleted contacts count: ${error.message}`)
    }

    return count || 0
  }

  /**
   * Remove a contact from deleted list (in case you want to allow re-import)
   */
  static async unmarkDeleted(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.DELETED_CONTACTS)
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to unmark deleted contact: ${error.message}`)
    }
  }

  /**
   * Clear old deleted contact records (cleanup utility)
   */
  static async clearOldRecords(olderThanDays: number = 365): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    const { data, error } = await supabase
      .from(TABLES.DELETED_CONTACTS)
      .delete()
      .lt('deleted_at', cutoffDate.toISOString())
      .select('id')

    if (error) {
      throw new Error(`Failed to clear old deleted contacts: ${error.message}`)
    }

    return data?.length || 0
  }
}