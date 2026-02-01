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
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const previousMessageCountRef = useRef(0)

  useEffect(() => {
    loadTodayMessages()
  }, [])

  useEffect(() => {
    // Only auto-scroll when a NEW message is added, not during streaming updates
    const messageCountChanged = messages.length !== previousMessageCountRef.current

    if (messageCountChanged && shouldAutoScroll) {
      scrollToBottom()
      previousMessageCountRef.current = messages.length
    }
  }, [messages, shouldAutoScroll])

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'instant' })
    }
  }

  const handleScroll = () => {
    const container = messagesContainerRef.current
    if (!container) return

    const { scrollTop, scrollHeight, clientHeight } = container
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight

    // Enable auto-scroll if within 100px of bottom, disable if scrolled up
    setShouldAutoScroll(distanceFromBottom < 100)
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

    // Create empty assistant message for streaming
    const assistantId = `temp-assistant-${Date.now()}`
    const assistantMessage: LifeCoachMessage = {
      id: assistantId,
      user_id: userId,
      message_date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      role: 'assistant',
      content: '',
      context_type: contextType || undefined,
      created_at: new Date().toISOString()
    }

    setMessages(prev => [...prev, assistantMessage])

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

      // Read streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6))

            if (data.text) {
              // Update assistant message with new text
              setMessages(prev => prev.map(m =>
                m.id === assistantId
                  ? { ...m, content: m.content + data.text }
                  : m
              ))
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      alert('Failed to send message. Please try again.')

      // Remove both messages on error
      setMessages(prev => prev.filter(m => m.id !== userMessage.id && m.id !== assistantId))
    } finally {
      setSending(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Ctrl+Enter or Cmd+Enter
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleQuickCheckIn = (checkIn: QuickCheckIn) => {
    sendMessage(checkIn.prompt, checkIn.contextType)
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="text-center text-gray-600">Loading chat...</div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg flex flex-col h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Life Coach</h3>
        <span className="text-sm text-gray-600">
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
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              Good morning! How are you feeling today?
            </p>
            <p className="text-sm text-gray-600">
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
                <div className="text-sm" style={{ color: 'inherit' }}>
                  {message.content.split('\n').map((paragraph, idx) => (
                    <p key={idx} className={idx > 0 ? 'mt-3' : ''}>
                      {paragraph}
                    </p>
                  ))}
                </div>
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
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Ctrl/Cmd+Enter to send)"
              disabled={sending}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed resize-y"
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  )
}
