import { supabase } from '@/lib/supabase'
import {
  TelegramUser,
  CreateTelegramUserInput,
  UpdateTelegramUserInput,
  TelegramMessage,
  CreateTelegramMessageInput,
  TelegramConversationState,
  CreateTelegramConversationStateInput,
  UpdateTelegramConversationStateInput,
} from '@/types/database'

/**
 * TelegramUserService - Manage Telegram user mappings and conversation state
 */
export class TelegramUserService {
  /**
   * Get or create a Telegram user
   * This is the main entry point for user registration
   */
  static async getOrCreateUser(
    telegramChatId: number,
    telegramUsername?: string,
    telegramFirstName?: string,
    userId = 'default-user' // TODO: Get from auth session
  ): Promise<TelegramUser | null> {
    // Use singleton supabase client

    // Try to find existing user
    const { data: existingUser } = await supabase
      .from('telegram_users')
      .select('*')
      .eq('telegram_chat_id', telegramChatId)
      .single()

    if (existingUser) {
      // Update username/first_name if changed
      if (
        existingUser.telegram_username !== telegramUsername ||
        existingUser.telegram_first_name !== telegramFirstName
      ) {
        const { data: updatedUser } = await supabase
          .from('telegram_users')
          .update({
            telegram_username: telegramUsername,
            telegram_first_name: telegramFirstName,
          })
          .eq('id', existingUser.id)
          .select()
          .single()

        return updatedUser || existingUser
      }

      return existingUser
    }

    // Create new user
    const { data: newUser, error } = await supabase
      .from('telegram_users')
      .insert({
        telegram_chat_id: telegramChatId,
        telegram_username: telegramUsername,
        telegram_first_name: telegramFirstName,
        user_id: userId,
        is_active: true,
        notifications_enabled: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating Telegram user:', error)
      return null
    }

    return newUser
  }

  /**
   * Get a Telegram user by chat ID
   */
  static async getUserByChatId(telegramChatId: number): Promise<TelegramUser | null> {
    // Use singleton supabase client

    const { data, error } = await supabase
      .from('telegram_users')
      .select('*')
      .eq('telegram_chat_id', telegramChatId)
      .single()

    if (error) {
      console.error('Error fetching Telegram user:', error)
      return null
    }

    return data
  }

  /**
   * Update user settings (notifications, active status)
   */
  static async updateUser(
    userId: string,
    updates: UpdateTelegramUserInput
  ): Promise<TelegramUser | null> {
    // Use singleton supabase client

    const { data, error } = await supabase
      .from('telegram_users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating Telegram user:', error)
      return null
    }

    return data
  }

  /**
   * Log a message to the audit trail
   */
  static async logMessage(
    telegramUserId: string,
    direction: 'inbound' | 'outbound',
    messageText: string,
    options?: {
      command?: string
      contextType?: 'crm' | 'trading' | 'habits' | 'ai_chat'
      telegramMessageId?: number
      errorMessage?: string
    }
  ): Promise<TelegramMessage | null> {
    // Use singleton supabase client

    const { data, error } = await supabase
      .from('telegram_messages')
      .insert({
        telegram_user_id: telegramUserId,
        direction,
        message_text: messageText,
        command: options?.command,
        context_type: options?.contextType,
        telegram_message_id: options?.telegramMessageId,
        error_message: options?.errorMessage,
      })
      .select()
      .single()

    if (error) {
      console.error('Error logging Telegram message:', error)
      return null
    }

    return data
  }

  /**
   * Get conversation state for a user
   */
  static async getConversationState(
    telegramUserId: string,
    stateKey: string
  ): Promise<TelegramConversationState | null> {
    // Use singleton supabase client

    const { data, error } = await supabase
      .from('telegram_conversation_state')
      .select('*')
      .eq('telegram_user_id', telegramUserId)
      .eq('state_key', stateKey)
      .single()

    if (error) {
      // Not found is expected
      return null
    }

    // Check if expired
    if (data.expires_at) {
      const expiresAt = new Date(data.expires_at)
      if (expiresAt < new Date()) {
        // Delete expired state
        await this.clearConversationState(telegramUserId, stateKey)
        return null
      }
    }

    return data
  }

  /**
   * Set conversation state for a user
   */
  static async setConversationState(
    telegramUserId: string,
    stateKey: string,
    stateData: Record<string, any>,
    expiresInMinutes = 10
  ): Promise<TelegramConversationState | null> {
    // Use singleton supabase client

    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes)

    // Upsert: update if exists, insert if not
    const { data, error } = await supabase
      .from('telegram_conversation_state')
      .upsert({
        telegram_user_id: telegramUserId,
        state_key: stateKey,
        state_data: stateData,
        expires_at: expiresAt.toISOString(),
      }, {
        onConflict: 'telegram_user_id,state_key'
      })
      .select()
      .single()

    if (error) {
      console.error('Error setting conversation state:', error)
      return null
    }

    return data
  }

  /**
   * Clear conversation state for a user
   */
  static async clearConversationState(
    telegramUserId: string,
    stateKey: string
  ): Promise<boolean> {
    // Use singleton supabase client

    const { error } = await supabase
      .from('telegram_conversation_state')
      .delete()
      .eq('telegram_user_id', telegramUserId)
      .eq('state_key', stateKey)

    if (error) {
      console.error('Error clearing conversation state:', error)
      return false
    }

    return true
  }

  /**
   * Get all active Telegram users (for scheduled notifications)
   */
  static async getActiveUsers(): Promise<TelegramUser[]> {
    // Use singleton supabase client

    const { data, error } = await supabase
      .from('telegram_users')
      .select('*')
      .eq('is_active', true)
      .eq('notifications_enabled', true)

    if (error) {
      console.error('Error fetching active Telegram users:', error)
      return []
    }

    return data || []
  }

  /**
   * Clean up expired conversation states
   */
  static async cleanupExpiredStates(): Promise<number> {
    // Use singleton supabase client

    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('telegram_conversation_state')
      .delete()
      .lt('expires_at', now)
      .select('id')

    if (error) {
      console.error('Error cleaning up expired states:', error)
      return 0
    }

    return data?.length || 0
  }
}
