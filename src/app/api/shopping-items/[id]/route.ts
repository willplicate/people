import { NextRequest, NextResponse } from 'next/server'
import { ShoppingItemService } from '@/services/ShoppingListService'
import { UpdateShoppingItemInput } from '@/types/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const item = await ShoppingItemService.getById(id)

    if (!item) {
      return NextResponse.json(
        { error: 'Shopping item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error fetching shopping item:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shopping item' },
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
    const updates: UpdateShoppingItemInput = {
      name: body.name,
      description: body.description,
      quantity: body.quantity,
      unit: body.unit,
      category: body.category,
      priority: body.priority,
      estimated_price: body.estimated_price,
      actual_price: body.actual_price,
      notes: body.notes,
      is_completed: body.is_completed,
      completed_at: body.completed_at
    }

    // Remove undefined values
    Object.keys(updates).forEach(key => {
      if (updates[key as keyof UpdateShoppingItemInput] === undefined) {
        delete updates[key as keyof UpdateShoppingItemInput]
      }
    })

    const item = await ShoppingItemService.update(id, updates)
    return NextResponse.json(item)
  } catch (error) {
    console.error('Error updating shopping item:', error)
    return NextResponse.json(
      { error: 'Failed to update shopping item' },
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
    await ShoppingItemService.delete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting shopping item:', error)
    return NextResponse.json(
      { error: 'Failed to delete shopping item' },
      { status: 500 }
    )
  }
}