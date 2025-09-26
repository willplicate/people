import { NextRequest, NextResponse } from 'next/server'
import { HabitService } from '@/services/HabitService'
import { CreateHabitInput } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const options = {
      isActive: searchParams.get('isActive') === 'true' ? true :
                searchParams.get('isActive') === 'false' ? false : undefined,
      frequencyType: searchParams.get('frequencyType') as any || undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'name',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc',
    }

    // Check if we want today's habits with status
    const todaysHabits = searchParams.get('today') === 'true'

    if (todaysHabits) {
      const habits = await HabitService.getTodaysHabitsWithStatus()
      return NextResponse.json({ habits })
    }

    const habits = await HabitService.getAll(options)

    return NextResponse.json({ habits })
  } catch (error) {
    console.error('Error fetching habits:', error)
    return NextResponse.json(
      { error: 'Failed to fetch habits' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      )
    }

    if (!body.frequency_type) {
      return NextResponse.json(
        { error: 'frequency_type is required' },
        { status: 400 }
      )
    }

    // Validate frequency_type
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

    const habitInput: CreateHabitInput = {
      name: body.name,
      description: body.description || null,
      frequency_type: body.frequency_type,
      frequency_days: body.frequency_days || null,
      is_active: body.is_active !== undefined ? body.is_active : true,
    }

    const habit = await HabitService.create(habitInput)

    return NextResponse.json(habit, { status: 201 })
  } catch (error) {
    console.error('Error creating habit:', error)
    return NextResponse.json(
      { error: 'Failed to create habit' },
      { status: 500 }
    )
  }
}