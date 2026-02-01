import { google } from 'googleapis'
import { supabase, TABLES } from '@/lib/supabase'

/**
 * GmailService - Gmail API integration with OAuth2
 *
 * Setup instructions:
 * 1. Go to Google Cloud Console: https://console.cloud.google.com/
 * 2. Create a project or select existing
 * 3. Enable Gmail API
 * 4. Create OAuth 2.0 credentials
 * 5. Add authorized redirect URI: https://your-domain.com/api/auth/gmail/callback
 * 6. Set environment variables:
 *    - GOOGLE_CLIENT_ID
 *    - GOOGLE_CLIENT_SECRET
 *    - GOOGLE_REDIRECT_URI
 */
export class GmailService {
  private static oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  /**
   * Generate OAuth URL for user to authorize Gmail access
   */
  static getAuthUrl(userId: string): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify', // For marking as read
      ],
      state: userId, // Pass user ID to identify them in callback
    })
  }

  /**
   * Exchange authorization code for tokens and store them
   */
  static async handleCallback(code: string, userId: string): Promise<void> {
    const { tokens } = await this.oauth2Client.getToken(code)

    // Store tokens in database
    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        gmail_access_token: tokens.access_token,
        gmail_refresh_token: tokens.refresh_token,
        gmail_token_expiry: tokens.expiry_date
          ? new Date(tokens.expiry_date).toISOString()
          : null,
        gmail_connected: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      throw new Error(`Failed to store Gmail tokens: ${error.message}`)
    }
  }

  /**
   * Get Gmail client for a user
   */
  private static async getGmailClient(userId: string) {
    // Get tokens from database
    const { data, error } = await supabase
      .from('user_settings')
      .select('gmail_access_token, gmail_refresh_token, gmail_token_expiry')
      .eq('user_id', userId)
      .eq('gmail_connected', true)
      .single()

    if (error || !data) {
      throw new Error('Gmail not connected for this user')
    }

    // Set credentials
    this.oauth2Client.setCredentials({
      access_token: data.gmail_access_token,
      refresh_token: data.gmail_refresh_token,
      expiry_date: data.gmail_token_expiry
        ? new Date(data.gmail_token_expiry).getTime()
        : undefined,
    })

    return google.gmail({ version: 'v1', auth: this.oauth2Client })
  }

  /**
   * Get unread emails from inbox
   */
  static async getUnreadEmails(
    userId: string,
    maxResults: number = 20
  ): Promise<Array<{
    id: string
    threadId: string
    from: string
    subject: string
    snippet: string
    date: string
    labels: string[]
  }>> {
    const gmail = await this.getGmailClient(userId)

    // Get list of unread messages
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread',
      maxResults,
    })

    const messages = listResponse.data.messages || []

    if (messages.length === 0) {
      return []
    }

    // Fetch full message details
    const emailDetails = await Promise.all(
      messages.map(async (message) => {
        const msgResponse = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
          format: 'full',
        })

        const headers = msgResponse.data.payload?.headers || []
        const from = headers.find((h) => h.name === 'From')?.value || ''
        const subject = headers.find((h) => h.name === 'Subject')?.value || ''
        const date = headers.find((h) => h.name === 'Date')?.value || ''

        return {
          id: message.id!,
          threadId: message.threadId!,
          from,
          subject,
          snippet: msgResponse.data.snippet || '',
          date,
          labels: msgResponse.data.labelIds || [],
        }
      })
    )

    return emailDetails
  }

  /**
   * Get emails from specific senders
   */
  static async getEmailsFromSenders(
    userId: string,
    senders: string[],
    maxResults: number = 10
  ): Promise<any[]> {
    const gmail = await this.getGmailClient(userId)

    // Build query for multiple senders
    const senderQuery = senders.map((s) => `from:${s}`).join(' OR ')
    const query = `is:unread (${senderQuery})`

    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults,
    })

    const messages = listResponse.data.messages || []

    if (messages.length === 0) {
      return []
    }

    // Fetch full details
    const emailDetails = await Promise.all(
      messages.map(async (message) => {
        const msgResponse = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
          format: 'full',
        })

        const headers = msgResponse.data.payload?.headers || []
        const from = headers.find((h) => h.name === 'From')?.value || ''
        const subject = headers.find((h) => h.name === 'Subject')?.value || ''
        const date = headers.find((h) => h.name === 'Date')?.value || ''

        return {
          id: message.id!,
          threadId: message.threadId!,
          from,
          subject,
          snippet: msgResponse.data.snippet || '',
          date,
          labels: msgResponse.data.labelIds || [],
        }
      })
    )

    return emailDetails
  }

  /**
   * Mark email as read
   */
  static async markAsRead(userId: string, messageId: string): Promise<void> {
    const gmail = await this.getGmailClient(userId)

    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: ['UNREAD'],
      },
    })
  }

  /**
   * Check if user has Gmail connected
   */
  static async isConnected(userId: string): Promise<boolean> {
    const { data } = await supabase
      .from('user_settings')
      .select('gmail_connected')
      .eq('user_id', userId)
      .single()

    return data?.gmail_connected || false
  }

  /**
   * Disconnect Gmail for a user
   */
  static async disconnect(userId: string): Promise<void> {
    await supabase
      .from('user_settings')
      .update({
        gmail_access_token: null,
        gmail_refresh_token: null,
        gmail_token_expiry: null,
        gmail_connected: false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
  }
}
