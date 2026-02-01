'use client'

import SimpleTimer from '@/components/SimpleTimer'
import Link from 'next/link'

export default function TimerTestPage() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f3f4f6',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            marginBottom: '0.5rem'
          }}>
            Timer Test Page
          </h1>
          <p style={{
            color: '#6b7280',
            fontSize: '1.125rem'
          }}>
            Testing if countdown timer works properly on Vercel deployment
          </p>
        </div>

        <SimpleTimer />

        <div style={{
          marginTop: '2rem',
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            marginBottom: '1rem'
          }}>
            How to test:
          </h3>
          <ol style={{
            listStyle: 'decimal',
            paddingLeft: '1.5rem',
            color: '#374151',
            lineHeight: '1.75'
          }}>
            <li>Select a time preset (1m, 5m, 10m, or 20m)</li>
            <li>Click &quot;Start&quot; to begin the countdown</li>
            <li>Watch the timer count down in real-time</li>
            <li>Use &quot;Pause&quot; to stop, &quot;Reset&quot; to start over</li>
            <li>Check the console (F12) for debug logs</li>
            <li>When timer reaches 0, you should hear a sound (if available)</li>
          </ol>
        </div>

        <div style={{
          marginTop: '1.5rem',
          textAlign: 'center'
        }}>
          <Link
            href="/"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600
            }}
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
