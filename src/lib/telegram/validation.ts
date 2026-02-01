import * as crypto from 'crypto'

/**
 * Verify Telegram webhook signature
 * https://core.telegram.org/bots/api#setwebhook
 *
 * Telegram sends X-Telegram-Bot-Api-Secret-Token header if you set one during webhook setup
 */
export function verifyWebhookSignature(
  secretToken: string,
  receivedToken: string | null
): boolean {
  if (!receivedToken) {
    return false
  }

  return crypto.timingSafeEqual(
    Buffer.from(secretToken),
    Buffer.from(receivedToken)
  )
}

/**
 * Validate that the update is from a private chat
 */
export function isPrivateChat(chatType: string): boolean {
  return chatType === 'private'
}

/**
 * Extract command from message text
 * Examples:
 * - "/start" -> { command: "start", args: [], rawArgs: "" }
 * - "/birthdays 7" -> { command: "birthdays", args: ["7"], rawArgs: "7" }
 * - "/log Alex" -> { command: "log", args: ["Alex"], rawArgs: "Alex" }
 */
export function parseCommand(text: string): { command: string; args: string[]; rawArgs: string } | null {
  const trimmed = text.trim()

  if (!trimmed.startsWith('/')) {
    return null
  }

  const parts = trimmed.slice(1).split(/\s+/)
  const command = parts[0].toLowerCase()
  const args = parts.slice(1)
  const rawArgs = args.join(' ')

  return { command, args, rawArgs }
}

/**
 * Sanitize text for Telegram Markdown format
 * Escapes special characters to prevent parsing errors
 */
export function escapeMarkdown(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\*/g, '\\*')
    .replace(/_/g, '\\_')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/~/g, '\\~')
    .replace(/`/g, '\\`')
    .replace(/>/g, '\\>')
    .replace(/#/g, '\\#')
    .replace(/\+/g, '\\+')
    .replace(/-/g, '\\-')
    .replace(/=/g, '\\=')
    .replace(/\|/g, '\\|')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\./g, '\\.')
    .replace(/!/g, '\\!')
}
