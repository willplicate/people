import Anthropic from '@anthropic-ai/sdk'
import { ContactService } from './ContactService'
import { supabase } from '@/lib/supabase'

/**
 * EmailFilteringService - Intelligent email classification
 * Uses hybrid approach: rule-based filtering + AI batch classification
 * to minimize API costs while maintaining accuracy
 */
export class EmailFilteringService {
  private static anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  // Common newsletter/marketing domains to auto-ignore
  private static NEWSLETTER_DOMAINS = [
    'substack.com',
    'beehiiv.com',
    'newsletter',
    'noreply',
    'no-reply',
    'mailer-daemon',
    'notifications@',
    'digest@',
    'updates@',
    'marketing@',
    'news@',
  ]

  // Keywords that suggest importance
  private static URGENCY_KEYWORDS = [
    'urgent',
    'asap',
    'important',
    'critical',
    'deadline',
    'emergency',
    'action required',
    'time sensitive',
  ]

  /**
   * Rule-based classification (free, runs first)
   */
  private static async ruleBasedFilter(
    email: {
      from: string
      subject: string
      snippet: string
    },
    userId: string
  ): Promise<{
    classification: 'important' | 'maybe' | 'ignore'
    reason: string
  }> {
    const fromLower = email.from.toLowerCase()
    const subjectLower = email.subject.toLowerCase()
    const snippetLower = email.snippet.toLowerCase()

    // 1. Check if from newsletter/marketing domain
    if (
      this.NEWSLETTER_DOMAINS.some(
        (domain) =>
          fromLower.includes(domain) || fromLower.includes(`@${domain}`)
      )
    ) {
      return {
        classification: 'ignore',
        reason: 'Newsletter/marketing domain',
      }
    }

    // 2. Check if from CRM contact
    try {
      // Extract email address from "Name <email@domain.com>" format
      const emailMatch = email.from.match(/<(.+?)>/) || [null, email.from]
      const senderEmail = emailMatch[1].trim()

      const contacts = await ContactService.getAll({ limit: 1000 })
      const contactEmails = await Promise.all(
        contacts.map(async (contact) => {
          const { data } = await supabase
            .from('contact_info')
            .select('value')
            .eq('contact_id', contact.id)
            .eq('type', 'email')

          return data?.map((d) => d.value.toLowerCase()) || []
        })
      )

      const allContactEmails = contactEmails.flat()

      if (allContactEmails.some((email) => senderEmail.includes(email))) {
        return {
          classification: 'important',
          reason: 'From CRM contact',
        }
      }
    } catch (error) {
      console.error('Error checking CRM contacts:', error)
    }

    // 3. Check for urgency keywords
    if (
      this.URGENCY_KEYWORDS.some(
        (keyword) =>
          subjectLower.includes(keyword) || snippetLower.includes(keyword)
      )
    ) {
      return {
        classification: 'important',
        reason: 'Contains urgency keyword',
      }
    }

    // 4. Check if it's a reply (RE: or FWD:)
    if (subjectLower.startsWith('re:') || subjectLower.startsWith('fwd:')) {
      return {
        classification: 'maybe',
        reason: 'Reply or forward - needs AI review',
      }
    }

    // Default: needs AI classification
    return {
      classification: 'maybe',
      reason: 'Needs AI classification',
    }
  }

