import { NextRequest, NextResponse } from 'next/server';
import { UrgentTaskService, UpdateUrgentTaskData } from '@/services/UrgentTaskService';

interface Props {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updates = body as UpdateUrgentTaskData;

    const urgentTask = await UrgentTaskService.updateUrgentTask(id, updates);
    return NextResponse.json(urgentTask);
  } catch (error) {
    console.error('Error updating urgent task:', error);
    return NextResponse.json(
      { error: 'Failed to update urgent task' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    await UrgentTaskService.deleteUrgentTask(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting urgent task:', error);
    return NextResponse.json(
      { error: 'Failed to delete urgent task' },
      { status: 500 }
    );
  }
}