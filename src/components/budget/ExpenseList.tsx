'use client'

import { useState } from 'react'
import { ExpenseWithDetails, SplitType } from '@/types/database'

interface ExpenseListProps {
  expenses: ExpenseWithDetails[]
  currentUserId: string
  onEdit: (expense: ExpenseWithDetails) => void
  onDelete: (expenseId: string) => void
  isFinalized?: boolean
}

export default function ExpenseList({
  expenses,
  currentUserId,
  onEdit,
  onDelete,
  isFinalized = false
}: ExpenseListProps) {
  const [filter, setFilter] = useState<'all' | 'individual' | 'shared'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Get unique categories from expenses
  const categories = Array.from(
    new Set(expenses.map(e => JSON.stringify({ id: e.category_id, name: e.category.name })))
  ).map(str => JSON.parse(str))

  // Filter expenses
  const filteredExpenses = expenses.filter(expense => {
    // Filter by split type
    if (filter === 'individual' && expense.split_type !== 'individual') return false
    if (filter === 'shared' && expense.split_type === 'individual') return false

    // Filter by category
    if (categoryFilter !== 'all' && expense.category_id !== categoryFilter) return false

    return true
  })

  const getSplitBadge = (expense: ExpenseWithDetails) => {
    if (expense.split_type === 'individual') {
      return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">Individual</span>
    } else if (expense.split_type === 'shared_50_50') {
      return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">Shared 50/50</span>
    } else if (expense.split_type === 'custom') {
      return (
        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
          Custom {expense.split_percentage}%
        </span>
      )
    }
  }

  const getPaidByText = (expense: ExpenseWithDetails) => {
    return expense.paid_by_user_id === currentUserId ? 'You' : 'Partner'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header with Filters */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-lg font-semibold">
            Expenses ({filteredExpenses.length})
          </h3>

          <div className="flex flex-wrap gap-2">
            {/* Split Type Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'individual' | 'shared')}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="individual">Individual Only</option>
              <option value="shared">Shared Only</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Total */}
        <div className="mt-3 text-sm text-gray-600">
          Total: <span className="font-semibold text-gray-900">€{totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Expense List */}
      <div className="divide-y divide-gray-200">
        {filteredExpenses.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No expenses found</p>
            <p className="text-sm mt-1">Add your first expense to get started!</p>
          </div>
        ) : (
          filteredExpenses.map(expense => (
            <div
              key={expense.id}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left: Category & Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg" title={expense.category.name}>
                      {expense.category.icon}
                    </span>
                    <span
                      className="inline-block w-3 h-3 rounded-full"
                      style={{ backgroundColor: expense.category.color }}
                      title={expense.category.name}
                    />
                    <span className="font-medium text-gray-900">
                      {expense.category.name}
                    </span>
                  </div>

                  {expense.description && (
                    <p className="text-sm text-gray-600 mb-2">{expense.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span>{formatDate(expense.expense_date)}</span>
                    <span>•</span>
                    <span>Paid by: {getPaidByText(expense)}</span>
                    <span>•</span>
                    {getSplitBadge(expense)}
                  </div>
                </div>

                {/* Right: Amount & Actions */}
                <div className="flex items-start gap-3">
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">
                      €{expense.amount.toFixed(2)}
                    </div>
                    {expense.split_type !== 'individual' && (
                      <div className="text-xs text-gray-500">
                        {expense.split_type === 'shared_50_50' && `$€{(expense.amount / 2).toFixed(2)} each`}
                        {expense.split_type === 'custom' && expense.split_percentage && (
                          `You: $€{((expense.amount * expense.split_percentage) / 100).toFixed(2)}`
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {!isFinalized && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => onEdit(expense)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit expense"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this expense?')) {
                            onDelete(expense.id)
                          }
                        }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        title="Delete expense"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
