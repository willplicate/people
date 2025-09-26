import { NextResponse } from 'next/server'
import { PersonalTaskService } from '@/services/PersonalTaskService'

export async function POST() {
  try {
    const result = await PersonalTaskService.cleanupOldCompletedTasks()

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Cleaned up ${result.deletedCount} old completed tasks`
    })
  } catch (error) {
    console.error('Error cleaning up tasks:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup tasks' },
      { status: 500 }
    )
  }
}