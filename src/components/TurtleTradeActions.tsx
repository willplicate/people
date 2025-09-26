'use client'

import { useState } from 'react'
import { TurtlePosition, TurtleTrade } from '@/types/database'

interface TurtleTradeActionsProps {
  position: TurtlePosition
  editingTrade?: TurtleTrade
  onTradeCompleted: (trade: TurtleTrade) => void
  onClose: () => void
}

export default function TurtleTradeActions({ position, editingTrade, onTradeCompleted, onClose }: TurtleTradeActionsProps) {
  const [activeAction, setActiveAction] = useState<'sell' | 'roll' | 'close' | 'edit' | null>(
    editingTrade ? 'edit' : null
  )
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    strike: editingTrade?.strike?.toString() || '',
    premium: editingTrade?.premium?.toString() || '',
    expiry: editingTrade?.expiry || '',
    notes: editingTrade?.notes || ''
  })
  const [error, setError] = useState('')

  const handleActionClick = (action: 'sell' | 'roll' | 'close') => {
    setActiveAction(action)
    setError('')
    // Pre-fill with sensible defaults
    const today = new Date()
    const nextFriday = new Date(today)
    nextFriday.setDate(today.getDate() + (5 - today.getDay() + 7) % 7)

    setFormData({
      strike: position.leaps_strike ? (position.leaps_strike + 10).toString() : '',
      premium: '',
      expiry: nextFriday.toISOString().split('T')[0],
      notes: ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeAction) return

    setLoading(true)
    setError('')

    try {
      let response;

      if (activeAction === 'edit' && editingTrade) {
        // Update existing trade
        response = await fetch(`/api/turtle-trades/${editingTrade.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            strike: formData.strike ? parseFloat(formData.strike) : undefined,
            premium: parseFloat(formData.premium),
            expiry: formData.expiry || undefined,
            notes: formData.notes || undefined
          }),
        })
      } else {
        // Create new trade
        response = await fetch('/api/turtle-trades', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: activeAction === 'sell' ? 'sell' : activeAction === 'roll' ? 'roll_call' : 'buy_to_close',
            position_id: position.id,
            strike: formData.strike ? parseFloat(formData.strike) : undefined,
            premium: parseFloat(formData.premium),
            expiry: formData.expiry || undefined,
            notes: formData.notes || undefined
          }),
        })
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to execute trade')
      }

      const trade = await response.json()
      onTradeCompleted(trade)
      setActiveAction(null)
      setFormData({ strike: '', premium: '', expiry: '', notes: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute trade')
    } finally {
      setLoading(false)
    }
  }

  const getActionTitle = () => {
    switch (activeAction) {
      case 'sell': return 'Sell Call Option'
      case 'roll': return 'Roll Call Option'
      case 'close': return 'Buy to Close'
      case 'edit': return 'Edit Trade'
      default: return ''
    }
  }

  const getActionDescription = () => {
    switch (activeAction) {
      case 'sell': return 'Sell a new call option against your LEAPS position'
      case 'roll': return 'Roll your existing call to a future expiration date'
      case 'close': return 'Buy back your short call position'
      case 'edit': return 'Update the details of this existing trade'
      default: return ''
    }
  }

  if (activeAction) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{getActionTitle()}</h3>
                <p className="text-sm text-gray-600">{position.position_name}</p>
              </div>
              <button
                onClick={() => setActiveAction(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">{getActionDescription()}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {(activeAction === 'sell' || activeAction === 'roll' || activeAction === 'edit') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Strike Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.strike}
                      onChange={(e) => setFormData(prev => ({ ...prev, strike: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="450.00"
                      required
                    />
                  </div>

                  {(activeAction === 'sell' || activeAction === 'roll' || activeAction === 'edit') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expiry Date *
                      </label>
                      <input
                        type="date"
                        value={formData.expiry}
                        onChange={(e) => setFormData(prev => ({ ...prev, expiry: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  )}
                </>
              )}

              {activeAction === 'close' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Strike Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.strike}
                    onChange={(e) => setFormData(prev => ({ ...prev, strike: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Strike of the call you're closing"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Premium {activeAction === 'close' ? '(Cost)' : '(Credit)'} *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.premium}
                  onChange={(e) => setFormData(prev => ({ ...prev, premium: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="2.50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Additional notes about this trade..."
                  rows={2}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setActiveAction(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Processing...' : `Execute ${getActionTitle()}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Trade Actions</h3>
              <p className="text-sm text-gray-600">{position.position_name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleActionClick('sell')}
              className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium text-gray-900">📈 Sell Call</div>
              <div className="text-sm text-gray-600 mt-1">
                Sell a new call option to generate income
              </div>
            </button>

            <button
              onClick={() => handleActionClick('roll')}
              className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium text-gray-900">🔄 Roll Call</div>
              <div className="text-sm text-gray-600 mt-1">
                Roll existing call to future expiration
              </div>
            </button>

            <button
              onClick={() => handleActionClick('close')}
              className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium text-gray-900">🛑 Buy to Close</div>
              <div className="text-sm text-gray-600 mt-1">
                Close your short call position
              </div>
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}