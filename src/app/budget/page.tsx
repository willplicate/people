'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  Expense,
  ExpenseCategory,
  BudgetMonth,
  ExpenseWithDetails,
  CategoryTotal,
  MonthlyBalance
} from '@/types/database'
import { ExpenseService } from '@/services/ExpenseService'
import ExpenseForm from '@/components/budget/ExpenseForm'
import ExpenseList from '@/components/budget/ExpenseList'
import ExpensePieChart from '@/components/budget/ExpensePieChart'
import CategoryTotals from '@/components/budget/CategoryTotals'
import BalanceSummary from '@/components/budget/BalanceSummary'
import MonthSelector from '@/components/budget/MonthSelector'

export default function BudgetPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // User IDs - get from Supabase auth
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [partnerUserId, setPartnerUserId] = useState<string | null>(null)

  // Data state
  const [months, setMonths] = useState<BudgetMonth[]>([])
  const [selectedMonth, setSelectedMonth] = useState<BudgetMonth | null>(null)
  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([])
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([])
  const [balance, setBalance] = useState<MonthlyBalance | null>(null)

  // UI state
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)

  useEffect(() => {
    // Get current user from Supabase auth
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        // TODO: Get partner ID from user metadata or settings
        // For now, leaving as null - you'll need to configure this
        // Option 1: Store in user metadata: user.user_metadata.partner_id
        // Option 2: Create a user_settings table with partner_id field
      }
    }
    getCurrentUser()
    initialize()
  }, [])

  useEffect(() => {
    if (selectedMonth && currentUserId) {
      loadMonthData()
    }
  }, [selectedMonth, currentUserId])

  const initialize = async () => {
    setLoading(true)
    setError(null)

    try {
      // Load all months and categories
      const [monthsData, categoriesData] = await Promise.all([
        ExpenseService.getAllMonths(),
        ExpenseService.getAllCategories()
      ])

      setMonths(monthsData)
      setCategories(categoriesData)

      // Get or create current month
      const currentMonth = await ExpenseService.getOrCreateCurrentMonth()

      // If current month not in list, add it
      if (!monthsData.find(m => m.id === currentMonth.id)) {
        setMonths([currentMonth, ...monthsData])
      }

      setSelectedMonth(currentMonth)
    } catch (err) {
      console.error('Error initializing budget page:', err)
      setError(err instanceof Error ? err.message : 'Failed to load budget data')
    } finally {
      setLoading(false)
    }
  }

  const loadMonthData = async () => {
    if (!selectedMonth || !currentUserId) return

    try {
      // Load expenses for the selected month
      const expensesData = await ExpenseService.getExpensesWithDetails({
        month_id: selectedMonth.id
      })
      setExpenses(expensesData)

      // Calculate category totals
      const totals = await ExpenseService.getCategoryTotals(selectedMonth.id)
      setCategoryTotals(totals)

      // Calculate balance (only if partner is configured)
      if (partnerUserId) {
        const balanceData = await ExpenseService.calculateMonthlyBalance(
          selectedMonth.id,
          currentUserId,
          partnerUserId
        )
        setBalance(balanceData)
      } else {
        setBalance(null)
      }
    } catch (err) {
      console.error('Error loading month data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load month data')
    }
  }

  const handleSaveExpense = async (expense: Expense) => {
    setShowExpenseForm(false)
    setEditingExpense(null)
    await loadMonthData()
  }

  const handleEditExpense = (expense: ExpenseWithDetails) => {
    if (selectedMonth?.is_finalized) {
      alert('Cannot edit expenses in a finalized month')
      return
    }
    setEditingExpense(expense)
    setShowExpenseForm(true)
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (selectedMonth?.is_finalized) {
      alert('Cannot delete expenses in a finalized month')
      return
    }

    try {
      await ExpenseService.deleteExpense(expenseId)
      await loadMonthData()
    } catch (err) {
      console.error('Error deleting expense:', err)
      alert('Failed to delete expense')
    }
  }

  const handleFinalizeMonth = async (monthId: string) => {
    if (!currentUserId) {
      alert('User not authenticated')
      return
    }

    try {
      const finalizedMonth = await ExpenseService.finalizeMonth(monthId, currentUserId)
      setSelectedMonth(finalizedMonth)

      // Update months list
      setMonths(months.map(m => m.id === monthId ? finalizedMonth : m))
    } catch (err) {
      console.error('Error finalizing month:', err)
      alert('Failed to finalize month')
    }
  }

  const handleNewExpense = () => {
    if (selectedMonth?.is_finalized) {
      alert('Cannot add expenses to a finalized month')
      return
    }
    setEditingExpense(null)
    setShowExpenseForm(true)
  }

  const totalSpending = expenses.reduce((sum, e) => sum + e.amount, 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading budget data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-semibold mb-2">Error</h2>
          <p className="text-red-700">{error}</p>
          <button
            onClick={initialize}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Budget Tracker</h1>
            {selectedMonth && (
              <p className="text-gray-600 mt-1">
                {new Date(selectedMonth.year, selectedMonth.month - 1).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric'
                })}
                {selectedMonth.is_finalized && (
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                    Finalized
                  </span>
                )}
              </p>
            )}
          </div>

          <button
            onClick={handleNewExpense}
            disabled={selectedMonth?.is_finalized}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Expense
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Month Selector */}
          <div className="lg:col-span-1">
            <MonthSelector
              months={months}
              selectedMonth={selectedMonth}
              onSelectMonth={setSelectedMonth}
              onFinalizeMonth={handleFinalizeMonth}
            />

            {/* Quick Stats */}
            {selectedMonth && (
              <div className="mt-6 bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Stats</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Expenses</span>
                    <span className="font-semibold">{expenses.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Spent</span>
                    <span className="font-semibold">${totalSpending.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Categories</span>
                    <span className="font-semibold">{categoryTotals.length}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Expense Form Modal */}
            {showExpenseForm && selectedMonth && currentUserId && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <ExpenseForm
                    expense={editingExpense || undefined}
                    monthId={selectedMonth.id}
                    currentUserId={currentUserId}
                    partnerUserId={partnerUserId || undefined}
                    onSave={handleSaveExpense}
                    onCancel={() => {
                      setShowExpenseForm(false)
                      setEditingExpense(null)
                    }}
                  />
                </div>
              </div>
            )}

            {/* Balance Summary */}
            {balance && <BalanceSummary balance={balance} />}

            {/* Pie Chart and Category Totals */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <ExpensePieChart totals={categoryTotals} categories={categories} />
              <CategoryTotals totals={categoryTotals} totalSpending={totalSpending} />
            </div>

            {/* Expense List */}
            {currentUserId && (
              <ExpenseList
                expenses={expenses}
                currentUserId={currentUserId}
                onEdit={handleEditExpense}
                onDelete={handleDeleteExpense}
                isFinalized={selectedMonth?.is_finalized}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
