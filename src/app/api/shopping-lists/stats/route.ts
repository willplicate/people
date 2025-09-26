import { NextRequest, NextResponse } from 'next/server'
import { ShoppingListService } from '@/services/ShoppingListService'

export async function GET(request: NextRequest) {
  try {
    const stats = await ShoppingListService.getStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching shopping list stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shopping list stats' },
      { status: 500 }
    )
  }
}