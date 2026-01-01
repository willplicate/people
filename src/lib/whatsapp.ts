import { Contact } from '@/types/database'

/**
 * Format phone number for WhatsApp (remove all non-digits except leading +)
 */
export function formatPhoneForWhatsApp(phone: string): string {
  // Remove all spaces, dashes, parentheses
  let cleaned = phone.replace(/[\s\-()]/g, '')

  // If it starts with +, keep it and remove all other non-digits
  if (cleaned.startsWith('+')) {
    return '+' + cleaned.substring(1).replace(/\D/g, '')
  }

  // Otherwise just remove all non-digits
  return cleaned.replace(/\D/g, '')
}

/**
 * Get display name for contact (nickname if available, else first_name)
 */
export function getContactDisplayName(contact: Contact): string {
  return contact.nickname || contact.first_name
}

/**
 * Generate WhatsApp message based on birthday status
 */
export function generateWhatsAppMessage(contact: Contact): string {
  const name = getContactDisplayName(contact)

  if (!contact.birthday) {
    return `Hey ${name}, random question — when's your birthday?`
  }

  return `Hey ${name}, how's it going? Just thinking of you`
}

/**
 * Generate complete WhatsApp link
 */
export function generateWhatsAppLink(phone: string, message: string): string {
  const formattedPhone = formatPhoneForWhatsApp(phone)
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`
}

/**
 * Generate WhatsApp link for a contact
 */
export function getWhatsAppLinkForContact(contact: Contact, phone: string): string {
  const message = generateWhatsAppMessage(contact)
  return generateWhatsAppLink(phone, message)
}
