'use client'

import { useState, useEffect } from 'react'

export default function AdminPage() {
  const [lifeCoach, setLifeCoach] = useState('')
  const [lifeNow, setLifeNow] = useState('')
  const [tradingRules, setTradingRules] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadContext()
  }, [])

  async function loadContext() {
    try {
      const response = await fetch('/api/life-coach/context')
      if (response.ok) {
        const data = await response.json()
        setLifeCoach(data.LIFE_COACH_FRAMEWORK || '')
        setLifeNow(data.LIFE_NOW || '')
        setTradingRules(data.TRADING_RULES || '')
      }
    } catch (error) {
      console.error('Failed to load context:', error)
    } finally {
      setLoading(false)
    }
  }

  async function saveContext() {
    setSaving(true)
    try {
      // Save LIFE_COACH_FRAMEWORK
      await fetch('/api/life-coach/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'LIFE_COACH_FRAMEWORK',
          content: lifeCoach
        })
      })

      // Save LIFE_NOW
      await fetch('/api/life-coach/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'LIFE_NOW',
          content: lifeNow
        })
      })

      // Save TRADING_RULES
      await fetch('/api/life-coach/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'TRADING_RULES',
          content: tradingRules
        })
      })

      alert('Context saved successfully!')
    } catch (error) {
      console.error('Failed to save context:', error)
      alert('Failed to save context')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        Loading...
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
        Life Coach Admin
      </h1>

      <div style={{ marginBottom: '2rem' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
          LIFE_COACH_FRAMEWORK
        </label>
        <textarea
          value={lifeCoach}
          onChange={(e) => setLifeCoach(e.target.value)}
          style={{
            width: '100%',
            minHeight: '300px',
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            fontFamily: 'monospace',
            fontSize: '0.875rem'
          }}
        />
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
          LIFE_NOW
        </label>
        <textarea
          value={lifeNow}
          onChange={(e) => setLifeNow(e.target.value)}
          style={{
            width: '100%',
            minHeight: '300px',
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            fontFamily: 'monospace',
            fontSize: '0.875rem'
          }}
        />
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
          TRADING_RULES
        </label>
        <textarea
          value={tradingRules}
          onChange={(e) => setTradingRules(e.target.value)}
          style={{
            width: '100%',
            minHeight: '300px',
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            fontFamily: 'monospace',
            fontSize: '0.875rem'
          }}
        />
      </div>

      <button
        onClick={saveContext}
        disabled={saving}
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '0.375rem',
          fontWeight: 600,
          cursor: saving ? 'not-allowed' : 'pointer',
          opacity: saving ? 0.5 : 1
        }}
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '0.375rem' }}>
        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          Update your life coach context files here. Changes take effect immediately in new chat sessions.
        </p>
      </div>
    </div>
  )
}
