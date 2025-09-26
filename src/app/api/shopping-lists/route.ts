import { NextRequest, NextResponse } from 'next/server'
import { ShoppingListService } from '@/services/ShoppingListService'
import { CreateShoppingListInput } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status') as any
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    const options = {
      status: status || undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    }

    const lists = await ShoppingListService.getAll(options)
    const totalCount = await ShoppingListService.getCount({
      status: status || undefined
    })

    return NextResponse.json({
      lists,
      totalCount,
      pagination: {
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
        hasMore: lists.length === (limit ? parseInt(limit) : 50)
      }
    })
  } catch (error) {
    console.error('Error fetching shopping lists:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shopping lists' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const listData: CreateShoppingListInput = {
      name: body.name,
      description: body.description,
      status: body.status || 'active'
    }

    const list = await ShoppingListService.create(listData)
    return NextResponse.json(list, { status: 201 })
  } catch (error) {
    console.error('Error creating shopping list:', error)
    return NextResponse.json(
      { error: 'Failed to create shopping list' },
      { status: 500 }
    )
  }
}