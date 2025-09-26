import { NextRequest, NextResponse } from 'next/server';
import { UrgentTaskService } from '@/services/UrgentTaskService';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskUpdates } = body as { taskUpdates: { id: string; order_index: number }[] };

    if (!taskUpdates || !Array.isArray(taskUpdates)) {
      return NextResponse.json({ error: 'Invalid task updates' }, { status: 400 });
    }

    await UrgentTaskService.reorderUrgentTasks(taskUpdates);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering urgent tasks:', error);
    return NextResponse.json(
      { error: 'Failed to reorder urgent tasks' },
      { status: 500 }
    );
  }
}