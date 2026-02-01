'use client'

import { useState, useEffect } from 'react'
import { JournalEntry } from '@/types/database'
import { JournalService } from '@/services/JournalService'

export default function HomeworkJournal() {
  const [todayEntry, setTodayEntry] = useState<JournalEntry | null>(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [streak, setStreak] = useState<number>(0)

  useEffect(() => {
    fetchTodayEntry()
    fetchStreak()
  }, [])

  const fetchTodayEntry = async () => {
    try {
      setLoading(true)
      const entry = await JournalService.getTodayEntry()
      setTodayEntry(entry)

      // Pre-populate with today's content if it exists
      if (entry && entry.content.length > 0) {
        const allText = entry.content.map(c => c.text).join('\n\n')
        setText(allText)
      }
    } catch (err) {
      console.error('Error fetching today\'s entry:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch entry')
    } finally {
      setLoading(false)
    }
  }

  const fetchStreak = async () => {
    try {
      const currentStreak = await JournalService.getCurrentStreak()
      setStreak(currentStreak)
    } catch (err) {
      console.error('Error fetching streak:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!text.trim()) {
      return
    }

    try {
      setSubmitting(true)
      const today = new Date().toISOString().split('T')[0]

      await JournalService.appendToEntry(today, { text: text.trim() })

      // Refresh the entry and streak
      await fetchTodayEntry()
      await fetchStreak()

      setError(null)
    } catch (err) {
      console.error('Error saving entry:', err)
      setError(err instanceof Error ? err.message : 'Failed to save entry')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-card p-6 rounded-card shadow-card animate-pulse">
        <div className="h-6 bg-muted rounded w-1/2 mb-4"></div>
        <div className="h-32 bg-muted rounded mb-4"></div>
        <div className="h-10 bg-muted rounded w-24"></div>
      </div>
    )
  }

  return (
    <div className="bg-card p-6 rounded-card shadow-card hover:shadow-card-hover transition-shadow duration-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-foreground">
          Homework for Life 📝
        </h2>
        {streak > 0 && (
          <div className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full">
            <span className="text-2xl">🔥</span>
            <span className="font-bold text-primary">{streak} day{streak !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        One moment today that made it different - a potential learning moment
      </p>

      <form onSubmit={handleSubmit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's one thing from today that stood out to you?"
          className="w-full min-h-[120px] p-3 border border-border rounded-card bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
          disabled={submitting}
        />

        {error && (
          <p className="text-sm text-destructive mt-2">{error}</p>
        )}

        <div className="flex justify-between items-center mt-4">
          <a
            href="/homework"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
          >
            View archive →
          </a>
          <button
            type="submit"
            disabled={submitting || !text.trim()}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-card hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving...' : todayEntry ? 'Update' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}
