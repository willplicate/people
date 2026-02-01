'use client'

import { useState, useEffect } from 'react'
import { TurtlePosition, TurtleTrade } from '@/types/database'
import { TurtleService } from '@/services/TurtleService'

interface PositionCardProps {
  position: TurtlePosition
  onAddTrade: () => void
  onRefresh: () => void
}

export default function PositionCard({ position, onAddTrade, onRefresh }: PositionCardProps) {
  const [trades, setTrades] = useState<TurtleTrade[]>([])
  const [showTrades, setShowTrades] = useState(false)
  const [pl, setPL] = useState<{
    totalPremiums: number
    leapsValueChange: number
    totalPL: number
  } | null>(null)

  useEffect(() => {
    loadTrades()
    loadPL()
  }, [position.id])

  const loadTrades = async () => {
    try {
      const data = await TurtleService.getTradesByPosition(position.id)
      setTrades(data)
    } catch (error) {
      console.error('Failed to load trades:', error)
    }
  }

  const loadPL = async () => {
    try {
      const data = await TurtleService.calculatePositionPL(position.id)
      setPL(data)
    } catch (error) {
      console.error('Failed to calculate P&L:', error)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${position.position_name}? This will also delete all associated trades.`)) {
      return
    }

    try {
      await TurtleService.deletePosition(position.id)
      onRefresh()
    } catch (error) {
      console.error('Failed to delete position:', error)
      alert('Failed to delete position. See console for details.')
    }
  }

  // Calculate days to expiry
  const expiryDate = new Date(position.leaps_expiry)
  const today = new Date()
  const daysToExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  // Get health status
  const health = TurtleService.getPositionHealth(position)
  const healthColor = health.status === 'green' ? '#10b981' : health.status === 'yellow' ? '#f59e0b' : '#ef4444'

  // Get latest trade
  const latestTrade = trades[0]

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: `2px solid ${healthColor}`,
      transition: 'all 0.2s'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', marginBottom: '0.25rem' }}>
              {position.position_name}
            </h3>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              {position.symbol} • {position.contracts} contract{position.contracts > 1 ? 's' : ''}
            </div>
          </div>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: healthColor
          }} />
        </div>
      </div>

      {/* LEAPS Details */}
      <div style={{
        backgroundColor: '#f9fafb',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '1rem',
        fontSize: '0.875rem'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Strike</div>
            <div style={{ fontWeight: 600, color: '#111827' }}>${position.leaps_strike}</div>
          </div>
          <div>
            <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Expiry</div>
            <div style={{ fontWeight: 600, color: '#111827' }}>
              {new Date(position.leaps_expiry).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
          <div>
            <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Delta</div>
            <div style={{ fontWeight: 600, color: healthColor }}>
              {position.current_delta ? position.current_delta.toFixed(2) : 'N/A'}
            </div>
          </div>
          <div>
            <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>DTE</div>
            <div style={{ fontWeight: 600, color: healthColor }}>
              {daysToExpiry} days
            </div>
          </div>
        </div>
      </div>

      {/* Health Warnings */}
      {health.warnings.length > 0 && (
        <div style={{
          backgroundColor: health.status === 'red' ? '#fee2e2' : '#fef3c7',
          padding: '0.75rem',
          borderRadius: '6px',
          marginBottom: '1rem',
          fontSize: '0.75rem'
        }}>
          {health.warnings.map((warning, i) => (
            <div key={i} style={{ color: health.status === 'red' ? '#991b1b' : '#92400e' }}>
              ⚠️ {warning}
            </div>
          ))}
        </div>
      )}

      {/* P&L */}
      {pl && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.75rem',
          marginBottom: '1rem',
          fontSize: '0.75rem'
        }}>
          <div>
            <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Premiums</div>
            <div style={{
              fontWeight: 700,
              color: pl.totalPremiums >= 0 ? '#10b981' : '#ef4444'
            }}>
              ${pl.totalPremiums.toFixed(0)}
            </div>
          </div>
          <div>
            <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>LEAPS Δ</div>
            <div style={{
              fontWeight: 700,
              color: pl.leapsValueChange >= 0 ? '#10b981' : '#ef4444'
            }}>
              ${pl.leapsValueChange.toFixed(0)}
            </div>
          </div>
          <div>
            <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Total P&L</div>
            <div style={{
              fontWeight: 700,
              color: pl.totalPL >= 0 ? '#10b981' : '#ef4444'
            }}>
              ${pl.totalPL.toFixed(0)}
            </div>
          </div>
        </div>
      )}

      {/* Latest Trade */}
      {latestTrade && (
        <div style={{
          backgroundColor: '#f0fdf4',
          padding: '0.75rem',
          borderRadius: '6px',
          marginBottom: '1rem',
          fontSize: '0.75rem'
        }}>
          <div style={{ color: '#166534', fontWeight: 600, marginBottom: '0.25rem' }}>
            Latest: {latestTrade.action.replace('_', ' ').toUpperCase()}
          </div>
          <div style={{ color: '#166534' }}>
            {latestTrade.strike && `$${latestTrade.strike} • `}
            ${latestTrade.premium} premium • {new Date(latestTrade.trade_date).toLocaleDateString()}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <button
          onClick={onAddTrade}
          style={{
            flex: 1,
            padding: '0.625rem',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
        >
          + Trade
        </button>
        <button
          onClick={() => setShowTrades(!showTrades)}
          style={{
            flex: 1,
            padding: '0.625rem',
            backgroundColor: 'white',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
        >
          {showTrades ? 'Hide' : 'Show'} Trades ({trades.length})
        </button>
      </div>

      {/* Delete Button */}
      <button
        onClick={handleDelete}
        style={{
          width: '100%',
          padding: '0.625rem',
          backgroundColor: 'white',
          color: '#ef4444',
          border: '1px solid #fecaca',
          borderRadius: '6px',
          fontSize: '0.75rem',
          fontWeight: 600,
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#fef2f2'
          e.currentTarget.style.borderColor = '#ef4444'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'white'
          e.currentTarget.style.borderColor = '#fecaca'
        }}
      >
        🗑️ Delete Position
      </button>

      {/* Trade History */}
      {showTrades && trades.length > 0 && (
        <div style={{
          marginTop: '1rem',
          borderTop: '1px solid #e5e7eb',
          paddingTop: '1rem'
        }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: '#374151' }}>
            Trade History
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {trades.map(trade => (
              <div
                key={trade.id}
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  fontSize: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 600, color: '#111827' }}>
                    {trade.action.replace('_', ' ').toUpperCase()}
                  </span>
                  <span style={{ color: '#6b7280' }}>
                    {new Date(trade.trade_date).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ color: '#6b7280' }}>
                  {trade.strike && `$${trade.strike} • `}
                  ${trade.premium} premium
                  {trade.expiry && ` • Exp: ${new Date(trade.expiry).toLocaleDateString()}`}
                </div>
                {trade.notes && (
                  <div style={{ marginTop: '0.25rem', color: '#6b7280', fontStyle: 'italic' }}>
                    {trade.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
