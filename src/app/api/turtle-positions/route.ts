import { NextRequest, NextResponse } from 'next/server'
import { TurtlePositionService } from '@/services/TurtlePositionService'
import { CreateTurtlePositionInput } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status') as any
    const symbol = searchParams.get('symbol')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')
    const search = searchParams.get('search')

    let positions

    if (search) {
      positions = await TurtlePositionService.search(search)
    } else {
      const options = {
        status: status || undefined,
        symbol: symbol || undefined,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined
      }

      positions = await TurtlePositionService.getAll(options)
    }

    const totalCount = await TurtlePositionService.getCount({
      status: status || undefined,
      symbol: symbol || undefined
    })

    return NextResponse.json({
      positions,
      totalCount,
      pagination: {
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
        hasMore: positions.length === (limit ? parseInt(limit) : 50)
      }
    })
  } catch (error) {
    console.error('Error in turtle positions GET:', error)
    return NextResponse.json(
      { error: 'Failed to fetch turtle positions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const requiredFields = ['position_name', 'symbol', 'leaps_strike', 'leaps_expiry', 'leaps_cost_basis', 'contracts']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Create the position input
    const positionInput: CreateTurtlePositionInput = {
      position_name: body.position_name,
      symbol: body.symbol.toUpperCase(),
      leaps_strike: parseFloat(body.leaps_strike),
      leaps_expiry: body.leaps_expiry,
      leaps_cost_basis: parseFloat(body.leaps_cost_basis),
      current_value: body.current_value ? parseFloat(body.current_value) : undefined,
      current_delta: body.current_delta ? parseFloat(body.current_delta) : undefined,
      contracts: parseInt(body.contracts),
      status: body.status || 'active'
    }

    const position = await TurtlePositionService.create(positionInput)

    return NextResponse.json(position, { status: 201 })
  } catch (error) {
    console.error('Error in turtle positions POST:', error)
    return NextResponse.json(
      { error: 'Failed to create turtle position' },
      { status: 500 }
    )
  }
}