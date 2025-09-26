import { NextRequest, NextResponse } from 'next/server'
import { PersonalTaskService } from '@/services/PersonalTaskService'
import { UpdatePersonalTaskInput } from '@/types/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const task = await PersonalTaskService.getById(id)

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const updates: UpdatePersonalTaskInput = {
      title: body.title,
      description: body.description,
      priority: body.priority,
      status: body.status,
      due_date: body.due_date,
      category: body.category,
      tags: body.tags,
      completed_at: body.completed_at
    }

    // Remove undefined values
    Object.keys(updates).forEach(key => {
      if (updates[key as keyof UpdatePersonalTaskInput] === undefined) {
        delete updates[key as keyof UpdatePersonalTaskInput]
      }
    })

    const { id } = await params
    const task = await PersonalTaskService.update(id, updates)
    return NextResponse.json(task)
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await PersonalTaskService.delete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}