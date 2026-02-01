import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

const EXTRACTION_PROMPT = (todayDate: string) => `TODAY'S DATE: ${todayDate}

Extract options trade data from this Tasty Trade screenshot.

READ THE TABLE - Look for rows with these columns:
- Quantity (1, -1, etc.) - First number in each row
- Expiration date (e.g., "Jan 9")
- Days to expiry (e.g., "41d")
- Strike price (e.g., 609, 612, 623, 624)
- Option type: "P" = PUT, "C" = CALL
- Delta (e.g., -0.39, 0.42)
- Cost (rightmost column - the premium paid/received)

RULES:
- Positive quantity (1) = BUY
- Negative quantity (-1) = SELL
- Negative Cost = money paid (bought)
- Positive Cost = money received (sold)

For rows with the SAME ticker and SAME expiration, extract ALL legs:

{
  "ticker": "QQQ",
  "strategy": "PUT_CONDOR",
  "expirationDate": "2025-01-09",
  "legs": [
    {"strikePrice": 609, "action": "BUY", "numberOfContracts": 1, "optionType": "PUT", "delta": -0.39, "cost": -1244.00},
    {"strikePrice": 612, "action": "SELL", "numberOfContracts": 1, "optionType": "PUT", "delta": 0.42, "cost": 1345.00},
    {"strikePrice": 623, "action": "SELL", "numberOfContracts": 1, "optionType": "PUT", "delta": 0.53, "cost": 1797.00},
    {"strikePrice": 624, "action": "BUY", "numberOfContracts": 1, "optionType": "PUT", "delta": -0.54, "cost": -1847.00}
  ],
  "netCredit": 51.00
}

Return ONLY the JSON. NO markdown. NO code blocks. Just the raw JSON object.

IMPORTANT: Use today's date (${todayDate}) to calculate the correct YEAR for the expiration date. If the expiration says "Jan 9" and days to expiry is 41d, add 41 days to today's date to get the correct year.`

export async function POST(req: NextRequest) {
  try {
    console.log('🔵 Extract screenshot API called')
    const body = await req.json()
    const { image, sessionId } = body

    console.log('🔵 Request body received, sessionId:', sessionId)
    console.log('🔵 Image data type:', typeof image)
    console.log('🔵 Image data length:', image?.length)
    console.log('🔵 Image data preview (first 100 chars):', image?.substring(0, 100))

    if (!image) {
      console.log('❌ No image data provided')
      return NextResponse.json(
        { error: 'image data is required' },
        { status: 400 }
      )
    }

    // Extract base64 image data (remove data:image/... prefix if present)
    const base64Image = image.includes(',') ? image.split(',')[1] : image

    console.log('🔵 Base64 image extracted')
    console.log('🔵 Base64 length:', base64Image.length)
    console.log('🔵 Base64 preview (first 100 chars):', base64Image.substring(0, 100))

    // Determine media type from prefix or default to PNG
    let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/png'
    if (image.includes('data:image/')) {
      const typeMatch = image.match(/data:image\/(jpeg|png|gif|webp)/)
      if (typeMatch) {
        mediaType = `image/${typeMatch[1]}` as typeof mediaType
      }
    }
    console.log('🔵 Detected media type:', mediaType)

    // Get today's date for context
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0] // YYYY-MM-DD format
    console.log('🔵 Today\'s date:', todayStr)

    // Call Claude Vision API
    console.log('🔵 Calling Claude Vision API...')
    console.log('🔵 API request payload:', {
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      imageSource: { type: 'base64', media_type: mediaType, dataLength: base64Image.length }
    })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: EXTRACTION_PROMPT(todayStr),
            },
          ],
        },
      ],
    })

    console.log('🔵 Claude Vision API responded')
    console.log('🔵 Response content type:', response.content[0].type)

    const assistantMessage = response.content[0].type === 'text'
      ? response.content[0].text
      : ''

    console.log('🔵 Claude Vision raw response:', assistantMessage)

    // Parse the JSON response
    let tradeData
    try {
      // Extract JSON from the response (might have markdown code blocks)
      const jsonMatch = assistantMessage.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        console.log('Extracted JSON string:', jsonMatch[0])
        tradeData = JSON.parse(jsonMatch[0])
        console.log('Parsed trade data:', tradeData)
      } else {
        console.error('No JSON found in Claude response:', assistantMessage)
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('Failed to parse trade data:', assistantMessage)
      console.error('Parse error:', parseError)
      return NextResponse.json(
        { error: 'Failed to extract trade data from screenshot', rawResponse: assistantMessage },
        { status: 422 }
      )
    }

    return NextResponse.json({
      tradeData,
      confidence: 'high' // Could be enhanced with confidence scoring
    })

  } catch (error) {
    console.error('Screenshot extraction error:', error)
    return NextResponse.json(
      { error: 'Failed to extract screenshot data' },
      { status: 500 }
    )
  }
}
