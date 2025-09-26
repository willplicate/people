import { NextRequest, NextResponse } from 'next/server';
import { UrgentTaskService, CreateUrgentTaskData } from '@/services/UrgentTaskService';

export async function GET() {
  try {
    const urgentTasks = await UrgentTaskService.getUrgentTasks();
    return NextResponse.json(urgentTasks);
  } catch (error) {
    console.error('Error fetching urgent tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch urgent tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, original_task_id } = body as CreateUrgentTaskData;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const urgentTask = await UrgentTaskService.createUrgentTask({
      title: title.trim(),
      description: description?.trim() || undefined,
      original_task_id,
    });

    return NextResponse.json(urgentTask, { status: 201 });
  } catch (error) {
    console.error('Error creating urgent task:', error);
    return NextResponse.json(
      { error: 'Failed to create urgent task' },
      { status: 500 }
    );
  }
}