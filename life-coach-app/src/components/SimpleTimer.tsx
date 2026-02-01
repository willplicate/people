'use client'

import { useState, useEffect } from 'react'
import { simpleTimerStore } from '@/lib/simpleTimerStore'

export default function SimpleTimer() {
  const [state, setState] = useState(simpleTimerStore.getState())

  useEffect(() => {
    console.log('SimpleTimer mounted')

    const unsubscribe = simpleTimerStore.subscribe(() => {
      const newState = simpleTimerStore.getState()
      console.log('Timer state updated:', newState)
      setState(newState)
    })

    setState(simpleTimerStore.getState())

    return () => {
      console.log('SimpleTimer unmounting')
      unsubscribe()
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getProgressPercent = () => {
    const total = state.targetMinutes * 60
    return total > 0 ? (state.timeLeft / total) * 100 : 0
  }

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '2rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      maxWidth: '400px',
      margin: '0 auto'
    }}>
      <h2 style={{
        fontSize: '1.5rem',
        fontWeight: 'bold',
        marginBottom: '1.5rem',
        textAlign: 'center'
      }}>
        Pomodoro Timer Test
      </h2>

      {/* Timer Display */}
      <div style={{
        fontSize: '4rem',
        fontFamily: 'monospace',
        fontWeight: 'bold',
        textAlign: 'center',
        color: state.timeLeft === 0 ? '#ef4444' : '#111',
        marginBottom: '1rem'
      }}>
        {formatTime(state.timeLeft)}
      </div>

      {/* Progress Bar */}
      <div style={{
        width: '100%',
        height: '8px',
        backgroundColor: '#e5e7eb',
        borderRadius: '4px',
        marginBottom: '1.5rem',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${getProgressPercent()}%`,
          height: '100%',
          backgroundColor: state.timeLeft === 0 ? '#ef4444' : '#3b82f6',
          transition: 'width 1s linear'
        }} />
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        justifyContent: 'center',
        marginBottom: '1rem'
      }}>
        {!state.isRunning ? (
          <button
            onClick={() => simpleTimerStore.start()}
            disabled={state.timeLeft === 0}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: state.timeLeft === 0 ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: state.timeLeft === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            Start
          </button>
        ) : (
          <button
            onClick={() => simpleTimerStore.pause()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Pause
          </button>
        )}

        <button
          onClick={() => simpleTimerStore.reset()}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Reset
        </button>
      </div>

      {/* Time Presets */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        justifyContent: 'center',
        marginBottom: '1rem'
      }}>
        {[1, 5, 10, 20].map(mins => (
          <button
            key={mins}
            onClick={() => simpleTimerStore.setMinutes(mins)}
            disabled={state.isRunning}
            style={{
              padding: '0.5rem 0.75rem',
              backgroundColor: state.targetMinutes === mins ? '#3b82f6' : '#e5e7eb',
              color: state.targetMinutes === mins ? 'white' : '#374151',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              cursor: state.isRunning ? 'not-allowed' : 'pointer',
              opacity: state.isRunning ? 0.5 : 1
            }}
          >
            {mins}m
          </button>
        ))}
      </div>

      {/* Status Message */}
      {state.timeLeft === 0 && (
        <div style={{
          textAlign: 'center',
          color: '#ef4444',
          fontWeight: 'bold',
          fontSize: '1.125rem',
          marginTop: '1rem'
        }}>
          Time&apos;s up! 🎉
        </div>
      )}

      {/* Debug Info */}
      <div style={{
        marginTop: '1.5rem',
        padding: '0.75rem',
        backgroundColor: '#f3f4f6',
        borderRadius: '6px',
        fontSize: '0.75rem',
        fontFamily: 'monospace',
        color: '#6b7280'
      }}>
        <div>Status: {state.isRunning ? '▶️ Running' : '⏸️ Stopped'}</div>
        <div>Time Left: {state.timeLeft}s</div>
        <div>Target: {state.targetMinutes} minutes</div>
        <div>Deployed on: Vercel</div>
      </div>
    </div>
  )
}
