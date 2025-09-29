'use client'

import { useState } from 'react'

export default function ShoppingList() {
  const [items, setItems] = useState([
    { id: 1, text: "Milk", completed: false },
    { id: 2, text: "Bread", completed: false },
    { id: 3, text: "Eggs", completed: true }
  ])

  const toggleItem = (id: number) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ))
  }

  return (
    <div className="bg-white border border-gray-200 rounded-card">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-foreground">Shopping List</h2>
        <button className="text-tertiary text-sm font-medium">View All</button>
      </div>

      <div className="p-4 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center space-x-3">
            <button
              onClick={() => toggleItem(item.id)}
              className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${
                item.completed
                  ? 'bg-tertiary border-tertiary text-white'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {item.completed && (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              )}
            </button>
            <span className={`flex-1 ${
              item.completed ? 'line-through text-muted-foreground' : 'text-foreground'
            }`}>
              {item.text}
            </span>
          </div>
        ))}

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