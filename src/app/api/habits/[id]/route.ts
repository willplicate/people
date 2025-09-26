import { NextRequest, NextResponse } from 'next/server'
import { HabitService } from '@/services/HabitService'
import { UpdateHabitInput } from '@/types/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const habit = await HabitService.getById(id)

    if (!habit) {
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(habit)
  } catch (error) {
    console.error('Error fetching habit:', error)
    return NextResponse.json(
      { error: 'Failed to fetch habit' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Validate frequency_type if provided
    if (body.frequency_type) {
      const validFrequencyTypes = ['daily', 'weekly', 'monthly', 'specific_days']
      if (!validFrequencyTypes.includes(body.frequency_type)) {
        return NextResponse.json(
          { error: 'Invalid frequency_type' },
          { status: 400 }
        )
      }

      // Validate frequency_days if frequency_type is specific_days
      if (body.frequency_type === 'specific_days') {
        if (!Array.isArray(body.frequency_days) || body.frequency_days.length === 0) {
          return NextResponse.json(
            { error: 'frequency_days is required for specific_days frequency_type' },
            { status: 400 }
          )
        }

        // Validate day numbers are 0-6
        if (!body.frequency_days.every((day: any) =>
          typeof day === 'number' && day >= 0 && day <= 6
        )) {
          return NextResponse.json(
            { error: 'frequency_days must contain day numbers 0-6 (0=Sunday, 6=Saturday)' },
            { status: 400 }
          )
        }
      }
    }

    const updateInput: UpdateHabitInput = {
      name: body.name,
      description: body.description,
      frequency_type: body.frequency_type,
      frequency_days: body.frequency_days,
      is_active: body.is_active,
    }

    // Remove undefined values
    Object.keys(updateInput).forEach(key => {
      if (updateInput[key as keyof UpdateHabitInput] === undefined) {
        delete updateInput[key as keyof UpdateHabitInput]
      }
    })

    const habit = await HabitService.update(id, updateInput)

    return NextResponse.json(habit)
  } catch (error) {
    console.error('Error updating habit:', error)
    return NextResponse.json(
      { error: 'Failed to update habit' },
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
    await HabitService.delete(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting habit:', error)
    return NextResponse.json(
      { error: 'Failed to delete habit' },
      { status: 500 }
    )
  }
}