  /**
   * AI batch classification (efficient - one API call for multiple emails)
   */
  private static async aiBatchClassification(
    emails: Array<{
      id: string
      from: string
      subject: string
      snippet: string
    }>
  ): Promise<
    Array<{
      id: string
      isImportant: boolean
      reason: string
      confidence: number
    }>
  > {
    if (emails.length === 0) {
      return []
    }

    // Format emails for batch processing
    const emailsList = emails
      .map(
        (email, idx) =>
          `${idx + 1}. From: ${email.from}\n   Subject: ${email.subject}\n   Preview: ${email.snippet.slice(0, 100)}`
      )
      .join('\n\n')

    const prompt = `You are helping classify emails as "important" or "not important" for a busy professional.

Important emails are:
- From colleagues, clients, or business contacts
- Work-related communications requiring action or response
- Time-sensitive personal matters
- Important notifications (bank, legal, tax, etc.)

Not important emails are:
- Marketing emails and promotions
- Newsletters and digests
- Automated notifications (social media, app updates)
- Spam or low-priority subscriptions

Here are ${emails.length} emails to classify:

${emailsList}

For each email (by number), respond in this exact JSON format:
[
  {
    "id": 1,
    "isImportant": true/false,
    "reason": "brief reason",
    "confidence": 0.0-1.0
  }
]

Return ONLY the JSON array, no other text.`

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      })

      const textContent = response.content.find(
        (block) => block.type === 'text'
      ) as Anthropic.TextBlock | undefined

      if (!textContent) {
        throw new Error('No text response from AI')
      }

      // Parse JSON response
      const classifications = JSON.parse(textContent.text)

      // Map back to email IDs
      return classifications.map((c: any, idx: number) => ({
        id: emails[idx].id,
        isImportant: c.isImportant,
        reason: c.reason,
        confidence: c.confidence,
      }))
    } catch (error) {
      console.error('AI batch classification error:', error)
      // Fallback: mark all as maybe important
      return emails.map((email) => ({
        id: email.id,
        isImportant: true,
        reason: 'AI classification failed - defaulting to important',
        confidence: 0.5,
      }))
    }
  }

  /**
   * Classify emails using hybrid approach
   */
  static async classifyEmails(
    emails: Array<{
      id: string
      from: string
      subject: string
      snippet: string
    }>,
    userId: string
  ): Promise<
    Array<{
      id: string
      isImportant: boolean
      reason: string
      method: 'rule' | 'ai'
    }>
  > {
    const results: Array<{
      id: string
      isImportant: boolean
      reason: string
      method: 'rule' | 'ai'
    }> = []

    const needsAIReview: Array<{
      id: string
      from: string
      subject: string
      snippet: string
    }> = []

    // Phase 1: Rule-based filtering
    for (const email of emails) {
      const ruleResult = await this.ruleBasedFilter(email, userId)

      if (ruleResult.classification === 'important') {
        results.push({
          id: email.id,
          isImportant: true,
          reason: ruleResult.reason,
          method: 'rule',
        })
      } else if (ruleResult.classification === 'ignore') {
        results.push({
          id: email.id,
          isImportant: false,
          reason: ruleResult.reason,
          method: 'rule',
        })
      } else {
        // Needs AI review
        needsAIReview.push(email)
      }
    }

    // Phase 2: AI batch classification for ambiguous emails
    if (needsAIReview.length > 0) {
      console.log(
        `[EmailFiltering] ${needsAIReview.length} emails need AI review`
      )
      const aiResults = await this.aiBatchClassification(needsAIReview)

      aiResults.forEach((aiResult) => {
        results.push({
          id: aiResult.id,
          isImportant: aiResult.isImportant,
          reason: aiResult.reason,
          method: 'ai',
        })
      })
    }

    console.log(
      `[EmailFiltering] Classified ${results.length} emails: ${results.filter((r) => r.isImportant).length} important, ${results.filter((r) => !r.isImportant).length} not important`
    )

    return results
  }

  /**
   * Get VIP senders from user settings
   */
  static async getVIPSenders(userId: string): Promise<string[]> {
    const { data } = await supabase
      .from('user_settings')
      .select('email_vip_senders')
      .eq('user_id', userId)
      .single()

    return data?.email_vip_senders || []
  }

  /**
   * Add VIP sender
   */
  static async addVIPSender(userId: string, email: string): Promise<void> {
    const currentVIPs = await this.getVIPSenders(userId)

    if (!currentVIPs.includes(email)) {
      await supabase
        .from('user_settings')
        .update({
          email_vip_senders: [...currentVIPs, email],
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
    }
  }

  /**
   * Remove VIP sender
   */
  static async removeVIPSender(userId: string, email: string): Promise<void> {
    const currentVIPs = await this.getVIPSenders(userId)
    const filtered = currentVIPs.filter((vip) => vip !== email)

    await supabase
      .from('user_settings')
      .update({
        email_vip_senders: filtered,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
  }
}
