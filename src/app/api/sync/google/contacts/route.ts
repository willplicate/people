import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { GoogleSyncService } from '@/services/GoogleSyncService'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated with Google' },
        { status: 401 }
      )
    }

    console.log('Starting Google Contacts sync...')
    const result = await GoogleSyncService.syncContacts(session.accessToken as string)

    return NextResponse.json({
      success: true,
      result
    })

  } catch (error) {
    console.error('Error syncing Google contacts:', error)
    return NextResponse.json(
      { error: 'Failed to sync Google contacts' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const status = await GoogleSyncService.getSyncStatus()

    return NextResponse.json({
      success: true,
      status
    })

  } catch (error) {
    console.error('Error getting sync status:', error)
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    )
  }
}