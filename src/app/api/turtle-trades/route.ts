import { NextRequest, NextResponse } from 'next/server'
import { TurtleTradeService } from '@/services/TurtleTradeService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const positionId = searchParams.get('position_id')

    let trades
    if (positionId) {
      trades = await TurtleTradeService.getByPositionId(positionId)
    } else {
      trades = await TurtleTradeService.getAllWithPositions()
    }

    return NextResponse.json({ trades })
  } catch (error) {
    console.error('Error in turtle trades GET:', error)
    return NextResponse.json(
      { error: 'Failed to fetch turtle trades' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, position_id, strike, premium, expiry, notes } = body

    // Validate required fields
    if (!action || !position_id || !premium) {
      return NextResponse.json(
        { error: 'Missing required fields: action, position_id, premium' },
        { status: 400 }
      )
    }

    let trade
    switch (action) {
      case 'sell':
        if (!strike || !expiry) {
          return NextResponse.json(
            { error: 'Sell action requires strike and expiry' },
            { status: 400 }
          )
        }
        trade = await TurtleTradeService.sellCall(position_id, {
          strike: parseFloat(strike),
          premium: parseFloat(premium),
          expiry,
          notes
        })
        break

      case 'roll_call':
        if (!strike || !expiry) {
          return NextResponse.json(
            { error: 'Roll action requires strike and expiry' },
            { status: 400 }
          )
        }
        trade = await TurtleTradeService.rollCall(position_id, {
          strike: parseFloat(strike),
          premium: parseFloat(premium),
          expiry,
          notes
        })
        break

      case 'buy_to_close':
        if (!strike) {
          return NextResponse.json(
            { error: 'Buy to close action requires strike' },
            { status: 400 }
          )
        }
        trade = await TurtleTradeService.buyToClose(position_id, {
          strike: parseFloat(strike),
          premium: parseFloat(premium),
          notes
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be sell, roll_call, or buy_to_close' },
          { status: 400 }
        )
    }

    return NextResponse.json(trade, { status: 201 })
  } catch (error) {
    console.error('Error in turtle trades POST:', error)
    return NextResponse.json(
      { error: 'Failed to create turtle trade' },
      { status: 500 }
    )
  }
}