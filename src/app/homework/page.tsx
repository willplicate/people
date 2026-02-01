'use client'

import { useState, useEffect } from 'react'
import { JournalEntry } from '@/types/database'
import { JournalService } from '@/services/JournalService'

export default function HomeworkPage() {
  const [todayEntry, setTodayEntry] = useState<JournalEntry | null>(null)
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [streak, setStreak] = useState<number>(0)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchTodayEntry(),
        fetchRecentEntries(),
        fetchStreak()
      ])
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const fetchTodayEntry = async () => {
    const entry = await JournalService.getTodayEntry()
    setTodayEntry(entry)

    // Pre-populate with today's content if it exists
    if (entry && entry.content.length > 0) {
      const allText = entry.content.map(c => c.text).join('\n\n')
      setText(allText)
    }
  }

  const fetchRecentEntries = async () => {
    // Get recent entries excluding today
    const entries = await JournalService.getRecentEntries(10)
    const today = new Date().toISOString().split('T')[0]
    const filteredEntries = entries.filter(e => e.date !== today)
    setRecentEntries(filteredEntries)
  }

  const fetchStreak = async () => {
    const currentStreak = await JournalService.getCurrentStreak()
    setStreak(currentStreak)
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

      // Refresh the data
      await fetchData()

      setError(null)
    } catch (err) {
      console.error('Error saving entry:', err)
      setError(err instanceof Error ? err.message : 'Failed to save entry')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-muted rounded w-1/2"></div>
          <div className="h-64 bg-muted rounded"></div>
          <div className="h-48 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-foreground">Homework for Life 📝</h1>
          {streak > 0 && (
            <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
              <span className="text-3xl">🔥</span>
              <div className="flex flex-col">
                <span className="font-bold text-primary text-lg">{streak}</span>
                <span className="text-xs text-muted-foreground">day streak</span>
              </div>
            </div>
          )}
        </div>
        <p className="text-muted-foreground">
          Document one meaningful moment from each day - a learning experience, an insight, or something that made the day different.
        </p>
      </div>

      {/* Today's Entry Form */}
      <div className="bg-card p-6 rounded-card shadow-card mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Today's Entry
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {formatDate(new Date().toISOString().split('T')[0])}
        </p>

        <form onSubmit={handleSubmit}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's one thing from today that stood out to you? What could you learn from it?"
            className="w-full min-h-[200px] p-4 border border-border rounded-card bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
            disabled={submitting}
          />

          {error && (
            <p className="text-sm text-destructive mt-2">{error}</p>
          )}

          <div className="flex justify-end mt-4">
            <button
              type="submit"
              disabled={submitting || !text.trim()}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-card hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving...' : todayEntry ? 'Update Entry' : 'Save Entry'}
            </button>
          </div>
        </form>

        {/* Show today's appended entries if they exist */}
        {todayEntry && todayEntry.content.length > 0 && (
          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">
              Today's Entries ({todayEntry.content.length})
            </h3>
            <div className="space-y-3">
              {todayEntry.content.map((item, index) => (
                <div key={index} className="bg-muted/30 p-3 rounded-card">
                  <p className="text-xs text-muted-foreground mb-1">
                    {formatTime(item.timestamp)}
                  </p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Archive - Previous 2 Entries */}
      <div className="bg-card p-6 rounded-card shadow-card">
        <h2 className="text-xl font-semibold text-foreground mb-6">Recent Entries</h2>

        {recentEntries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">No previous entries yet.</p>
            <p className="text-sm mt-2">Start your journey by writing your first entry above!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {recentEntries.slice(0, 2).map((entry) => (
              <div key={entry.id} className="border-l-4 border-primary pl-6 py-2">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-foreground">
                    {formatDate(entry.date)}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {entry.content.length} {entry.content.length === 1 ? 'entry' : 'entries'}
                  </span>
                </div>
                <div className="space-y-3">
                  {entry.content.map((item, index) => (
                    <div key={index} className="bg-muted/20 p-3 rounded-card">
                      {entry.content.length > 1 && (
                        <p className="text-xs text-muted-foreground mb-2">
                          {formatTime(item.timestamp)}
                        </p>
                      )}
                      <p className="text-foreground whitespace-pre-wrap">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* View All Link */}
            {recentEntries.length > 2 && (
              <div className="text-center pt-4">
                <button
                  onClick={() => {
                    // Future: navigate to full archive or expand to show all entries
                    alert('Full archive view coming soon!')
                  }}
                  className="text-primary hover:text-primary/80 text-sm underline"
                >
                  View all {recentEntries.length} entries →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
