'use client'

import { useState, useEffect } from 'react'
import { ShoppingListService } from '@/services/ShoppingListService'

interface ShoppingItem {
  id: string
  name: string
  is_completed: boolean
}

export default function ShoppingList() {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadShoppingItems() {
      try {
        const lists = await ShoppingListService.getShoppingLists()
        if (lists.length > 0) {
          const items = await ShoppingListService.getShoppingItems(lists[0].id)
          setItems(items.slice(0, 5)) // Show first 5 items
        }
      } catch (error) {
        console.error('Failed to load shopping items:', error)
      } finally {
        setLoading(false)
      }
    }

    loadShoppingItems()
  }, [])

  const toggleItem = async (id: string) => {
    const item = items.find(i => i.id === id)
    if (!item) return

    try {
      await ShoppingListService.updateShoppingItem(id, {
        is_completed: !item.is_completed
      })
      setItems(items.map(item =>
        item.id === id ? { ...item, is_completed: !item.is_completed } : item
      ))
    } catch (error) {
      console.error('Failed to toggle item:', error)
    }
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-card">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-foreground">Shopping List</h2>
          <button className="text-tertiary text-sm font-medium">View All</button>
        </div>
        <div className="p-4 text-center text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-card">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-foreground">Shopping List</h2>
        <button className="text-tertiary text-sm font-medium">View All</button>
      </div>

      <div className="p-4 space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No shopping items
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-center space-x-3">
              <button
                onClick={() => toggleItem(item.id)}
                className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${
                  item.is_completed
                    ? 'bg-tertiary border-tertiary text-white'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {item.is_completed && (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                )}
              </button>
              <span className={`flex-1 ${
                item.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'
              }`}>
                {item.name}
              </span>
            </div>
          ))
        )}

        <button className="flex items-center space-x-2 text-tertiary font-medium mt-4">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          <span>Add Item</span>
        </button>
      </div>
    </div>
  )
}