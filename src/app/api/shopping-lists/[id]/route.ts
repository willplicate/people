import { NextRequest, NextResponse } from 'next/server'
import { ShoppingListService } from '@/services/ShoppingListService'
import { UpdateShoppingListInput } from '@/types/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const includeItems = searchParams.get('includeItems') === 'true'

    let list

    if (includeItems) {
      list = await ShoppingListService.getWithItems(id)
    } else {
      list = await ShoppingListService.getById(id)
    }

    if (!list) {
      return NextResponse.json(
        { error: 'Shopping list not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(list)
  } catch (error) {
    console.error('Error fetching shopping list:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shopping list' },
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
    const updates: UpdateShoppingListInput = {
      name: body.name,
      description: body.description,
      status: body.status
    }

    // Remove undefined values
    Object.keys(updates).forEach(key => {
      if (updates[key as keyof UpdateShoppingListInput] === undefined) {
        delete updates[key as keyof UpdateShoppingListInput]
      }
    })

    const list = await ShoppingListService.update(id, updates)
    return NextResponse.json(list)
  } catch (error) {
    console.error('Error updating shopping list:', error)
    return NextResponse.json(
      { error: 'Failed to update shopping list' },
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
    await ShoppingListService.delete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting shopping list:', error)
    return NextResponse.json(
      { error: 'Failed to delete shopping list' },
      { status: 500 }
    )
  }
}