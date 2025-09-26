import { NextRequest, NextResponse } from 'next/server'
import { ShoppingItemService } from '@/services/ShoppingListService'
import { CreateShoppingItemInput } from '@/types/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)

    const completed = searchParams.get('completed')
    const priority = searchParams.get('priority') as any
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    let items

    if (search) {
      items = await ShoppingItemService.search(id, search)
    } else {
      const options = {
        completed: completed !== null ? completed === 'true' : undefined,
        priority: priority || undefined,
        category: category || undefined
      }

      items = await ShoppingItemService.getByListId(id, options)
    }

    const totalCount = await ShoppingItemService.getCount(id)
    const stats = await ShoppingItemService.getStatsForList(id)

    return NextResponse.json({
      items,
      totalCount,
      stats
    })
  } catch (error) {
    console.error('Error fetching shopping items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shopping items' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Handle both single item and batch creation
    if (Array.isArray(body)) {
      // Batch creation
      const itemsData: CreateShoppingItemInput[] = body.map(item => ({
        shopping_list_id: id,
        name: item.name,
        description: item.description,
        quantity: item.quantity || 1,
        unit: item.unit,
        category: item.category,
        priority: item.priority || 'medium',
        estimated_price: item.estimated_price,
        notes: item.notes,
        is_completed: item.is_completed || false
      }))

      const items = await ShoppingItemService.createMultiple(itemsData)
      return NextResponse.json(items, { status: 201 })
    } else {
      // Single item creation
      const itemData: CreateShoppingItemInput = {
        shopping_list_id: id,
        name: body.name,
        description: body.description,
        quantity: body.quantity || 1,
        unit: body.unit,
        category: body.category,
        priority: body.priority || 'medium',
        estimated_price: body.estimated_price,
        notes: body.notes,
        is_completed: body.is_completed || false
      }

      const item = await ShoppingItemService.create(itemData)
      return NextResponse.json(item, { status: 201 })
    }
  } catch (error) {
    console.error('Error creating shopping item(s):', error)
    return NextResponse.json(
      { error: 'Failed to create shopping item(s)' },
      { status: 500 }
    )
  }
}