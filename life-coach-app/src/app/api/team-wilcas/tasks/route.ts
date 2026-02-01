import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * GET /api/team-wilcas/tasks
 * Get all tasks, optionally filtered by completion status
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const completed = searchParams.get('completed')

    let query = supabase
      .from('team_wilcas_tasks')
      .select('*')
      .order('created_at', { ascending: false })

    // Filter by completion status if provided
    if (completed !== null) {
      query = query.eq('completed', completed === 'true')
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      tasks: data || []
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * POST /api/team-wilcas/tasks
 * Create a new task
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, description, assigned_to } = body

    if (!title || !assigned_to) {
      return NextResponse.json(
        { error: 'title and assigned_to are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('team_wilcas_tasks')
      .insert({
        title,
        description: description || null,
        assigned_to,
        completed: false
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      task: data
    })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/team-wilcas/tasks
 * Update a task (toggle completion, change assignee, etc.)
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { taskId, completed, assigned_to, title, description } = body

    if (!taskId) {
      return NextResponse.json(
        { error: 'taskId is required' },
        { status: 400 }
      )
    }

    const updates: any = {}
    if (completed !== undefined) {
      updates.completed = completed
      updates.completed_at = completed ? new Date().toISOString() : null
    }
    if (assigned_to !== undefined) updates.assigned_to = assigned_to
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description

    const { data, error } = await supabase
      .from('team_wilcas_tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      task: data
    })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Failed to update task', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/team-wilcas/tasks
 * Delete a task
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json(
        { error: 'taskId is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('team_wilcas_tasks')
      .delete()
      .eq('id', taskId)

    if (error) throw error

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Failed to delete task', details: String(error) },
      { status: 500 }
    )
  }
}
