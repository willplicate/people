import { NextRequest, NextResponse } from 'next/server';
import { UrgentTaskService } from '@/services/UrgentTaskService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, title, description } = body;

    if (!taskId || !title) {
      return NextResponse.json({ error: 'Task ID and title are required' }, { status: 400 });
    }

    const urgentTask = await UrgentTaskService.moveTaskToUrgent(
      taskId,
      title,
      description
    );

    return NextResponse.json(urgentTask, { status: 201 });
  } catch (error) {
    console.error('Error moving task to urgent:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to move task to urgent' },
      { status: 500 }
    );
  }
}