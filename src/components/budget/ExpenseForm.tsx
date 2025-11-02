'use client'

import { useState, useEffect } from 'react'
import { Expense, ExpenseCategory, CreateExpenseInput, SplitType } from '@/types/database'
import { ExpenseService } from '@/services/ExpenseService'

interface ExpenseFormProps {
  expense?: Expense
  monthId: string
  currentUserId: string
  partnerUserId?: string
  onSave: (expense: Expense) => void
  onCancel: () => void
}

export default function ExpenseForm({
  expense,
  monthId,
  currentUserId,
  partnerUserId,
  onSave,
  onCancel
}: ExpenseFormProps) {
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [formData, setFormData] = useState<CreateExpenseInput>({
    month_id: monthId,
    category_id: '',
    amount: 0,
    description: '',
    expense_date: new Date().toISOString().split('T')[0],
    paid_by_user_id: currentUserId,
    split_type: 'individual',
    split_percentage: undefined,
    split_with_user_id: undefined
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadCategories()
    if (expense) {
      setFormData({
        month_id: expense.month_id,
        category_id: expense.category_id,
        amount: expense.amount,
        description: expense.description || '',
        expense_date: expense.expense_date,
        paid_by_user_id: expense.paid_by_user_id,
        split_type: expense.split_type,
        split_percentage: expense.split_percentage,
        split_with_user_id: expense.split_with_user_id
      })
    }
  }, [expense])

  const loadCategories = async () => {
    try {
      const cats = await ExpenseService.getAllCategories()
      setCategories(cats)

      // Set first category as default if creating new expense
      if (!expense && cats.length > 0) {
        setFormData(prev => ({ ...prev, category_id: cats[0].id }))
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.category_id) {
      newErrors.category_id = 'Category is required'
    }

    if (formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0'
    }

    if (!formData.expense_date) {
      newErrors.expense_date = 'Date is required'
    }

    if ((formData.split_type === 'shared_50_50' || formData.split_type === 'custom') && !formData.split_with_user_id) {
      newErrors.split_with_user_id = 'Please select who to split with'
    }

    if (formData.split_type === 'custom') {
      if (!formData.split_percentage || formData.split_percentage < 0 || formData.split_percentage > 100) {
        newErrors.split_percentage = 'Split percentage must be between 0 and 100'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setLoading(true)

    try {
      let savedExpense: Expense

      if (expense) {
        // Update existing expense
        savedExpense = await ExpenseService.updateExpense(expense.id, formData)
      } else {
        // Create new expense
        savedExpense = await ExpenseService.createExpense(formData, currentUserId)
      }

      onSave(savedExpense)
    } catch (error) {
      console.error('Error saving expense:', error)
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to save expense' })
    } finally {
      setLoading(false)
    }
  }

  const handleSplitTypeChange = (newSplitType: SplitType) => {
    setFormData(prev => ({
      ...prev,
      split_type: newSplitType,
      split_with_user_id: newSplitType === 'individual' ? undefined : partnerUserId,
      split_percentage: newSplitType === 'custom' ? 50 : undefined
    }))
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">
        {expense ? 'Edit Expense' : 'Add New Expense'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount || ''}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
              required
            />
          </div>
          {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category *
          </label>
          <select
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
          {errors.category_id && <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Optional details..."
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date *
          </label>
          <input
            type="date"
            value={formData.expense_date}
            onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
          {errors.expense_date && <p className="mt-1 text-sm text-red-600">{errors.expense_date}</p>}
        </div>

        {/* Paid By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Paid By *
          </label>
          <select
            value={formData.paid_by_user_id}
            onChange={(e) => setFormData({ ...formData, paid_by_user_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value={currentUserId}>You</option>
            {partnerUserId && <option value={partnerUserId}>Partner</option>}
          </select>
        </div>

        {/* Split Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Split Type *
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                checked={formData.split_type === 'individual'}
                onChange={() => handleSplitTypeChange('individual')}
                className="mr-2"
              />
              <span>Individual (not shared)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={formData.split_type === 'shared_50_50'}
                onChange={() => handleSplitTypeChange('shared_50_50')}
                className="mr-2"
                disabled={!partnerUserId}
              />
              <span>Shared 50/50</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={formData.split_type === 'custom'}
                onChange={() => handleSplitTypeChange('custom')}
                className="mr-2"
                disabled={!partnerUserId}
              />
              <span>Custom Split</span>
            </label>
          </div>
          {!partnerUserId && (
            <p className="mt-2 text-sm text-gray-500">
              Configure a partner user ID to enable shared expenses
            </p>
          )}
        </div>

        {/* Custom Split Percentage */}
        {formData.split_type === 'custom' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Share (%) *
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.split_percentage || 50}
              onChange={(e) => setFormData({ ...formData, split_percentage: parseInt(e.target.value) || 50 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Partner's share: {100 - (formData.split_percentage || 50)}%
            </p>
            {errors.split_percentage && <p className="mt-1 text-sm text-red-600">{errors.split_percentage}</p>}
          </div>
        )}

        {/* Error Display */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {errors.submit}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : expense ? 'Update Expense' : 'Add Expense'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
