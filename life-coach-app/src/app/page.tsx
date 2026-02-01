'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import LifeCoachChat from '@/components/LifeCoachChat'
import HabitTrackerModal from '@/components/HabitTrackerModal'

export default function Home() {
  // Using a test user ID - in production this would come from authentication
  const TEST_USER_ID = '00000000-0000-0000-0000-000000000000'
  const [showHabits, setShowHabits] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const router = useRouter()

  return (
    <main style={{
      minHeight: '100vh',
      paddingTop: '5rem',
      paddingLeft: '2rem',
      paddingRight: '2rem',
      paddingBottom: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '900px',
      margin: '0 auto',
      backgroundColor: '#f9fafb'
    }}>
      {/* Sticky Header */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        zIndex: 40
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827' }}>
            Life Coach 🧠
          </h1>
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              padding: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '4px',
              zIndex: 50
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            aria-label="Open menu"
          >
            <div style={{ width: '24px', height: '2px', backgroundColor: '#374151', pointerEvents: 'none' }}></div>
            <div style={{ width: '24px', height: '2px', backgroundColor: '#374151', pointerEvents: 'none' }}></div>
            <div style={{ width: '24px', height: '2px', backgroundColor: '#374151', pointerEvents: 'none' }}></div>
          </button>
        </div>
      </div>

      {/* Menu Dropdown */}
      {showMenu && (
        <div style={{
          position: 'fixed',
          top: '4rem',
          right: '2rem',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          zIndex: 50,
          overflow: 'hidden',
          border: '1px solid #e5e7eb'
        }}>
          <button
            onClick={() => {
              setShowMenu(false)
              setShowHabits(true)
            }}
            style={{
              display: 'block',
              width: '100%',
              padding: '1rem 1.5rem',
              textAlign: 'left',
              border: 'none',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#374151',
              borderBottom: '1px solid #e5e7eb'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            📊 Habit Tracker
          </button>
          <button
            onClick={() => {
              setShowMenu(false)
              router.push('/turtle')
            }}
            style={{
              display: 'block',
              width: '100%',
              padding: '1rem 1.5rem',
              textAlign: 'left',
              border: 'none',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#374151'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            🐢 Turtle Trading
          </button>
        </div>
      )}

      <LifeCoachChat userId={TEST_USER_ID} />

      <HabitTrackerModal
        userId={TEST_USER_ID}
        isOpen={showHabits}
        onClose={() => setShowHabits(false)}
      />
    </main>
  )
}
