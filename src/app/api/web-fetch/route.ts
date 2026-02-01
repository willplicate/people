import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

/**
 * Web Fetch API - Fetches and summarizes content from a specific URL
 * This endpoint is called by the Telegram bot's AI chat handler
 */
export async function POST(req: NextRequest) {
  try {
    const { url, question } = await req.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      )
    }

    // Fetch the webpage content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JamesBot/1.0)',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.statusText}` },
        { status: response.status }
      )
    }

    const html = await response.text()

    // Use Claude to extract and summarize the content
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    const promptText = question
      ? `Read this webpage and answer: ${question}\n\nHTML content:\n${html.slice(0, 100000)}`
      : `Summarize this webpage in 2-3 paragraphs, focusing on the main points.\n\nHTML content:\n${html.slice(0, 100000)}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: promptText,
        },
      ],
    })

    const textContent = message.content.find(
      (block) => block.type === 'text'
    ) as Anthropic.TextBlock | undefined

    const summary = textContent?.text || 'Could not extract content from URL'

    return NextResponse.json({
      success: true,
      url,
      summary,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Web Fetch] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Fetch failed' },
      { status: 500 }
    )
  }
}
