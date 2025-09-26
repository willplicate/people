'use client'

import { useState, useEffect } from 'react'
import { TurtlePosition, TurtleTrade } from '@/types/database'
import TurtlePositionForm from '@/components/TurtlePositionForm'
import TurtleTradeActions from '@/components/TurtleTradeActions'

export default function TurtlePage() {
  const [positions, setPositions] = useState<TurtlePosition[]>([])
  const [trades, setTrades] = useState<TurtleTrade[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [editingPosition, setEditingPosition] = useState<TurtlePosition | undefined>(undefined)
  const [showTradeActions, setShowTradeActions] = useState(false)
  const [tradingPosition, setTradingPosition] = useState<TurtlePosition | undefined>(undefined)
  const [editingTrade, setEditingTrade] = useState<TurtleTrade | undefined>(undefined)

  const fetchPositions = async () => {
    try {
      setLoading(true)
      const [positionsResponse, tradesResponse] = await Promise.all([
        fetch('/api/turtle-positions'),
        fetch('/api/turtle-trades')
      ])

      if (!positionsResponse.ok) throw new Error('Failed to fetch positions')

      const positionsData = await positionsResponse.json()
      setPositions(positionsData.positions || [])

      if (tradesResponse.ok) {
        const tradesData = await tradesResponse.json()
        setTrades(tradesData.trades || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      // Fallback to sample data if API fails
      setPositions([])
      setTrades([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPositions()
  }, [])

  const getHealthColor = (position: TurtlePosition) => {
    if (!position.current_delta) return 'bg-gray-400'

    const daysToExpiry = Math.floor((new Date(position.leaps_expiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

    if (position.current_delta > 0.75 && daysToExpiry > 120) return 'bg-green-500'
    if (position.current_delta > 0.70 && daysToExpiry > 90) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getHealthStatus = (position: TurtlePosition) => {
    if (!position.current_delta) return 'Unknown'

    const daysToExpiry = Math.floor((new Date(position.leaps_expiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

    if (position.current_delta > 0.75 && daysToExpiry > 120) return 'Healthy'
    if (position.current_delta > 0.70 && daysToExpiry > 90) return 'Monitor'
    return 'Action Needed'
  }

  const calculatePnL = (position: TurtlePosition) => {
    if (!position.current_value) return null
    return ((position.current_value - position.leaps_cost_basis) * position.contracts * 100).toFixed(2)
  }

  const getActiveShortCall = (positionId: string) => {
    const positionTrades = trades.filter(trade => trade.position_id === positionId)
      .sort((a, b) => new Date(b.created_at || b.trade_date).getTime() - new Date(a.created_at || a.trade_date).getTime())

    if (positionTrades.length === 0) return null

    // Group trades by strike price to track open/close pairs
    const tradesByStrike = new Map<number, Array<TurtleTrade>>()

    positionTrades.forEach(trade => {
      if (trade.strike !== undefined) {
        if (!tradesByStrike.has(trade.strike)) {
          tradesByStrike.set(trade.strike, [])
        }
        tradesByStrike.get(trade.strike)!.push(trade)
      }
    })

    // Check each strike to see if there's an open position
    for (const [strike, strikeTrades] of tradesByStrike) {
      const sellTrades = strikeTrades.filter(t => t.action === 'sell' || t.action === 'roll_call')
        .sort((a, b) => new Date(b.created_at || b.trade_date).getTime() - new Date(a.created_at || a.trade_date).getTime())

      const closeTrades = strikeTrades.filter(t => t.action === 'buy_to_close')
        .sort((a, b) => new Date(b.created_at || b.trade_date).getTime() - new Date(a.created_at || a.trade_date).getTime())

      // If we have sells but no closes, or if latest sell is after latest close
      if (sellTrades.length > 0) {
        if (closeTrades.length === 0) {
          return sellTrades[0] // Most recent sell
        }

        const latestSell = sellTrades[0]
        const latestClose = closeTrades[0]
        const sellTime = new Date(latestSell.created_at || latestSell.trade_date).getTime()
        const closeTime = new Date(latestClose.created_at || latestClose.trade_date).getTime()

        if (sellTime > closeTime) {
          return latestSell
        }
      }
    }

    return null
  }

  const getTotalCredit = (positionId: string) => {
    const positionTrades = trades.filter(trade => trade.position_id === positionId)
    const sellCredit = positionTrades
      .filter(trade => trade.action === 'sell' || trade.action === 'roll_call')
      .reduce((sum, trade) => sum + trade.premium, 0)
    const closeCost = positionTrades
      .filter(trade => trade.action === 'buy_to_close')
      .reduce((sum, trade) => sum + trade.premium, 0)

    return sellCredit - closeCost
  }

  const handleAddPosition = () => {
    setEditingPosition(undefined)
    setShowForm(true)
  }

  const handleManagePosition = (position: TurtlePosition) => {
    setTradingPosition(position)
    setShowTradeActions(true)
  }

  const handleEditPosition = (position: TurtlePosition) => {
    setEditingPosition(position)
    setShowForm(true)
  }

  const handleEditTrade = (trade: TurtleTrade) => {
    const position = positions.find(p => p.id === trade.position_id)
    if (position) {
      setTradingPosition(position)
      setEditingTrade(trade)
      setShowTradeActions(true)
    }
  }

  const handleFormSave = async (savedPosition: TurtlePosition) => {
    setFormLoading(false)
    setShowForm(false)
    setEditingPosition(undefined)
    await fetchPositions() // Refresh the list
  }

  const handleFormCancel = () => {
    setFormLoading(false)
    setShowForm(false)
    setEditingPosition(undefined)
  }

  const handleTradeCompleted = (trade: TurtleTrade) => {
    console.log('Trade completed:', trade)
    setShowTradeActions(false)
    setTradingPosition(undefined)
    setEditingTrade(undefined)
    // Optionally refresh positions or show success message
    fetchPositions()
  }

  const handleTradeActionsClose = () => {
    setShowTradeActions(false)
    setTradingPosition(undefined)
    setEditingTrade(undefined)
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Turtle Trading Dashboard</h1>
        <button
          onClick={handleAddPosition}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Position
        </button>
      </div>

      {/* Portfolio Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Portfolio Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{positions.length}</div>
            <div className="text-sm text-gray-600">Active Positions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              ${positions.reduce((sum, pos) => {
                const pnl = calculatePnL(pos)
                return sum + (pnl ? parseFloat(pnl) : 0)
              }, 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Total P&L</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {positions.filter(pos => getHealthStatus(pos) === 'Healthy').length}
            </div>
            <div className="text-sm text-gray-600">Healthy Positions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {positions.filter(pos => getHealthStatus(pos) === 'Action Needed').length}
            </div>
            <div className="text-sm text-gray-600">Need Attention</div>
          </div>
        </div>
      </div>

      {/* Position Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {positions.map((position) => {
          const daysToExpiry = Math.floor((new Date(position.leaps_expiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          const pnl = calculatePnL(position)
          const activeShortCall = getActiveShortCall(position.id)
          const totalCredit = getTotalCredit(position.id)

          return (
            <div key={position.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow">
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{position.position_name}</h3>
                  <p className="text-xs text-gray-600">{position.symbol} ${position.leaps_strike} • {position.contracts}x • {daysToExpiry}d</p>
                </div>
                <div className={`w-3 h-3 rounded-full ${getHealthColor(position)}`}></div>
              </div>

              {/* LEAPS Info */}
              <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cost:</span>
                  <span className="font-medium">${position.leaps_cost_basis}</span>
                </div>
                {position.current_value && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Value:</span>
                    <span className="font-medium">${position.current_value}</span>
                  </div>
                )}
                {position.current_delta && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delta:</span>
                    <span className="font-medium">{(position.current_delta * 100).toFixed(0)}%</span>
                  </div>
                )}
                {pnl && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">P&L:</span>
                    <span className={`font-medium ${parseFloat(pnl) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${pnl}
                    </span>
                  </div>
                )}
              </div>

              {/* Short Call Info */}
              {activeShortCall ? (
                (() => {
                  const daysToCallExpiry = activeShortCall.expiry ?
                    Math.floor((new Date(activeShortCall.expiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0
                  const isExpiringSoon = daysToCallExpiry <= 3
                  const bgColor = isExpiringSoon ? 'bg-orange-50' : 'bg-blue-50'
                  const textColor = isExpiringSoon ? 'text-orange-800' : 'text-blue-800'
                  const accentColor = isExpiringSoon ? 'text-orange-600' : 'text-blue-600'

                  return (
                    <div className={`${bgColor} rounded p-2 mb-3`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-xs font-medium ${textColor}`}>
                          📞 Short Call {isExpiringSoon ? '⚠️' : ''}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className={`text-xs ${accentColor}`}>${activeShortCall.strike}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditTrade(activeShortCall);
                            }}
                            className={`text-xs ${accentColor} hover:opacity-70 ml-1`}
                            title="Edit this trade"
                          >
                            ✏️
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between">
                          <span className={accentColor}>Expires:</span>
                          <span className={`font-medium ${textColor}`}>
                            {daysToCallExpiry}d {isExpiringSoon ? '🔥' : ''}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={accentColor}>Credit:</span>
                          <span className="font-medium text-green-600">${totalCredit.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })()
              ) : (
                <div className="bg-gray-50 rounded p-2 mb-3">
                  <div className="text-center text-xs text-gray-500">No active short call</div>
                </div>
              )}

              {/* Status */}
              <div className="flex justify-center mb-3">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  getHealthStatus(position) === 'Healthy' ? 'bg-green-100 text-green-800' :
                  getHealthStatus(position) === 'Monitor' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {getHealthStatus(position)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleManagePosition(position)}
                  className="bg-blue-600 text-white py-1.5 px-2 rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                >
                  🔧 Trade
                </button>
                <button
                  onClick={() => handleEditPosition(position)}
                  className="bg-gray-100 text-gray-800 py-1.5 px-2 rounded text-xs hover:bg-gray-200 transition-colors"
                >
                  ✏️ Edit
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {positions.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">No active positions</div>
          <button
            onClick={handleAddPosition}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Your First Position
          </button>
        </div>
      )}

      {/* Add/Edit Position Form Modal */}
      {showForm && (
        <TurtlePositionForm
          position={editingPosition}
          onSave={handleFormSave}
          onCancel={handleFormCancel}
          isLoading={formLoading}
        />
      )}

      {/* Trade Actions Modal */}
      {showTradeActions && tradingPosition && (
        <TurtleTradeActions
          position={tradingPosition}
          editingTrade={editingTrade}
          onTradeCompleted={handleTradeCompleted}
          onClose={handleTradeActionsClose}
        />
      )}
    </div>
  )
}