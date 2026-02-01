import { NextRequest, NextResponse } from 'next/server'
import { GmailService } from '@/services/GmailService'
import { getTelegramService } from '@/services/TelegramService'
import { TelegramUserService } from '@/services/TelegramUserService'
import { supabase } from '@/lib/supabase'

/**
 * Gmail OAuth Callback Endpoint
 * Handles the redirect from Google after user authorizes
 *
 * Google will redirect here with: ?code=<auth_code>&state=<user_id>
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const userId = searchParams.get('state') // user_id passed as state

    if (!code || !userId) {
      return new NextResponse(
        '<html><body><h1>Error</h1><p>Missing authorization code or user ID</p></body></html>',
        { status: 400, headers: { 'Content-Type': 'text/html' } }
      )
    }

    // Exchange code for tokens and store them
    await GmailService.handleCallback(code, userId)

    // Send confirmation via Telegram
    try {
      const telegramUser = await supabase
        .from('telegram_users')
        .select('telegram_chat_id')
        .eq('user_id', userId)
        .single()

      if (telegramUser.data) {
        const telegramService = getTelegramService()
        await telegramService.sendMessage(
          telegramUser.data.telegram_chat_id,
          '✅ Gmail connected successfully! I\'ll now monitor your inbox for important emails every 30 minutes.\n\nUse /email to check settings.',
          { parse_mode: 'Markdown' }
        )
      }
    } catch (error) {
      console.error('Error sending Telegram confirmation:', error)
    }

    // Return success page
    return new NextResponse(
      `<html>
        <head>
          <title>Gmail Connected</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container {
              text-align: center;
              padding: 2rem;
              background: rgba(255,255,255,0.1);
              border-radius: 12px;
              backdrop-filter: blur(10px);
            }
            h1 { margin: 0 0 1rem 0; }
            p { margin: 0.5rem 0; opacity: 0.9; }
            .checkmark {
              font-size: 64px;
              margin-bottom: 1rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="checkmark">✅</div>
            <h1>Gmail Connected!</h1>
            <p>James will now monitor your inbox for important emails.</p>
            <p style="margin-top: 2rem; font-size: 0.9em;">You can close this window and return to Telegram.</p>
          </div>
        </body>
      </html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    )
  } catch (error) {
    console.error('[Gmail Callback] Error:', error)

    return new NextResponse(
      `<html>
        <head>
          <title>Error</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: #f44336;
              color: white;
            }
            .container {
              text-align: center;
              padding: 2rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Connection Failed</h1>
            <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
            <p style="margin-top: 2rem;">Please try again or contact support.</p>
          </div>
        </body>
      </html>`,
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    )
  }
}
