'use client'

import { useState, useEffect, useRef } from 'react'
import { LifeCoachMessage } from '@/types/database'

interface LifeCoachChatProps {
  userId: string
}

interface QuickCheckIn {
  label: string
  emoji: string
  contextType: string
  prompt: string
}

const QUICK_CHECKINS: QuickCheckIn[] = [
  {
    label: 'Feeling anxious',
    emoji: '😰',
    contextType: 'anxiety',
    prompt: "I'm feeling anxious"
  },
  {
    label: 'Compulsive checking',
    emoji: '📱',
    contextType: 'compulsive',
    prompt: "I'm compulsively checking my trading app again"
  },
  {
    label: 'Ruminating',
    emoji: '🔄',
    contextType: 'rumination',
    prompt: "I'm ruminating again"
  },
  {
    label: 'Trading question',
    emoji: '📊',
    contextType: 'trading',
    prompt: "I have a trading question"
  }
]

export default function LifeCoachChat({ userId }: LifeCoachChatProps) {
  const [messages, setMessages] = useState<LifeCoachMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadTodayMessages()
  }, [])

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function loadTodayMessages() {
    try {
      const today = new Date().toISOString().split('T')[0]
      const response = await fetch(`/api/life-coach/chat/history?userId=${userId}&date=${today}`)

      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Failed to load chat history:', error)
    } finally {
      setLoading(false)
    }
  }

  async function sendMessage(messageText: string, contextType?: string) {
    if (!messageText.trim() || sending) return

    setSending(true)

    // Add user message to UI immediately
    const userMessage: LifeCoachMessage = {
      id: `temp-${Date.now()}`,
      user_id: userId,
      message_date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      role: 'user',
      content: messageText,
      context_type: contextType || undefined,
      created_at: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')

    try {
      const response = await fetch('/api/life-coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          userId,
          contextType
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()

      // Add assistant response to UI
      const assistantMessage: LifeCoachMessage = {
        id: `temp-assistant-${Date.now()}`,
        user_id: userId,
        message_date: new Date().toISOString().split('T')[0],
        timestamp: data.timestamp,
        role: 'assistant',
        content: data.content,
        context_type: contextType || undefined,
        created_at: data.timestamp
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Failed to send message:', error)
      alert('Failed to send message. Please try again.')

      // Remove the user message on error
      setMessages(prev => prev.filter(m => m.id !== userMessage.id))
    } finally {
      setSending(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleQuickCheckIn = (checkIn: QuickCheckIn) => {
    sendMessage(checkIn.prompt, checkIn.contextType)
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-card p-4">
        <div className="text-center text-muted-foreground">Loading chat...</div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-card flex flex-col h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-foreground">Life Coach</h3>
        <span className="text-sm text-muted-foreground">
          {messages.length} message{messages.length !== 1 ? 's' : ''} today
        </span>
      </div>

      {/* Quick Check-In Buttons */}
      <div className="p-3 border-b border-gray-200 flex flex-wrap gap-2">
        {QUICK_CHECKINS.map(checkIn => (
          <button
            key={checkIn.contextType}
            onClick={() => handleQuickCheckIn(checkIn)}
            disabled={sending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{checkIn.emoji}</span>
            <span>{checkIn.label}</span>
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Good morning! How are you feeling today?
            </p>
            <p className="text-sm text-muted-foreground">
              Use quick check-ins above or type your message below
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={message.id || index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className="max-w-[80%] rounded-lg px-4 py-2"
                style={
                  message.role === 'user'
                    ? { backgroundColor: '#2563eb', color: '#ffffff' }
                    : { backgroundColor: '#f3f4f6', color: '#111827' }
                }
              >
                <p className="text-sm whitespace-pre-wrap" style={{ color: 'inherit' }}>
                  {message.content}
                </p>
                <p
                  className="text-xs mt-1"
                  style={
                    message.role === 'user'
                      ? { color: '#dbeafe' }
                      : { color: '#6b7280' }
                  }
                >
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={sending}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  )
}
