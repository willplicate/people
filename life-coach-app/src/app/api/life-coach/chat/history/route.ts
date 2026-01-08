import { NextRequest, NextResponse } from 'next/server'
import { LifeCoachService } from '@/services/LifeCoachService'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const date = searchParams.get('date')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      )
    }

    // Use today if no date provided
    const messageDate = date || new Date().toISOString().split('T')[0]

    // Get chat messages for the specified date
    const messages = await LifeCoachService.getChatMessagesByDate(userId, messageDate)

    return NextResponse.json({
      messages
    })

  } catch (error) {
    console.error('Get chat history error:', error)
    return NextResponse.json(
      { error: 'Failed to get chat history' },
      { status: 500 }
    )
  }
}
