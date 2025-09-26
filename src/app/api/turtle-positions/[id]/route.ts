import { NextRequest, NextResponse } from 'next/server'
import { TurtlePositionService } from '@/services/TurtlePositionService'
import { UpdateTurtlePositionInput } from '@/types/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const position = await TurtlePositionService.getById(id)

    if (!position) {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(position)
  } catch (error) {
    console.error('Error in turtle position GET:', error)
    return NextResponse.json(
      { error: 'Failed to fetch turtle position' },
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

    // Create the position update input
    const updateInput: UpdateTurtlePositionInput = {
      position_name: body.position_name,
      symbol: body.symbol?.toUpperCase(),
      leaps_strike: body.leaps_strike ? parseFloat(body.leaps_strike) : undefined,
      leaps_expiry: body.leaps_expiry,
      leaps_cost_basis: body.leaps_cost_basis ? parseFloat(body.leaps_cost_basis) : undefined,
      current_value: body.current_value ? parseFloat(body.current_value) : undefined,
      current_delta: body.current_delta ? parseFloat(body.current_delta) : undefined,
      contracts: body.contracts ? parseInt(body.contracts) : undefined,
      status: body.status
    }

    const position = await TurtlePositionService.update(id, updateInput)

    return NextResponse.json(position)
  } catch (error) {
    console.error('Error in turtle position PUT:', error)
    return NextResponse.json(
      { error: 'Failed to update turtle position' },
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
    await TurtlePositionService.delete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in turtle position DELETE:', error)
    return NextResponse.json(
      { error: 'Failed to delete turtle position' },
      { status: 500 }
    )
  }
}