import { NextRequest, NextResponse } from 'next/server'
import { getTelegramService } from '@/services/TelegramService'

/**
 * Telegram Webhook Setup Route
 * Call this endpoint once to register the webhook with Telegram
 *
 * Usage:
 * GET /api/telegram/setup
 *
 * This will:
 * 1. Get the current webhook info
 * 2. Set the webhook URL to your Vercel deployment
 * 3. Return the status
 */
export async function GET(req: NextRequest) {
  try {
    const telegramService = getTelegramService()

    // Get current webhook info
    const webhookInfo = await telegramService.getWebhookInfo()

    if (!webhookInfo.ok) {
      return NextResponse.json(
        {
          error: 'Failed to get webhook info',
          details: webhookInfo.description,
        },
        { status: 500 }
      )
    }

    // Construct webhook URL
    const host = req.headers.get('host')
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    const webhookUrl = `${protocol}://${host}/api/telegram/webhook`

    // Get secret token from env
    const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET

    // Set webhook
    const setWebhookResult = await telegramService.setWebhook(
      webhookUrl,
      secretToken
    )

    if (!setWebhookResult.ok) {
      return NextResponse.json(
        {
          error: 'Failed to set webhook',
          details: setWebhookResult.description,
        },
        { status: 500 }
      )
    }

    // Get bot info
    const botInfo = await telegramService.getMe()

    return NextResponse.json({
      success: true,
      webhook_url: webhookUrl,
      previous_webhook: webhookInfo.result?.url || 'None',
      bot_info: botInfo.result,
      message: 'Webhook successfully configured!',
    })
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Delete webhook (for testing or switching to polling mode)
 * Usage: DELETE /api/telegram/setup
 */
export async function DELETE(req: NextRequest) {
  try {
    const telegramService = getTelegramService()

    const result = await telegramService.deleteWebhook()

    if (!result.ok) {
      return NextResponse.json(
        {
          error: 'Failed to delete webhook',
          details: result.description,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook deleted successfully',
    })
  } catch (error) {
    console.error('Delete webhook error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
