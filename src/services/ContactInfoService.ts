import { supabase, TABLES } from '@/lib/supabase'
import { ContactInfo, CreateContactInfoInput, UpdateContactInfoInput } from '@/types/database'

export class ContactInfoService {
  /**
   * Create a new contact info entry
   */
  static async create(input: CreateContactInfoInput): Promise<ContactInfo> {
    // If setting as primary, unset any existing primary for this contact and type
    if (input.is_primary) {
      await this.unsetPrimaryForType(input.contact_id, input.type)
    }

    const { data, error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .insert(input)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create contact info: ${error.message}`)
    }

    return data
  }

  /**
   * Get contact info by ID
   */
  static async getById(id: string): Promise<ContactInfo | null> {
    const { data, error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .select()
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // No rows returned
      }
      throw new Error(`Failed to get contact info: ${error.message}`)
    }

    return data
  }

  /**
   * Get all contact info for a specific contact
   */
  static async getByContactId(contactId: string): Promise<ContactInfo[]> {
    const { data, error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .select()
      .eq('contact_id', contactId)
      .order('type')
      .order('is_primary', { ascending: false })

    if (error) {
      throw new Error(`Failed to get contact info: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get contact info by contact ID and type
   */
  static async getByContactIdAndType(
    contactId: string, 
    type: ContactInfo['type']
  ): Promise<ContactInfo[]> {
    const { data, error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .select()
      .eq('contact_id', contactId)
      .eq('type', type)
      .order('is_primary', { ascending: false })

    if (error) {
      throw new Error(`Failed to get contact info: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get primary contact info for a specific contact and type
   */
  static async getPrimaryByContactIdAndType(
    contactId: string,
    type: ContactInfo['type']
  ): Promise<ContactInfo | null> {
    const { data, error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .select()
      .eq('contact_id', contactId)
      .eq('type', type)
      .eq('is_primary', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // No rows returned
      }
      throw new Error(`Failed to get primary contact info: ${error.message}`)
    }

    return data
  }

  /**
   * Update contact info by ID
   */
  static async update(id: string, input: UpdateContactInfoInput): Promise<ContactInfo> {
    // Get current contact info to check if we need to handle primary flag logic
    const current = await this.getById(id)
    if (!current) {
      throw new Error('Contact info not found')
    }

    // If setting as primary, unset any existing primary for this contact and type
    if (input.is_primary && !current.is_primary) {
      await this.unsetPrimaryForType(current.contact_id, current.type)
    }

    const { data, error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update contact info: ${error.message}`)
    }

    return data
  }

  /**
   * Delete contact info by ID
   */
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete contact info: ${error.message}`)
    }
  }

  /**
   * Set a contact info as primary (unsets others of same type for same contact)
   */
  static async setPrimary(id: string): Promise<ContactInfo> {
    const contactInfo = await this.getById(id)
    if (!contactInfo) {
      throw new Error('Contact info not found')
    }

    // Unset primary for all other contact info of same type for same contact
    await this.unsetPrimaryForType(contactInfo.contact_id, contactInfo.type)

    // Set this one as primary
    return this.update(id, { is_primary: true })
  }

  /**
   * Unset primary flag for all contact info of a specific type for a contact
   */
  private static async unsetPrimaryForType(
    contactId: string,
    type: ContactInfo['type']
  ): Promise<void> {
    const { error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .update({ is_primary: false, updated_at: new Date().toISOString() })
      .eq('contact_id', contactId)
      .eq('type', type)
      .eq('is_primary', true)

    if (error) {
      throw new Error(`Failed to unset primary contact info: ${error.message}`)
    }
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Validate phone number (basic E.164 format check)
   */
  static validatePhone(phone: string): boolean {
    // Basic E.164 format: +[1-9]\d{1,14}
    const phoneRegex = /^\+[1-9]\d{1,14}$/
    return phoneRegex.test(phone)
  }

  /**
   * Format phone number to E.164 format
   */
  static formatPhoneToE164(phone: string, countryCode: string = '+1'): string {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '')
    
    // If it already starts with country code digits, use as is
    if (digits.length > 10 && digits.startsWith(countryCode.replace('+', ''))) {
      return '+' + digits
    }
    
    // If it's a US number (10 digits), add +1
    if (digits.length === 10 && countryCode === '+1') {
      return '+1' + digits
    }
    
    // Otherwise, add the provided country code
    return countryCode + digits
  }

  /**
   * Validate and create contact info with proper formatting
   */
  static async createWithValidation(input: CreateContactInfoInput): Promise<ContactInfo> {
    const formattedInput = { ...input }

    // Validate and format based on type
    switch (input.type) {
      case 'email':
        if (!this.validateEmail(input.value)) {
          throw new Error('Invalid email format')
        }
        formattedInput.value = input.value.toLowerCase().trim()
        break
      
      case 'phone':
        const formattedPhone = this.formatPhoneToE164(input.value)
        if (!this.validatePhone(formattedPhone)) {
          throw new Error('Invalid phone number format')
        }
        formattedInput.value = formattedPhone
        break
      
      case 'address':
        formattedInput.value = input.value.trim()
        if (formattedInput.value.length === 0) {
          throw new Error('Address cannot be empty')
        }
        break
    }

    return this.create(formattedInput)
  }

  /**
   * Get all contact methods organized by type for a contact
   */
  static async getOrganizedByContact(contactId: string): Promise<{
    phone: ContactInfo[]
    email: ContactInfo[]
    address: ContactInfo[]
  }> {
    const allContactInfo = await this.getByContactId(contactId)
    
    return {
      phone: allContactInfo.filter(ci => ci.type === 'phone'),
      email: allContactInfo.filter(ci => ci.type === 'email'),
      address: allContactInfo.filter(ci => ci.type === 'address')
    }
  }

  /**
   * Get primary contact methods for a contact
   */
  static async getPrimaryMethods(contactId: string): Promise<{
    phone?: ContactInfo
    email?: ContactInfo
    address?: ContactInfo
  }> {
    const primaryPhone = await this.getPrimaryByContactIdAndType(contactId, 'phone')
    const primaryEmail = await this.getPrimaryByContactIdAndType(contactId, 'email')
    const primaryAddress = await this.getPrimaryByContactIdAndType(contactId, 'address')

    return {
      ...(primaryPhone && { phone: primaryPhone }),
      ...(primaryEmail && { email: primaryEmail }),
      ...(primaryAddress && { address: primaryAddress })
    }
  }

  /**
   * Delete all contact info for a specific contact
   */
  static async deleteByContactId(contactId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.CONTACT_INFO)
      .delete()
      .eq('contact_id', contactId)

    if (error) {
      throw new Error(`Failed to delete contact info for contact: ${error.message}`)
    }
  }
}