import { NextRequest, NextResponse } from 'next/server'
import { PersonalTaskService } from '@/services/PersonalTaskService'
import { CreatePersonalTaskInput } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status') as any
    const priority = searchParams.get('priority') as any
    const category = searchParams.get('category')
    const dueDateFrom = searchParams.get('dueDateFrom')
    const dueDateTo = searchParams.get('dueDateTo')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')
    const search = searchParams.get('search')

    let tasks

    if (search) {
      tasks = await PersonalTaskService.search(search)
    } else {
      const options = {
        status: status || undefined,
        priority: priority || undefined,
        category: category || undefined,
        dueDateFrom: dueDateFrom ? new Date(dueDateFrom) : undefined,
        dueDateTo: dueDateTo ? new Date(dueDateTo) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined
      }

      tasks = await PersonalTaskService.getAll(options)
    }

    const totalCount = await PersonalTaskService.getCount({
      status: status || undefined,
      priority: priority || undefined
    })

    return NextResponse.json({
      tasks,
      totalCount,
      pagination: {
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
        hasMore: tasks.length === (limit ? parseInt(limit) : 50)
      }
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const taskData: CreatePersonalTaskInput = {
      title: body.title,
      description: body.description,
      priority: body.priority || 'medium',
      status: body.status || 'todo',
      due_date: body.due_date,
      category: body.category,
      tags: body.tags
    }

    const task = await PersonalTaskService.create(taskData)
    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}