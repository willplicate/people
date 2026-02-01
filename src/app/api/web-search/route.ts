import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

/**
 * Web Search API - Uses Claude with extended search capabilities
 * This endpoint is called by the Telegram bot's AI chat handler
 */
export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json()

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    // Use Claude with extended capabilities to search and summarize
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Search the web for: ${query}\n\nProvide a concise summary (2-3 paragraphs) with key facts. Include relevant numbers, dates, or data points.`,
        },
      ],
    })

    const textContent = message.content.find(
      (block) => block.type === 'text'
    ) as Anthropic.TextBlock | undefined

    const summary = textContent?.text || 'No results found'

    return NextResponse.json({
      success: true,
      query,
      summary,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Web Search] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    )
  }
}
