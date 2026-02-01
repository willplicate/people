import { NextRequest, NextResponse } from 'next/server'
import { GmailService } from '@/services/GmailService'

/**
 * Gmail OAuth Connect Endpoint
 * Generates auth URL and redirects user to Google consent screen
 *
 * Usage: /api/auth/gmail/connect?userId=<telegram_user_id>
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      )
    }

    // Generate OAuth URL
    const authUrl = GmailService.getAuthUrl(userId)

    // Redirect to Google consent screen
    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('[Gmail Connect] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to connect Gmail' },
      { status: 500 }
    )
  }
}
