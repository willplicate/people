'use client'

import { useState, useEffect } from 'react'
import { TurtlePosition, CreateTurtlePositionInput } from '@/types/database'

interface TurtlePositionFormProps {
  position?: TurtlePosition
  onSave: (position: TurtlePosition) => void
  onCancel: () => void
  isLoading?: boolean
}

export default function TurtlePositionForm({ position, onSave, onCancel, isLoading = false }: TurtlePositionFormProps) {
  const [formData, setFormData] = useState<CreateTurtlePositionInput>({
    position_name: '',
    symbol: '',
    leaps_strike: 0,
    leaps_expiry: '',
    leaps_cost_basis: 0,
    current_value: undefined,
    current_delta: undefined,
    contracts: 1,
    status: 'active'
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (position) {
      setFormData({
        position_name: position.position_name,
        symbol: position.symbol,
        leaps_strike: position.leaps_strike,
        leaps_expiry: position.leaps_expiry,
        leaps_cost_basis: position.leaps_cost_basis,
        current_value: position.current_value,
        current_delta: position.current_delta,
        contracts: position.contracts,
        status: position.status
      })
    }
  }, [position])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.position_name.trim()) {
      newErrors.position_name = 'Position name is required'
    }

    if (!formData.symbol.trim()) {
      newErrors.symbol = 'Symbol is required'
    }

    if (formData.leaps_strike <= 0) {
      newErrors.leaps_strike = 'Strike price must be greater than 0'
    }

    if (!formData.leaps_expiry) {
      newErrors.leaps_expiry = 'Expiry date is required'
    } else {
      const expiryDate = new Date(formData.leaps_expiry)
      const today = new Date()
      if (expiryDate <= today) {
        newErrors.leaps_expiry = 'Expiry date must be in the future'
      }
    }

    if (formData.leaps_cost_basis <= 0) {
      newErrors.leaps_cost_basis = 'Cost basis must be greater than 0'
    }

    if (formData.contracts <= 0) {
      newErrors.contracts = 'Contracts must be greater than 0'
    }

    if (formData.current_delta && (formData.current_delta < 0 || formData.current_delta > 1)) {
      newErrors.current_delta = 'Delta must be between 0 and 1'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      const url = position ? `/api/turtle-positions/${position.id}` : '/api/turtle-positions'
      const method = position ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to save position')
      }

      const savedPosition = await response.json()
      onSave(savedPosition)
    } catch (error) {
      console.error('Error saving position:', error)
      setErrors({ submit: 'Failed to save position. Please try again.' })
    }
  }

  const handleInputChange = (field: keyof CreateTurtlePositionInput, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const popularSymbols = ['SPY', 'QQQ', 'IWM', 'AAPL', 'MSFT', 'TSLA', 'NVDA', 'AMZN']

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {position ? 'Edit Position' : 'Add New Position'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              disabled={isLoading}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Position Name */}
            <div>
              <label htmlFor="position_name" className="block text-sm font-medium text-gray-700 mb-2">
                Position Name *
              </label>
              <input
                type="text"
                id="position_name"
                value={formData.position_name}
                onChange={(e) => handleInputChange('position_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Tasty SPY LEAPS"
                disabled={isLoading}
              />
              {errors.position_name && <p className="mt-1 text-sm text-red-600">{errors.position_name}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Symbol */}
              <div>
                <label htmlFor="symbol" className="block text-sm font-medium text-gray-700 mb-2">
                  Symbol *
                </label>
                <input
                  type="text"
                  id="symbol"
                  value={formData.symbol}
                  onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="SPY"
                  disabled={isLoading}
                />
                <div className="mt-2 flex flex-wrap gap-1">
                  {popularSymbols.map(sym => (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => handleInputChange('symbol', sym)}
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                      disabled={isLoading}
                    >
                      {sym}
                    </button>
                  ))}
                </div>
                {errors.symbol && <p className="mt-1 text-sm text-red-600">{errors.symbol}</p>}
              </div>

              {/* Contracts */}
              <div>
                <label htmlFor="contracts" className="block text-sm font-medium text-gray-700 mb-2">
                  Contracts *
                </label>
                <input
                  type="number"
                  id="contracts"
                  min="1"
                  value={formData.contracts}
                  onChange={(e) => handleInputChange('contracts', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
                {errors.contracts && <p className="mt-1 text-sm text-red-600">{errors.contracts}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strike Price */}
              <div>
                <label htmlFor="leaps_strike" className="block text-sm font-medium text-gray-700 mb-2">
                  LEAPS Strike Price *
                </label>
                <input
                  type="number"
                  id="leaps_strike"
                  step="0.01"
                  min="0"
                  value={formData.leaps_strike}
                  onChange={(e) => handleInputChange('leaps_strike', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="450.00"
                  disabled={isLoading}
                />
                {errors.leaps_strike && <p className="mt-1 text-sm text-red-600">{errors.leaps_strike}</p>}
              </div>

              {/* Expiry Date */}
              <div>
                <label htmlFor="leaps_expiry" className="block text-sm font-medium text-gray-700 mb-2">
                  LEAPS Expiry Date *
                </label>
                <input
                  type="date"
                  id="leaps_expiry"
                  value={formData.leaps_expiry}
                  onChange={(e) => handleInputChange('leaps_expiry', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
                {errors.leaps_expiry && <p className="mt-1 text-sm text-red-600">{errors.leaps_expiry}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cost Basis */}
              <div>
                <label htmlFor="leaps_cost_basis" className="block text-sm font-medium text-gray-700 mb-2">
                  Cost Basis *
                </label>
                <input
                  type="number"
                  id="leaps_cost_basis"
                  step="0.01"
                  min="0"
                  value={formData.leaps_cost_basis}
                  onChange={(e) => handleInputChange('leaps_cost_basis', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="42.80"
                  disabled={isLoading}
                />
                {errors.leaps_cost_basis && <p className="mt-1 text-sm text-red-600">{errors.leaps_cost_basis}</p>}
              </div>

              {/* Current Value */}
              <div>
                <label htmlFor="current_value" className="block text-sm font-medium text-gray-700 mb-2">
                  Current Value (Optional)
                </label>
                <input
                  type="number"
                  id="current_value"
                  step="0.01"
                  min="0"
                  value={formData.current_value || ''}
                  onChange={(e) => handleInputChange('current_value', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="48.15"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Current Delta */}
            <div>
              <label htmlFor="current_delta" className="block text-sm font-medium text-gray-700 mb-2">
                Current Delta (Optional)
              </label>
              <input
                type="number"
                id="current_delta"
                step="0.01"
                min="0"
                max="1"
                value={formData.current_delta || ''}
                onChange={(e) => handleInputChange('current_delta', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.82"
                disabled={isLoading}
              />
              <p className="mt-1 text-sm text-gray-500">Enter as decimal (e.g., 0.82 for 82%)</p>
              {errors.current_delta && <p className="mt-1 text-sm text-red-600">{errors.current_delta}</p>}
            </div>

            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : position ? 'Update Position' : 'Create Position'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}