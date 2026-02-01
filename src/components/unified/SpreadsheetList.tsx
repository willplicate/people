'use client'

import { useState, useEffect } from 'react'
import { SpreadsheetItem } from '@/types/unified'
import StatusPill from './StatusPill'
import EmptyState from './EmptyState'
import { StarIcon as StarOutline } from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'
import { EllipsisVerticalIcon, TrashIcon } from '@heroicons/react/24/outline'

interface SpreadsheetListProps {
  items: SpreadsheetItem[]
  onRowClick?: (item: SpreadsheetItem) => void
  onFavoriteToggle?: (item: SpreadsheetItem) => void
  onBulkComplete?: (items: SpreadsheetItem[]) => void
  onBulkDelete?: (items: SpreadsheetItem[]) => void
  onDelete?: (item: SpreadsheetItem) => void
  onActionClick?: (item: SpreadsheetItem, action: string) => void
  actions?: Array<{ label: string; value: string }>
  showCheckbox?: boolean
  showDelete?: boolean
  loading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: React.ReactNode
}

export default function SpreadsheetList({
  items,
  onRowClick,
  onFavoriteToggle,
  onBulkComplete,
  onBulkDelete,
  onDelete,
  onActionClick,
  actions,
  showCheckbox = false,
  showDelete = false,
  loading = false,
  emptyTitle = 'No items',
  emptyDescription = 'Get started by adding your first item.',
  emptyIcon,
}: SpreadsheetListProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuId) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [openMenuId])

  // Selection handlers
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(items.map(item => item.id)))
    }
  }

  const handleBulkComplete = () => {
    const selectedItems = items.filter(item => selectedIds.has(item.id))
    onBulkComplete?.(selectedItems)
    setSelectedIds(new Set())
  }

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedIds.size} selected tasks?`)) {
      const selectedItems = items.filter(item => selectedIds.has(item.id))
      onBulkDelete?.(selectedItems)
      setSelectedIds(new Set())
    }
  }

  const selectedCount = selectedIds.size
  const allSelected = items.length > 0 && selectedIds.size === items.length

  // Calculate grid columns based on enabled features
  let gridCols = 'grid-cols-[40px_1fr_auto_1fr_40px]' // Default: star, name, status, activity, actions
  if (showCheckbox && showDelete) {
    gridCols = 'grid-cols-[40px_40px_1fr_auto_1fr_40px_40px]'
  } else if (showCheckbox) {
    gridCols = 'grid-cols-[40px_40px_1fr_auto_1fr_40px]'
  } else if (showDelete) {
    gridCols = 'grid-cols-[40px_1fr_auto_1fr_40px_40px]'
  }

  if (loading) {
    return (
      <div className="h-full overflow-y-auto bg-white">
        <div className="animate-pulse space-y-1 p-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-100" />
          ))}
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          icon={emptyIcon}
        />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Bulk Action Bar */}
      {showCheckbox && selectedCount > 0 && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 flex items-center justify-between flex-shrink-0">
          <span className="text-sm font-medium text-blue-900">
            {selectedCount} selected
          </span>
          <div className="flex gap-2">
            {onBulkComplete && (
              <button
                onClick={handleBulkComplete}
                className="px-3 py-1 text-sm bg-tertiary text-white rounded hover:bg-tertiary/90"
              >
                Mark Complete
              </button>
            )}
            {onBulkDelete && (
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete Selected
              </button>
            )}
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`grid ${gridCols} gap-4 px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-700 flex-shrink-0`}>
        {showCheckbox && (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleSelectAll}
              className="h-5 w-5 rounded border-gray-300 text-tertiary focus:ring-tertiary cursor-pointer"
            />
          </div>
        )}
        <div></div>
        <div>Name</div>
        <div>Status</div>
        <div>Activity</div>
        {showDelete && <div></div>}
        <div></div>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {items.map((item) => (
          <div
            key={item.id}
            className={`grid ${gridCols} gap-4 px-4 py-2 hover:bg-gray-50 transition-colors ${selectedIds.has(item.id) ? 'bg-blue-50' : ''} ${showCheckbox && selectedCount > 0 ? '' : 'cursor-pointer'}`}
            onClick={() => {
              // Don't navigate if there are selected items (bulk action mode)
              if (showCheckbox && selectedCount > 0) return
              onRowClick?.(item)
            }}
          >
            {/* Checkbox */}
            {showCheckbox && (
              <div
                className="flex items-center"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleSelection(item.id)
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(item.id)}
                  onChange={() => {}}
                  className="h-5 w-5 rounded border-gray-300 text-tertiary focus:ring-tertiary cursor-pointer"
                />
              </div>
            )}

            {/* Favorite Star */}
            <div
              className="flex items-center"
              onClick={(e) => {
                e.stopPropagation()
                onFavoriteToggle?.(item)
              }}
            >
              {item.isFavorite ? (
                <StarSolid className="h-5 w-5 text-yellow-400 hover:text-yellow-500 cursor-pointer" />
              ) : (
                <StarOutline className="h-5 w-5 text-gray-300 hover:text-gray-400 cursor-pointer" />
              )}
            </div>

            {/* Name with Type Indicator */}
            <div className="flex items-center text-sm font-medium text-gray-900 truncate gap-2">
              {item.type && (
                <span className={`
                  inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium
                  ${item.type === 'task' ? 'bg-green-100 text-green-800' : ''}
                  ${item.type === 'birthday' ? 'bg-purple-100 text-purple-800' : ''}
                  ${item.type === 'contact' ? 'bg-blue-100 text-blue-800' : ''}
                  ${item.type === 'reminder' ? 'bg-yellow-100 text-yellow-800' : ''}
                `}>
                  {item.type === 'task' && 'Task'}
                  {item.type === 'birthday' && '🎂'}
                  {item.type === 'contact' && '👤'}
                  {item.type === 'reminder' && '🔔'}
                </span>
              )}
              <span className="truncate">{item.name}</span>
            </div>

            {/* Status */}
            <div className="flex items-center">
              {item.status && (
                <StatusPill label={item.status.label} color={item.status.color} />
              )}
            </div>

            {/* Activity */}
            <div className="flex items-center text-sm text-gray-500 truncate">
              {item.activity || '—'}
            </div>

            {/* Delete Button */}
            {showDelete && (
              <div
                className="flex items-center"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete?.(item)
                  }}
                  className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                  aria-label="Delete"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Actions */}
            <div
              className="flex items-center"
              onClick={(e) => e.stopPropagation()}
            >
              {actions && actions.length > 0 && (
                <div className="relative">
                  <button
                    className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
                    aria-label="Actions"
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenMenuId(openMenuId === item.id ? null : item.id)
                    }}
                  >
                    <EllipsisVerticalIcon className="h-5 w-5" />
                  </button>
                  {openMenuId === item.id && (
                    <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                      {actions.map((action) => (
                        <button
                          key={action.value}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-md last:rounded-b-md"
                          onClick={(e) => {
                            e.stopPropagation()
                            onActionClick?.(item, action.value)
                            setOpenMenuId(null)
                          }}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
