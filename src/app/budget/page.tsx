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
      } else {
        // No authentication - use fixed UUIDs for personal use
        // This works because RLS is disabled for budget tables
        // User 1 (You): 00000000-0000-0000-0000-000000000001
        // User 2 (Partner): 00000000-0000-0000-0000-000000000002
        setCurrentUserId('00000000-0000-0000-0000-000000000001')
        setPartnerUserId('00000000-0000-0000-0000-000000000002')
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

  const handleUpdateBudget = async (budgetAmount: number) => {
    if (!selectedMonth) return

    try {
      const { data, error } = await supabase
        .from('budget_months')
        .update({ total_budget: budgetAmount })
        .eq('id', selectedMonth.id)
        .select()
        .single()

      if (error) throw error

      // Update local state
      setSelectedMonth(data)
      setMonths(months.map(m => m.id === selectedMonth.id ? data : m))
    } catch (err) {
      console.error('Error updating budget:', err)
      alert('Failed to update budget')
    }
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
    <div className="bg-gray-50 relative">
      {/* Compact Header with Key Stats */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Budget Tracker</h1>
            {selectedMonth && (
              <p className="text-sm text-gray-600">
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

          {/* Key Stats - Inline */}
          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-xs text-gray-600">Total Spent</div>
              <div className="text-2xl font-bold text-gray-900">€{totalSpending.toFixed(2)}</div>
              {selectedMonth?.total_budget && (
                <div className="text-xs text-gray-500">of €{selectedMonth.total_budget.toFixed(2)}</div>
              )}
            </div>
            {selectedMonth?.total_budget && (
              <div className="text-center">
                <div className="text-xs text-gray-600">Remaining</div>
                <div className={`text-2xl font-bold ${
                  selectedMonth.total_budget - totalSpending >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  €{(selectedMonth.total_budget - totalSpending).toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">
                  {((totalSpending / selectedMonth.total_budget) * 100).toFixed(0)}% used
                </div>
              </div>
            )}
            <div className="text-center">
              <div className="text-xs text-gray-600">Expenses</div>
              <div className="text-2xl font-bold text-gray-900">{expenses.length}</div>
            </div>
          </div>

          {/* Add Expense Button */}
          <button
            onClick={handleNewExpense}
            disabled={selectedMonth?.is_finalized}
            style={{ backgroundColor: '#2563eb', color: 'white' }}
            className="px-4 py-2 rounded-lg hover:opacity-90 disabled:bg-gray-400 font-semibold whitespace-nowrap"
          >
            + Add Expense
          </button>
        </div>

        {/* Budget Progress Bar */}
        {selectedMonth?.total_budget && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Budget Progress</span>
              <button
                onClick={() => {
                  const newBudget = prompt('Enter monthly budget (€):', selectedMonth.total_budget?.toString() || '')
                  if (newBudget !== null) {
                    const amount = parseFloat(newBudget)
                    if (!isNaN(amount) && amount >= 0) {
                      handleUpdateBudget(amount)
                    }
                  }
                }}
                className="text-blue-600 hover:text-blue-700"
              >
                Edit Budget
              </button>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  totalSpending > selectedMonth.total_budget
                    ? 'bg-red-500'
                    : totalSpending > selectedMonth.total_budget * 0.9
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{
                  width: `${Math.min((totalSpending / selectedMonth.total_budget) * 100, 100)}%`
                }}
              />
            </div>
          </div>
        )}

        {/* Set Budget Button (if no budget set) */}
        {selectedMonth && !selectedMonth.total_budget && (
          <button
            onClick={() => {
              const budget = prompt('Set monthly budget (€):')
              if (budget !== null) {
                const amount = parseFloat(budget)
                if (!isNaN(amount) && amount > 0) {
                  handleUpdateBudget(amount)
                }
              }
            }}
            className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            + Set Monthly Budget
          </button>
        )}
      </div>

      {/* Main Content */}
      <div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left Sidebar - Month Selector */}
          <div className="lg:col-span-1">
            <MonthSelector
              months={months}
              selectedMonth={selectedMonth}
              onSelectMonth={setSelectedMonth}
              onFinalizeMonth={handleFinalizeMonth}
            />
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
