import { google } from 'googleapis'
import { ContactService } from './ContactService'
import { ContactInfoService } from './ContactInfoService'
import { SyncHistoryService } from './SyncHistoryService'
import { CreateContactInput, CreateContactInfoInput } from '@/types/database'

export interface GoogleContact {
  resourceName?: string
  names?: Array<{
    displayName?: string
    givenName?: string
    familyName?: string
  }>
  emailAddresses?: Array<{
    value?: string
    type?: string
    metadata?: {
      primary?: boolean
    }
  }>
  phoneNumbers?: Array<{
    value?: string
    type?: string
    metadata?: {
      primary?: boolean
    }
  }>
  addresses?: Array<{
    formattedValue?: string
    type?: string
    metadata?: {
      primary?: boolean
    }
  }>
  birthdays?: Array<{
    date?: {
      year?: number
      month?: number
      day?: number
    }
  }>
}

export interface SyncResult {
  imported: number
  updated: number
  skipped: number
  errors: string[]
}

export class GoogleSyncService {
  private static async createPeopleClient(accessToken: string) {
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: accessToken })

    return google.people({
      version: 'v1',
      auth
    })
  }

  /**
   * Fetch all contacts from Google Contacts
   */
  static async fetchGoogleContacts(accessToken: string): Promise<GoogleContact[]> {
    try {
      const people = await this.createPeopleClient(accessToken)

      let allContacts: GoogleContact[] = []
      let nextPageToken = undefined

      do {
        const response = await people.people.connections.list({
          resourceName: 'people/me',
          pageSize: 1000,
          personFields: 'names,emailAddresses,phoneNumbers,addresses,birthdays',
          pageToken: nextPageToken
        })

        if (response.data.connections) {
          allContacts = allContacts.concat(response.data.connections)
        }

        nextPageToken = response.data.nextPageToken
      } while (nextPageToken)

      return allContacts
    } catch (error) {
      console.error('Error fetching Google contacts:', error)
      throw new Error('Failed to fetch Google contacts')
    }
  }

  /**
   * Convert Google contact to our contact format
   */
  private static convertGoogleContact(googleContact: GoogleContact): {
    contact: CreateContactInput
    contactInfo: CreateContactInfoInput[]
  } {
    const names = googleContact.names?.[0]
    const primaryEmail = googleContact.emailAddresses?.find(e => e.metadata?.primary) || googleContact.emailAddresses?.[0]
    const primaryPhone = googleContact.phoneNumbers?.find(p => p.metadata?.primary) || googleContact.phoneNumbers?.[0]
    const primaryAddress = googleContact.addresses?.find(a => a.metadata?.primary) || googleContact.addresses?.[0]
    const birthday = googleContact.birthdays?.[0]

    // Create contact
    const contact: CreateContactInput = {
      first_name: names?.givenName || names?.displayName?.split(' ')[0] || 'Unknown',
      last_name: names?.familyName || (names?.displayName?.split(' ').slice(1).join(' ')) || null,
      nickname: null,
      birthday: birthday?.date ? `${String(birthday.date.month).padStart(2, '0')}-${String(birthday.date.day).padStart(2, '0')}` : null,
      communication_frequency: null, // User will set this manually
      last_contacted_at: null,
      reminders_paused: true, // Default to paused until user sets frequency
      is_emergency: false,
      notes: 'Imported from Google Contacts'
    }

    // Create contact info
    const contactInfo: CreateContactInfoInput[] = []

    if (primaryEmail?.value) {
      contactInfo.push({
        contact_id: '', // Will be set after contact creation
        type: 'email',
        label: this.mapGoogleTypeToLabel(primaryEmail.type) as 'home' | 'work' | 'mobile' | 'other',
        value: primaryEmail.value,
        is_primary: true
      })
    }

    if (primaryPhone?.value) {
      contactInfo.push({
        contact_id: '', // Will be set after contact creation
        type: 'phone',
        label: this.mapGooglePhoneTypeToLabel(primaryPhone.type) as 'home' | 'work' | 'mobile' | 'other',
        value: primaryPhone.value,
        is_primary: true
      })
    }

    if (primaryAddress?.formattedValue) {
      contactInfo.push({
        contact_id: '', // Will be set after contact creation
        type: 'address',
        label: this.mapGoogleTypeToLabel(primaryAddress.type) as 'home' | 'work' | 'mobile' | 'other',
        value: primaryAddress.formattedValue,
        is_primary: true
      })
    }

    return { contact, contactInfo }
  }

  /**
   * Map Google contact type to our label system
   */
  private static mapGoogleTypeToLabel(type?: string): string {
    if (!type) return 'other'

    const lowerType = type.toLowerCase()
    if (lowerType.includes('home')) return 'home'
    if (lowerType.includes('work')) return 'work'
    if (lowerType.includes('mobile') || lowerType.includes('cell')) return 'mobile'
    return 'other'
  }

  /**
   * Map Google phone type to our label system
   */
  private static mapGooglePhoneTypeToLabel(type?: string): string {
    if (!type) return 'mobile' // Default to mobile for phones

    const lowerType = type.toLowerCase()
    if (lowerType.includes('home')) return 'home'
    if (lowerType.includes('work')) return 'work'
    if (lowerType.includes('mobile') || lowerType.includes('cell')) return 'mobile'
    return 'mobile' // Default to mobile for phones
  }

  /**
   * Check if contact already exists by email or name
   */
  private static async findExistingContact(googleContact: GoogleContact) {
    const names = googleContact.names?.[0]
    const primaryEmail = googleContact.emailAddresses?.find(e => e.metadata?.primary) || googleContact.emailAddresses?.[0]

    if (primaryEmail?.value) {
      // Search by email in contact info
      // This would require a new method in ContactInfoService to search by email
      // For now, we'll do a simple name-based search
    }

    if (names?.displayName) {
      const existingContacts = await ContactService.search(names.displayName)
      if (existingContacts.length > 0) {
        return existingContacts[0]
      }
    }

    return null
  }

  /**
   * Sync Google contacts to local database
   */
  static async syncContacts(accessToken: string): Promise<SyncResult> {
    const startTime = new Date()
    const result: SyncResult = {
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: []
    }

    try {
      console.log('Fetching Google contacts...')
      const googleContacts = await this.fetchGoogleContacts(accessToken)
      console.log(`Found ${googleContacts.length} Google contacts`)

      for (const googleContact of googleContacts) {
        try {
          // Skip contacts without names
          if (!googleContact.names?.[0]?.givenName && !googleContact.names?.[0]?.displayName) {
            result.skipped++
            continue
          }

          // Check if contact already exists
          const existingContact = await this.findExistingContact(googleContact)

          if (existingContact) {
            result.skipped++
            continue // Skip for now, could implement update logic later
          }

          // Convert and create new contact
          const { contact, contactInfo } = this.convertGoogleContact(googleContact)

          const createdContact = await ContactService.create(contact)
          result.imported++

          // Create contact info
          for (const info of contactInfo) {
            try {
              await ContactInfoService.create({
                ...info,
                contact_id: createdContact.id
              })
            } catch (error) {
              console.error('Error creating contact info:', error)
              result.errors.push(`Failed to create contact info for ${contact.first_name}`)
            }
          }

        } catch (error) {
          console.error('Error processing contact:', error)
          result.errors.push(`Failed to process contact: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      console.log('Sync completed:', result)

      // Log the sync operation
      const endTime = new Date()
      await SyncHistoryService.logSync('google', result, startTime, endTime)

      return result

    } catch (error) {
      console.error('Error in sync process:', error)

      // Log the failed sync operation
      const endTime = new Date()
      await SyncHistoryService.logSync('google', {
        ...result,
        errors: [...result.errors, error instanceof Error ? error.message : 'Unknown error']
      }, startTime, endTime)

      throw new Error('Failed to sync Google contacts')
    }
  }

  /**
   * Get sync status information
   */
  static async getSyncStatus() {
    try {
      const totalContacts = await ContactService.getCount()
      const importedContacts = await ContactService.getCount({
        // Could add a flag to track imported contacts
      })

      return {
        totalContacts,
        importedContacts,
        lastSync: null, // Could store this in database
        isEnabled: true
      }
    } catch (error) {
      console.error('Error getting sync status:', error)
      throw new Error('Failed to get sync status')
    }
  }
}