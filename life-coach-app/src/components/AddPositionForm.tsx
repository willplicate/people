'use client'

import { useState } from 'react'
import { TurtleService } from '@/services/TurtleService'
import { CreateTurtlePositionInput } from '@/types/database'

interface AddPositionFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export default function AddPositionForm({ onSuccess, onCancel }: AddPositionFormProps) {
  const [formData, setFormData] = useState<CreateTurtlePositionInput>({
    position_name: '',
    symbol: 'SPY',
    leaps_strike: 0,
    leaps_expiry: '',
    leaps_cost_basis: 0,
    current_value: 0,
    current_delta: 0.85,
    contracts: 1,
    status: 'active'
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.position_name || !formData.leaps_expiry || formData.leaps_strike <= 0 || formData.leaps_cost_basis <= 0) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setSubmitting(true)
      await TurtleService.createPosition(formData)
      onSuccess()
    } catch (error) {
      console.error('Failed to create position:', error)
      alert('Failed to create position. See console for details.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (field: keyof CreateTurtlePositionInput, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: '#111827' }}>
        Add LEAPS Position
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Position Name */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>
            Position Name *
          </label>
          <input
            type="text"
            value={formData.position_name}
            onChange={(e) => handleChange('position_name', e.target.value)}
            placeholder="e.g., Tasty SPY LEAPS 1"
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

        {/* Symbol */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>
            Symbol *
          </label>
          <select
            value={formData.symbol}
            onChange={(e) => handleChange('symbol', e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '1rem'
            }}
          >
            <option value="SPY">SPY</option>
            <option value="QQQ">QQQ</option>
            <option value="IWM">IWM</option>
            <option value="DIA">DIA</option>
          </select>
        </div>

        {/* Strike and Expiry */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>
              Strike Price *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.leaps_strike || ''}
              onChange={(e) => handleChange('leaps_strike', parseFloat(e.target.value) || 0)}
              placeholder="420.00"
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
              value={formData.leaps_expiry}
              onChange={(e) => handleChange('leaps_expiry', e.target.value)}
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

        {/* Cost Basis and Current Value */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>
              Cost Basis *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.leaps_cost_basis || ''}
              onChange={(e) => handleChange('leaps_cost_basis', parseFloat(e.target.value) || 0)}
              placeholder="120.00"
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
              Current Value
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.current_value || ''}
              onChange={(e) => handleChange('current_value', parseFloat(e.target.value) || 0)}
              placeholder="120.00"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
          </div>
        </div>

        {/* Delta and Contracts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>
              Delta
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={formData.current_delta || ''}
              onChange={(e) => handleChange('current_delta', parseFloat(e.target.value) || 0)}
              placeholder="0.85"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>
              Contracts *
            </label>
            <input
              type="number"
              step="1"
              min="1"
              value={formData.contracts}
              onChange={(e) => handleChange('contracts', parseInt(e.target.value) || 1)}
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
            {submitting ? 'Adding...' : 'Add Position'}
          </button>
        </div>
      </div>
    </form>
  )
}
