'use client'

import { useState, useEffect } from 'react'
import { DailyQuote } from '@/types/database'
import { DailyQuoteService } from '@/services/DailyQuoteService'

export default function WelcomeSection() {
  const [quote, setQuote] = useState<DailyQuote | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDailyQuote()
  }, [])

  const fetchDailyQuote = async () => {
    try {
      setLoading(true)
      const dailyQuote = await DailyQuoteService.getDailyQuote()
      setQuote(dailyQuote)
    } catch (err) {
      console.error('Error fetching daily quote:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch daily quote')
    } finally {
      setLoading(false)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 p-8 rounded-card shadow-card animate-pulse">
        <div className="h-6 bg-muted rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-muted rounded w-1/4"></div>
      </div>
    )
  }

  if (error || !quote) {
    return (
      <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 p-8 rounded-card shadow-card">
        <h2 className="text-2xl font-bold text-foreground mb-4">
          {getGreeting()}! ☀️
        </h2>
        <p className="text-lg text-muted-foreground italic">
          "The best way to get started is to quit talking and begin doing."
        </p>
        <p className="text-sm text-muted-foreground mt-2">— Walt Disney</p>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 p-8 rounded-card shadow-card hover:shadow-card-hover transition-shadow duration-200">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left side: Quote content (2/3 width on large screens) */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            {getGreeting()}! ☀️
          </h2>
          <blockquote className="border-l-4 border-primary pl-4">
            <p className="text-lg text-foreground italic mb-2">
              "{quote.quote_text}"
            </p>
            {quote.author && (
              <footer className="text-sm text-muted-foreground">
                — {quote.author}
              </footer>
            )}
          </blockquote>
        </div>

        {/* Right side: Image placeholder (1/3 width on large screens) */}
        <div className="lg:col-span-1">
          {quote.image_url ? (
            <div className="relative h-48 lg:h-full w-full rounded-card overflow-hidden bg-muted">
              <img
                src={quote.image_url}
                alt="Daily inspiration"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="relative h-48 lg:h-full w-full rounded-card overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <span className="text-6xl">📸</span>
                <p className="text-sm mt-2">Photo memory space</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
