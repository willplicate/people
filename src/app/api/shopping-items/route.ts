import { NextRequest, NextResponse } from 'next/server'
import { ShoppingListService } from '@/services/ShoppingListService'
import { CreateShoppingItemInput } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    // Get items from the default shopping list or create one if it doesn't exist
    let defaultList = await ShoppingListService.getDefaultList()

    if (!defaultList) {
      defaultList = await ShoppingListService.create({
        name: 'Shopping List',
        description: 'Default shopping list for food items',
        status: 'active'
      })
    }

    const items = await ShoppingListService.getItems(defaultList.id)

    return NextResponse.json({
      items,
      totalCount: items.length
    })
  } catch (error) {
    console.error('Error fetching shopping items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shopping items' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Get or create default shopping list
    let defaultList = await ShoppingListService.getDefaultList()

    if (!defaultList) {
      defaultList = await ShoppingListService.create({
        name: 'Shopping List',
        description: 'Default shopping list for food items',
        status: 'active'
      })
    }

    const itemData: CreateShoppingItemInput = {
      shopping_list_id: defaultList.id,
      name: body.name,
      description: body.description,
      quantity: body.quantity || 1,
      unit: body.unit,
      category: body.category,
      priority: body.priority || 'medium',
      is_completed: body.is_completed || false,
      estimated_price: body.estimated_price,
      actual_price: body.actual_price,
      notes: body.notes
    }

    const item = await ShoppingListService.addItem(itemData)
    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Error creating shopping item:', error)
    return NextResponse.json(
      { error: 'Failed to create shopping item' },
      { status: 500 }
    )
  }
}