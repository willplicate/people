'use client'

import { useState, useEffect, useRef } from 'react'
import { TradingService } from '@/services/TradingService'
import type { TradingSession, OptionsTrade, TradingChatMessage } from '@/types/database'

// Mock user ID - in production this would come from auth
const MOCK_USER_ID = '00000000-0000-0000-0000-000000000001'

// Motivational mantras from the framework
const MANTRAS = [
  "I am not predicting direction. I am selling the probability that QQQ won't crash 2% in 45 days.",
  "Losses are the cost of doing business. I budgeted for them. This is expected.",
  "The edge only works if I keep placing trades. Stopping destroys the edge.",
  "Stopping during fear is selling low. I refuse to be that trader.",
  "Volatility is my paycheck. High VIX means I'm getting paid more, not that I should run.",
  "I don't need to be right every week. I need to be consistent every week.",
  "The market doesn't know I exist. My fear changes nothing except my results.",
  "Every Monday I place a trade. That's the only decision I make.",
  "The market rewards consistency. The market punishes panic. Choose which side you're on — every single Monday."
]

export default function TradingPage() {
  const [currentMantra, setCurrentMantra] = useState(MANTRAS[0])
  const [session, setSession] = useState<TradingSession | null>(null)
  const [messages, setMessages] = useState<TradingChatMessage[]>([])
  const [trades, setTrades] = useState<OptionsTrade[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [plSummary, setPLSummary] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize session and load data
  useEffect(() => {
    initializeSession()

    // Rotate mantra every 30 seconds
    const mantraInterval = setInterval(() => {
      setCurrentMantra(prev => {
        const currentIndex = MANTRAS.indexOf(prev)
        const nextIndex = (currentIndex + 1) % MANTRAS.length
        return MANTRAS[nextIndex]
      })
    }, 30000)

    return () => clearInterval(mantraInterval)
  }, [])

  const initializeSession = async () => {
    try {
      const currentSession = await TradingService.getOrCreateTodaySession(MOCK_USER_ID)
      setSession(currentSession)

      const chatHistory = await TradingService.getChatHistory(currentSession.id)
      setMessages(chatHistory)

      await loadTrades()
      await loadPLSummary()
    } catch (error) {
      console.error('Failed to initialize session:', error)
    }
  }

  const loadTrades = async () => {
    try {
      const allTrades = await TradingService.getAllTrades(MOCK_USER_ID)
      setTrades(allTrades)
    } catch (error) {
      console.error('Failed to load trades:', error)
    }
  }

  const loadPLSummary = async () => {
    try {
      const summary = await TradingService.getPLSummary(MOCK_USER_ID)
      setPLSummary(summary)
    } catch (error) {
      console.error('Failed to load P&L summary:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    console.log('📸 Image selected:', file.name, 'Size:', file.size, 'Type:', file.type)

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64Image = event.target?.result as string
      console.log('📸 Base64 image loaded, length:', base64Image.length)
      console.log('📸 Base64 preview (first 100 chars):', base64Image.substring(0, 100))
      setSelectedImage(base64Image)
    }
    reader.readAsDataURL(file)
  }

  const handleSendScreenshot = async () => {
    if (!selectedImage) return
    await extractScreenshot(selectedImage)
  }

  const extractScreenshot = async (imageData: string) => {
    if (!session) return

    console.log('📤 Sending screenshot to API')
    console.log('📤 Image data length:', imageData.length)
    console.log('📤 Image data preview (first 100 chars):', imageData.substring(0, 100))

    setIsLoading(true)
    try {
      const response = await fetch('/people/api/trading/extract-screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageData,
          sessionId: session.id
        })
      })

      console.log('📥 API response status:', response.status)
      const result = await response.json()
      console.log('📥 Screenshot extraction result:', result)

      if (result.tradeData) {
        const data = result.tradeData

        // Check if it's a multi-leg strategy
        if (data.legs && Array.isArray(data.legs)) {
          // Multi-leg strategy (condor, spread, etc.)
          const legsInfo = data.legs.map((leg: any, i: number) => {
            const costStr = leg.cost ? ` @ $${Math.abs(leg.cost / 100).toFixed(2)}/contract` : ''
            return `Leg ${i + 1}: ${leg.action} ${leg.numberOfContracts} ${data.ticker} $${leg.strikePrice} ${leg.optionType}${costStr} (Δ ${leg.delta || 'N/A'})`
          }).join('\n')

          const extractedInfo = `I extracted this ${data.strategy || 'multi-leg'} trade from your screenshot:\n\n` +
            `Ticker: ${data.ticker}\n` +
            `Strategy: ${data.strategy || 'Multi-leg'}\n` +
            `Expiration: ${data.expirationDate}\n` +
            `Net Credit: $${data.netCredit || 'N/A'}\n\n` +
            `Legs (with actual COST from screenshot):\n${legsInfo}\n\n` +
            `**IMPORTANT: Use the COST values above as the premiums when recording. These are the actual premiums paid/received.**\n\n` +
            `Should I record all these legs? Please confirm or provide any corrections.`

          await sendMessage(extractedInfo, false)
        } else {
          // Single trade
          const extractedInfo = `I extracted this trade from your screenshot:\n\n` +
            `Ticker: ${data.ticker || 'N/A'}\n` +
            `Type: ${data.optionType || 'N/A'}\n` +
            `Action: ${data.action || 'N/A'}\n` +
            `Strike: $${data.strikePrice || 'N/A'}\n` +
            `Premium: $${data.premiumPerContract || 'N/A'}\n` +
            `Contracts: ${data.numberOfContracts || 'N/A'}\n` +
            `Expiration: ${data.expirationDate || 'N/A'}\n` +
            `Delta: ${data.delta || 'N/A'}\n\n` +
            `Should I record this trade? Please confirm or provide any corrections.`

          await sendMessage(extractedInfo, false)
        }
      } else {
        // No trade data extracted
        await sendMessage('I uploaded a screenshot but couldn\'t extract the trade data. Can you help me enter it manually?', false)
      }
    } catch (error) {
      console.error('Failed to extract screenshot:', error)
      alert('Failed to extract trade data from screenshot')
    } finally {
      setIsLoading(false)
      setSelectedImage(null)
    }
  }

  const sendMessage = async (content: string, isSystem: boolean = false) => {
    if (!session || !content.trim()) return

    setIsLoading(true)

    try {
      // Add user message optimistically
      const userMessage: TradingChatMessage = {
        id: `temp-${Date.now()}`,
        session_id: session.id,
        user_id: MOCK_USER_ID,
        role: 'user',
        content: content,
        created_at: new Date().toISOString()
      }

      if (!isSystem) {
        setMessages(prev => [...prev, userMessage])
      }

      // Call chat API
      const response = await fetch('/people/api/trading/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...messages.map(m => ({
              role: m.role,
              content: m.content
            })),
            { role: 'user', content }
          ],
          sessionId: session.id,
          userId: MOCK_USER_ID
        })
      })

      const result = await response.json()

      // Add assistant message
      const assistantMessage: TradingChatMessage = {
        id: `temp-${Date.now()}-assistant`,
        session_id: session.id,
        user_id: MOCK_USER_ID,
        role: 'assistant',
        content: result.message,
        created_at: new Date().toISOString()
      }

      setMessages(prev => [...prev, assistantMessage])

      // Reload trades and P&L in case Claude recorded something
      await loadTrades()
      await loadPLSummary()

      setInput('')
    } catch (error) {
      console.error('Failed to send message:', error)
      alert('Failed to send message')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSend = () => {
    sendMessage(input)
  }

  const handleDeleteTrade = async (tradeId: string) => {
    if (!confirm('Are you sure you want to delete this trade?')) return

    try {
      await TradingService.deleteTrade(tradeId)
      await loadTrades() // Reload trades after deletion
      await loadPLSummary() // Reload P&L summary
    } catch (error) {
      console.error('Failed to delete trade:', error)
      alert('Failed to delete trade')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-100 text-blue-800'
      case 'CLOSED': return 'bg-green-100 text-green-800'
      case 'EXPIRED': return 'bg-gray-100 text-gray-800'
      case 'ASSIGNED': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading session...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Motivational Mantra - TESTING VISIBILITY */}
      <div
        className="text-white px-6 py-8 mb-4"
        style={{
          background: 'linear-gradient(to right, rgb(37, 99, 235), rgb(147, 51, 234))',
          marginLeft: '-20px',
          marginRight: '-20px',
          marginTop: '-24px',
          fontSize: '18px',
          fontWeight: '500',
          fontStyle: 'italic',
          textAlign: 'center'
        }}
      >
        "{currentMantra}"
      </div>
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 mb-4">
          <h1 className="text-2xl font-bold">Trading Tracker</h1>
          <p className="text-gray-600">Session: {new Date(session.session_date).toLocaleDateString()}</p>
        </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* P&L Summary */}
        {plSummary && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Performance Summary</h2>
              {session.account_balance && (
                <div className="text-right">
                  <div className="text-sm text-gray-600">Account Balance</div>
                  <div className="text-xl font-bold text-blue-600">
                    {formatCurrency(session.account_balance)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Target: $20,000
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">Total P&L</div>
                <div className={`text-2xl font-bold ${plSummary.totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(plSummary.totalPL)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Win Rate</div>
                <div className="text-2xl font-bold">{plSummary.winRate.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Open Trades</div>
                <div className="text-2xl font-bold">{plSummary.openTrades}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Trades</div>
                <div className="text-2xl font-bold">{plSummary.totalTrades}</div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Interface */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-semibold">Trading Coach</h2>
          </div>

          {/* Messages */}
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 py-12">
                <p className="text-lg mb-2">Welcome to your trading session!</p>
                <p>Upload a screenshot or describe your trade to get started.</p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={msg.id || idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-2xl rounded-lg px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-4">
            {/* Image Preview */}
            {selectedImage && (
              <div className="mb-3 p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-start space-x-3">
                  <img
                    src={selectedImage}
                    alt="Screenshot preview"
                    className="w-32 h-32 object-cover rounded border"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-2">Screenshot ready to analyze</p>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSendScreenshot}
                        disabled={isLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-semibold shadow-sm"
                      >
                        📊 Extract Trade Data
                      </button>
                      <button
                        onClick={() => setSelectedImage(null)}
                        disabled={isLoading}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-end space-x-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="screenshot-upload"
                disabled={isLoading}
              />
              <label
                htmlFor="screenshot-upload"
                className={`px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                📷 Upload
              </label>

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Describe your trade or ask a question..."
                className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={2}
                disabled={isLoading}
              />

              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Trades Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-semibold">All Trades</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticker</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Strike</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Premium</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contracts</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P&L</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {trades.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
                      No trades yet. Start by describing a trade or uploading a screenshot!
                    </td>
                  </tr>
                )}
                {trades.map((trade) => (
                  <tr key={trade.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(trade.trade_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {trade.ticker_symbol}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {trade.option_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={trade.action === 'BUY' ? 'text-green-600' : 'text-red-600'}>
                        {trade.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      ${trade.strike_price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      ${trade.premium_per_contract}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {trade.number_of_contracts}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(trade.expiration_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(trade.status)}`}>
                        {trade.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {trade.realized_pl !== null && trade.realized_pl !== undefined ? (
                        <span className={trade.realized_pl >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(trade.realized_pl)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDeleteTrade(trade.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
