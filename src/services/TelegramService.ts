import {
  TelegramResponse,
  TelegramMessage,
  TelegramWebhookInfo,
  SendMessageOptions,
} from '@/lib/telegram/types'

/**
 * TelegramService - Core wrapper for Telegram Bot API
 * Handles all HTTP communication with Telegram servers
 */
export class TelegramService {
  private readonly baseUrl: string
  private readonly botToken: string

  constructor(botToken?: string) {
    this.botToken = botToken || process.env.TELEGRAM_BOT_TOKEN || ''

    if (!this.botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN is not set')
    }

    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`
  }

  /**
   * Make a request to Telegram Bot API
   */
  private async makeRequest<T>(
    method: string,
    params?: Record<string, any>
  ): Promise<TelegramResponse<T>> {
    try {
      const url = `${this.baseUrl}/${method}`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params || {}),
      })

      const data = await response.json() as TelegramResponse<T>

      if (!data.ok) {
        console.error('Telegram API error:', data)
      }

      return data
    } catch (error) {
      console.error('Telegram request error:', error)
      return {
        ok: false,
        error_code: 500,
        description: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Send a text message to a chat
   */
  async sendMessage(
    chatId: number,
    text: string,
    options?: SendMessageOptions
  ): Promise<TelegramResponse<TelegramMessage>> {
    return this.makeRequest<TelegramMessage>('sendMessage', {
      chat_id: chatId,
      text,
      ...options,
    })
  }

  /**
   * Send a message with retry logic
   */
  async sendMessageWithRetry(
    chatId: number,
    text: string,
    options?: SendMessageOptions,
    maxRetries = 3
  ): Promise<TelegramResponse<TelegramMessage>> {
    let lastError: TelegramResponse<TelegramMessage> | null = null

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const response = await this.sendMessage(chatId, text, options)

      if (response.ok) {
        return response
      }

      lastError = response

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        await this.sleep(Math.pow(2, attempt) * 1000)
      }
    }

    return lastError!
  }

  /**
   * Set webhook URL for receiving updates
   */
  async setWebhook(
    url: string,
    secretToken?: string
  ): Promise<TelegramResponse<boolean>> {
    return this.makeRequest<boolean>('setWebhook', {
      url,
      secret_token: secretToken,
      allowed_updates: ['message', 'callback_query'],
      drop_pending_updates: false,
    })
  }

  /**
   * Get current webhook info
   */
  async getWebhookInfo(): Promise<TelegramResponse<TelegramWebhookInfo>> {
    return this.makeRequest<TelegramWebhookInfo>('getWebhookInfo')
  }

  /**
   * Delete webhook (switch back to getUpdates mode)
   */
  async deleteWebhook(): Promise<TelegramResponse<boolean>> {
    return this.makeRequest<boolean>('deleteWebhook')
  }

  /**
   * Get bot information
   */
  async getMe(): Promise<TelegramResponse<any>> {
    return this.makeRequest('getMe')
  }

  /**
   * Answer callback query (for inline keyboard buttons)
   */
  async answerCallbackQuery(
    callbackQueryId: string,
    text?: string,
    showAlert = false
  ): Promise<TelegramResponse<boolean>> {
    return this.makeRequest<boolean>('answerCallbackQuery', {
      callback_query_id: callbackQueryId,
      text,
      show_alert: showAlert,
    })
  }

  /**
   * Send chat action (typing indicator, etc.)
   */
  async sendChatAction(
    chatId: number,
    action: 'typing' | 'upload_photo' | 'upload_document'
  ): Promise<TelegramResponse<boolean>> {
    return this.makeRequest<boolean>('sendChatAction', {
      chat_id: chatId,
      action,
    })
  }

  /**
   * Helper: Sleep for a given duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Format text with Markdown
   */
  static formatMarkdown(text: string): SendMessageOptions {
    return {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    }
  }

  /**
   * Format text with HTML
   */
  static formatHTML(text: string): SendMessageOptions {
    return {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }
  }
}

// Singleton instance
let telegramServiceInstance: TelegramService | null = null

export function getTelegramService(): TelegramService {
  if (!telegramServiceInstance) {
    telegramServiceInstance = new TelegramService()
  }
  return telegramServiceInstance
}
