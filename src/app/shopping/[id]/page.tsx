'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingList, ShoppingItem } from '@/types/database'

interface ShoppingListDetailData {
  list: ShoppingList
  items: ShoppingItem[]
  stats: {
    total: number
    completed: number
    pending: number
    totalEstimatedPrice: number
    totalActualPrice: number
  }
}

export default function ShoppingListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [listId, setListId] = useState<string | null>(null)
  const [data, setData] = useState<ShoppingListDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showNewItemForm, setShowNewItemForm] = useState(false)
  const [showCompletedItems, setShowCompletedItems] = useState(true)
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    quantity: 1,
    unit: '',
    category: '',
    priority: 'medium' as const,
    estimated_price: ''
  })

  useEffect(() => {
    const initializeParams = async () => {
      const { id } = await params
      setListId(id)
    }
    initializeParams()
  }, [params])

  useEffect(() => {
    if (listId) {
      fetchListData()
    }
  }, [listId])

  const fetchListData = async () => {
    if (!listId) return

    try {
      setLoading(true)
      const [listResponse, itemsResponse] = await Promise.all([
        fetch(`/api/shopping-lists/${listId}`),
        fetch(`/api/shopping-lists/${listId}/items`)
      ])

      if (!listResponse.ok) throw new Error('Failed to fetch shopping list')
      if (!itemsResponse.ok) throw new Error('Failed to fetch shopping items')

      const list = await listResponse.json()
      const itemsData = await itemsResponse.json()

      setData({
        list,
        items: itemsData.items,
        stats: itemsData.stats
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch shopping list')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateItem = async () => {
    try {
      const response = await fetch(`/api/shopping-lists/${listId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newItem,
          estimated_price: newItem.estimated_price ? parseFloat(newItem.estimated_price) : undefined
        })
      })

      if (!response.ok) throw new Error('Failed to create item')

      setNewItem({
        name: '',
        description: '',
        quantity: 1,
        unit: '',
        category: '',
        priority: 'medium',
        estimated_price: ''
      })
      setShowNewItemForm(false)
      fetchListData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create item')
    }
  }

  const handleToggleItemCompleted = async (item: ShoppingItem) => {
    try {
      const response = await fetch(`/api/shopping-items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_completed: !item.is_completed,
          completed_at: !item.is_completed ? new Date().toISOString() : undefined
        })
      })

      if (!response.ok) throw new Error('Failed to update item')
      fetchListData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item')
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      const response = await fetch(`/api/shopping-items/${itemId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete item')
      fetchListData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item')
    }
  }

  const handleUpdateActualPrice = async (item: ShoppingItem, actualPrice: string) => {
    try {
      const response = await fetch(`/api/shopping-items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actual_price: actualPrice ? parseFloat(actualPrice) : undefined
        })
      })

      if (!response.ok) throw new Error('Failed to update price')
      fetchListData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update price')
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  const filteredItems = data?.items.filter(item =>
    showCompletedItems || !item.is_completed
  ) || []

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4">
        <div className="animate-pulse space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-destructive p-4 bg-destructive/10 rounded-lg">
          Error: {error}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-muted-foreground text-center py-8">
          Shopping list not found
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <button
            onClick={() => router.push('/shopping')}
            className="text-primary hover:text-primary/80 mb-2 text-sm"
          >
            ← Back to Shopping Lists
          </button>
          <h1 className="text-3xl font-bold text-foreground">{data.list.name}</h1>
          {data.list.description && (
            <p className="mt-2 text-muted-foreground">{data.list.description}</p>
          )}
        </div>
        <button
          onClick={() => setShowNewItemForm(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/80"
        >
          Add Item
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-card p-4 rounded-lg border border-border">
          <div className="text-2xl font-bold text-foreground">{data.stats.total}</div>
          <div className="text-sm text-muted-foreground">Total Items</div>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <div className="text-2xl font-bold text-green-600">{data.stats.completed}</div>
          <div className="text-sm text-muted-foreground">Completed</div>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <div className="text-2xl font-bold text-blue-600">{data.stats.pending}</div>
          <div className="text-sm text-muted-foreground">Pending</div>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <div className="text-lg font-bold text-foreground">{formatPrice(data.stats.totalEstimatedPrice)}</div>
          <div className="text-sm text-muted-foreground">Est. Total</div>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <div className="text-lg font-bold text-foreground">{formatPrice(data.stats.totalActualPrice)}</div>
          <div className="text-sm text-muted-foreground">Actual Total</div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-card p-4 rounded-lg border border-border mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showCompletedItems}
                onChange={(e) => setShowCompletedItems(e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <span className="text-sm text-foreground">Show completed items</span>
            </label>
          </div>
          <div className="text-sm text-muted-foreground">
            {data.stats.completed} of {data.stats.total} items completed ({Math.round((data.stats.completed / data.stats.total) * 100) || 0}%)
          </div>
        </div>
      </div>

      {/* New Item Form */}
      {showNewItemForm && (
        <div className="bg-card p-6 rounded-lg border border-border mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Add New Item</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Item Name</label>
              <input
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Item name..."
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Quantity</label>
              <input
                type="number"
                value={newItem.quantity}
                onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                min="1"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Unit</label>
              <input
                type="text"
                value={newItem.unit}
                onChange={(e) => setNewItem(prev => ({ ...prev, unit: e.target.value }))}
                placeholder="e.g., kg, pieces, liter..."
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Category</label>
              <input
                type="text"
                value={newItem.category}
                onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                placeholder="e.g., groceries, household..."
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Priority</label>
              <select
                value={newItem.priority}
                onChange={(e) => setNewItem(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Est. Price</label>
              <input
                type="number"
                step="0.01"
                value={newItem.estimated_price}
                onChange={(e) => setNewItem(prev => ({ ...prev, estimated_price: e.target.value }))}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-foreground mb-2">Description</label>
              <input
                type="text"
                value={newItem.description}
                onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Additional notes..."
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={() => setShowNewItemForm(false)}
              className="px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateItem}
              disabled={!newItem.name.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 disabled:opacity-50"
            >
              Add Item
            </button>
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {data.items.length === 0
              ? 'No items in this list yet. Add your first item!'
              : 'No items match your current filter.'}
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className={`p-4 border rounded-lg bg-card hover:shadow-md transition-shadow ${
                item.is_completed ? 'bg-green-50 border-green-200' : 'border-border'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <input
                    type="checkbox"
                    checked={item.is_completed}
                    onChange={() => handleToggleItemCompleted(item)}
                    className="mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3
                        className={`font-medium text-foreground ${
                          item.is_completed ? 'line-through text-muted-foreground' : ''
                        }`}
                      >
                        {item.name}
                      </h3>
                      <span className="text-sm text-muted-foreground">
                        {item.quantity} {item.unit && `${item.unit}`}
                      </span>
                      {item.priority !== 'medium' && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                      )}
                      {item.category && (
                        <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded">
                          {item.category}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                    )}
                    <div className="flex items-center space-x-4 mt-2">
                      {item.estimated_price && (
                        <span className="text-sm text-muted-foreground">
                          Est: {formatPrice(item.estimated_price)}
                        </span>
                      )}
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">Actual:</span>
                        <input
                          type="number"
                          step="0.01"
                          value={item.actual_price || ''}
                          onChange={(e) => handleUpdateActualPrice(item, e.target.value)}
                          placeholder="0.00"
                          className="w-20 px-2 py-1 text-sm border border-border rounded bg-background text-foreground"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}