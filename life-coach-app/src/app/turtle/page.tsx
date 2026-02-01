'use client'

import { useState, useEffect } from 'react'
import { TurtleService } from '@/services/TurtleService'
import { TurtlePosition, TurtleTrade } from '@/types/database'
import PositionCard from '@/components/PositionCard'
import AddPositionForm from '@/components/AddPositionForm'
import AddTradeForm from '@/components/AddTradeForm'

export default function TurtleTradingPage() {
  const [positions, setPositions] = useState<TurtlePosition[]>([])
  const [selectedPosition, setSelectedPosition] = useState<TurtlePosition | null>(null)
  const [showAddPosition, setShowAddPosition] = useState(false)
  const [showAddTrade, setShowAddTrade] = useState(false)
  const [loading, setLoading] = useState(true)
  const [totalPL, setTotalPL] = useState<{
    totalPremiums: number
    totalLeapsValueChange: number
    totalPL: number
  } | null>(null)

  // Load positions on mount
  useEffect(() => {
    loadPositions()
    loadTotalPL()
  }, [])

  const loadPositions = async () => {
    try {
      setLoading(true)
      const data = await TurtleService.getActivePositions()
      setPositions(data)
    } catch (error) {
      console.error('Failed to load positions:', error)
      alert('Failed to load positions. See console for details.')
    } finally {
      setLoading(false)
    }
  }

  const loadTotalPL = async () => {
    try {
      const pl = await TurtleService.calculateTotalPL()
      setTotalPL(pl)
    } catch (error) {
      console.error('Failed to calculate P&L:', error)
    }
  }

  const handlePositionAdded = () => {
    setShowAddPosition(false)
    loadPositions()
    loadTotalPL()
  }

  const handleTradeAdded = () => {
    setShowAddTrade(false)
    setSelectedPosition(null)
    loadPositions()
    loadTotalPL()
  }

  const handleAddTradeClick = (position: TurtlePosition) => {
    setSelectedPosition(position)
    setShowAddTrade(true)
  }

  return (
    <main style={{
      minHeight: '100vh',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#f9fafb'
    }}>
      {/* Header */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        marginBottom: '2rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#111827' }}>
            🐢 Turtle Trading
          </h1>
          <button
            onClick={() => setShowAddPosition(true)}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '1rem'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
          >
            + Add LEAPS Position
          </button>
        </div>

        {/* P&L Summary */}
        {totalPL && (
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem'
          }}>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                Total Premiums Collected
              </div>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: totalPL.totalPremiums >= 0 ? '#10b981' : '#ef4444'
              }}>
                ${totalPL.totalPremiums.toFixed(2)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                LEAPS Value Change
              </div>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: totalPL.totalLeapsValueChange >= 0 ? '#10b981' : '#ef4444'
              }}>
                ${totalPL.totalLeapsValueChange.toFixed(2)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                Total P&L
              </div>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: totalPL.totalPL >= 0 ? '#10b981' : '#ef4444'
              }}>
                ${totalPL.totalPL.toFixed(2)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Positions Grid */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            Loading positions...
          </div>
        ) : positions.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            padding: '3rem',
            borderRadius: '12px',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🐢</div>
            <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No LEAPS positions yet</p>
            <p style={{ fontSize: '0.875rem' }}>Click "Add LEAPS Position" to get started</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '1.5rem'
          }}>
            {positions.map(position => (
              <PositionCard
                key={position.id}
                position={position}
                onAddTrade={() => handleAddTradeClick(position)}
                onRefresh={loadPositions}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Position Modal */}
      {showAddPosition && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <AddPositionForm
              onSuccess={handlePositionAdded}
              onCancel={() => setShowAddPosition(false)}
            />
          </div>
        </div>
      )}

      {/* Add Trade Modal */}
      {showAddTrade && selectedPosition && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <AddTradeForm
              position={selectedPosition}
              onSuccess={handleTradeAdded}
              onCancel={() => {
                setShowAddTrade(false)
                setSelectedPosition(null)
              }}
            />
          </div>
        </div>
      )}
    </main>
  )
}
