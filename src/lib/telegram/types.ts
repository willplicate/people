// Telegram API types
// Based on Telegram Bot API: https://core.telegram.org/bots/api

export interface TelegramUser {
  id: number
  is_bot: boolean
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
}

export interface TelegramChat {
  id: number
  type: 'private' | 'group' | 'supergroup' | 'channel'
  title?: string
  username?: string
  first_name?: string
  last_name?: string
}

export interface TelegramMessage {
  message_id: number
  from?: TelegramUser
  chat: TelegramChat
  date: number
  text?: string
  entities?: TelegramMessageEntity[]
}

export interface TelegramMessageEntity {
  type: 'bot_command' | 'mention' | 'hashtag' | 'url' | 'email' | 'bold' | 'italic' | 'code' | 'pre'
  offset: number
  length: number
}

export interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
  edited_message?: TelegramMessage
  channel_post?: TelegramMessage
  edited_channel_post?: TelegramMessage
}

export interface TelegramWebhookInfo {
  url: string
  has_custom_certificate: boolean
  pending_update_count: number
  last_error_date?: number
  last_error_message?: string
  max_connections?: number
  allowed_updates?: string[]
}

// Send message options
export interface SendMessageOptions {
  parse_mode?: 'Markdown' | 'MarkdownV2' | 'HTML'
  disable_web_page_preview?: boolean
  disable_notification?: boolean
  reply_to_message_id?: number
  reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove
}

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][]
}

export interface InlineKeyboardButton {
  text: string
  url?: string
  callback_data?: string
}

export interface ReplyKeyboardMarkup {
  keyboard: KeyboardButton[][]
  resize_keyboard?: boolean
  one_time_keyboard?: boolean
  selective?: boolean
}

export interface KeyboardButton {
  text: string
  request_contact?: boolean
  request_location?: boolean
}

export interface ReplyKeyboardRemove {
  remove_keyboard: true
  selective?: boolean
}

// Callback query for inline keyboard buttons
export interface TelegramCallbackQuery {
  id: string
  from: TelegramUser
  message?: TelegramMessage
  inline_message_id?: string
  chat_instance: string
  data?: string
}

// Response types
export interface TelegramResponse<T> {
  ok: boolean
  result?: T
  error_code?: number
  description?: string
}

// Command extraction
export interface ParsedCommand {
  command: string // e.g., "birthdays"
  args: string[] // e.g., ["7"]
  rawArgs: string // e.g., "7"
}
