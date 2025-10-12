/**
 * PATCH /api/learning/topics/[topicId]
 *
 * Updates a topic (e.g., mark as completed)
 */

import { NextResponse } from 'next/server'
import { TopicService } from '@/services/LMSService'
import { UpdateTopicInput } from '@/types/lms'

interface RouteContext {
  params: Promise<{
    topicId: string
  }>
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { topicId } = await context.params
    const body = await request.json() as UpdateTopicInput

    const updatedTopic = await TopicService.update(topicId, body)

    return NextResponse.json(updatedTopic)
  } catch (error) {
    console.error('Error in PATCH /api/learning/topics/[topicId]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update topic' },
      { status: 500 }
    )
  }
}
