import { NextRequest, NextResponse } from 'next/server'
import { ContactService } from '@/services/ContactService'
import { ContactInfoService } from '@/services/ContactInfoService'
import { CreateContactInput } from '@/types/database'

interface CSVContactRow {
  first_name: string
  last_name?: string
  nickname?: string
  email?: string
  phone?: string
  address?: string
  birthday?: string
  communication_frequency?: 'weekly' | 'monthly' | 'quarterly' | 'biannually' | 'annually'
  notes?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { csvData, distributeContacts = false } = body

    if (!csvData || !Array.isArray(csvData)) {
      return NextResponse.json(
        { error: 'Invalid CSV data provided' },
        { status: 400 }
      )
    }

    const results = {
      successful: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Get dates to distribute contacts across the year if requested
    const distributionDates = distributeContacts ? generateDistributionDates(csvData.length) : []

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i] as CSVContactRow

      try {
        // Validate required fields
        if (!row.first_name || row.first_name.trim() === '') {
          results.failed++
          results.errors.push(`Row ${i + 1}: First name is required`)
          continue
        }

        // Calculate last_contacted_at based on distribution or current date
        let lastContactedAt: string | null = null

        if (distributeContacts && distributionDates[i] && row.communication_frequency) {
          lastContactedAt = distributionDates[i].toISOString()
        }

        const contactInput: CreateContactInput = {
          first_name: row.first_name.trim(),
          last_name: row.last_name?.trim() || undefined,
          nickname: row.nickname?.trim() || undefined,
          birthday: row.birthday?.trim() || undefined,
          communication_frequency: row.communication_frequency || undefined,
          notes: row.notes?.trim() || undefined,
          last_contacted_at: lastContactedAt || undefined,
          reminders_paused: false,
          is_emergency: false,
          christmas_list: false
        }

        const contact = await ContactService.create(contactInput)

        // Add contact info if provided
        if (row.email || row.phone || row.address) {
          const contactInfoPromises = []

          if (row.email?.trim()) {
            contactInfoPromises.push(
              ContactInfoService.create({
                contact_id: contact.id,
                type: 'email',
                value: row.email.trim(),
                label: 'home',
                is_primary: true
              })
            )
          }

          if (row.phone?.trim()) {
            contactInfoPromises.push(
              ContactInfoService.create({
                contact_id: contact.id,
                type: 'phone',
                value: row.phone.trim(),
                label: 'mobile',
                is_primary: true
              })
            )
          }

          if (row.address?.trim()) {
            contactInfoPromises.push(
              ContactInfoService.create({
                contact_id: contact.id,
                type: 'address',
                value: row.address.trim(),
                label: 'home',
                is_primary: true
              })
            )
          }

          await Promise.all(contactInfoPromises)
        }

        results.successful++
      } catch (error) {
        results.failed++
        results.errors.push(
          `Row ${i + 1} (${row.first_name}): ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }

    return NextResponse.json({
      message: `Import completed: ${results.successful} successful, ${results.failed} failed`,
      results
    })
  } catch (error) {
    console.error('Error importing contacts:', error)
    return NextResponse.json(
      { error: 'Failed to import contacts' },
      { status: 500 }
    )
  }
}

/**
 * Generate random dates distributed across the past year for contact distribution
 * This ensures contacts don't all appear as needing immediate contact
 */
function generateDistributionDates(count: number): Date[] {
  const dates: Date[] = []
  const now = new Date()
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())

  for (let i = 0; i < count; i++) {
    // Generate random date between one year ago and now
    const randomTime = oneYearAgo.getTime() + Math.random() * (now.getTime() - oneYearAgo.getTime())
    dates.push(new Date(randomTime))
  }

  // Sort dates chronologically (oldest first)
  return dates.sort((a, b) => a.getTime() - b.getTime())
}