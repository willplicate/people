'use client'

import { useState } from 'react'
import { TurtleService } from '@/services/TurtleService'
import { TurtlePosition, CreateTurtleTradeInput, TradeAction } from '@/types/database'

interface AddTradeFormProps {
  position: TurtlePosition
  onSuccess: () => void
  onCancel: () => void
}

export default function AddTradeForm({ position, onSuccess, onCancel }: AddTradeFormProps) {
  const today = new Date().toISOString().split('T')[0]

  const [formData, setFormData] = useState<CreateTurtleTradeInput>({
    position_id: position.id,
    trade_date: today,
    action: 'sell',
    strike: undefined,
    premium: 0,
    expiry: '',
    notes: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.premium <= 0) {
      alert('Please enter a premium amount')
      return
    }

    if (formData.action === 'sell' && (!formData.strike || !formData.expiry)) {
      alert('Strike and expiry are required for sell orders')
      return
    }

    try {
      setSubmitting(true)
      await TurtleService.createTrade(formData)
      onSuccess()
    } catch (error) {
      console.error('Failed to create trade:', error)
      alert('Failed to create trade. See console for details.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (field: keyof CreateTurtleTradeInput, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#111827' }}>
        Log Trade
      </h2>
      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>
        {position.position_name} ({position.symbol})
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Action */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>
            Action *
          </label>
          <select
            value={formData.action}
            onChange={(e) => handleChange('action', e.target.value as TradeAction)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '1rem'
            }}
          >
            <option value="sell">Sell Weekly Call</option>
            <option value="buy_to_close">Buy to Close</option>
            <option value="roll_call">Roll Call</option>
            <option value="assignment">Assignment</option>
          </select>
        </div>

        {/* Trade Date */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>
            Trade Date *
          </label>
          <input
            type="date"
            value={formData.trade_date}
            onChange={(e) => handleChange('trade_date', e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '1rem'
            }}
            required
          />
        </div>

        {/* Strike and Expiry (for sells) */}
        {(formData.action === 'sell' || formData.action === 'roll_call') && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>
                Strike Price *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.strike || ''}
                onChange={(e) => handleChange('strike', parseFloat(e.target.value) || undefined)}
                placeholder="615.00"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>
                Expiry Date *
              </label>
              <input
                type="date"
                value={formData.expiry || ''}
                onChange={(e) => handleChange('expiry', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
                required
              />
            </div>
          </div>
        )}

        {/* Premium */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>
            Premium *
            <span style={{ fontWeight: 400, color: '#6b7280', marginLeft: '0.5rem' }}>
              ({formData.action === 'sell' ? 'Collected' : 'Paid'})
            </span>
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.premium || ''}
            onChange={(e) => handleChange('premium', parseFloat(e.target.value) || 0)}
            placeholder="2.50"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '1rem'
            }}
            required
          />
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
            Per contract (total: ${((formData.premium || 0) * position.contracts * 100).toFixed(2)})
          </div>
        </div>

        {/* Notes */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>
            Notes
          </label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="VIX at 22, sold $10 OTM per framework..."
            rows={3}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '1rem',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'white',
              color: '#374151',
              fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.5 : 1
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: '#10b981',
              color: 'white',
              fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.5 : 1
            }}
          >
            {submitting ? 'Saving...' : 'Save Trade'}
          </button>
        </div>
      </div>
    </form>
  )
}
