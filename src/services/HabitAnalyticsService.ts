import { supabase, TABLES } from '@/lib/supabase'
import { Habit, HabitAnalytics, HabitCompletion, SkipPrediction } from '@/types/database'

/**
 * Service for analyzing habit completion patterns and predicting skip likelihood
 */
export class HabitAnalyticsService {
  /**
   * Analyze completion history and detect skip patterns
   */
  static async analyzeHabit(habitId: string, lookbackDays: number = 30): Promise<HabitAnalytics | null> {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - lookbackDays)

    // Get the habit details
    const { data: habit, error: habitError } = await supabase
      .from(TABLES.HABITS)
      .select()
      .eq('id', habitId)
      .single()

    if (habitError || !habit) {
      throw new Error(`Failed to get habit: ${habitError?.message}`)
    }

    // Get completion history
    const { data: completions, error: completionError } = await supabase
      .from(TABLES.HABIT_COMPLETIONS)
      .select('completed_date')
      .eq('habit_id', habitId)
      .gte('completed_date', startDate.toISOString().split('T')[0])
      .lte('completed_date', endDate.toISOString().split('T')[0])
      .order('completed_date', { ascending: true })

    if (completionError) {
      throw new Error(`Failed to get completions: ${completionError.message}`)
    }

    // Calculate expected days based on frequency
    const expectedDays = this.calculateExpectedDays(habit, startDate, endDate)
    const completedDays = completions?.length || 0
    const completionRate = expectedDays > 0 ? (completedDays / expectedDays) * 100 : 0

    // Calculate streaks
    const { currentStreak, longestStreak } = this.calculateStreaks(completions || [], habit)

    // Detect skip patterns
    const skipPattern = this.detectSkipPattern(completions || [], habit, startDate, endDate)

    // Calculate average skip interval
    const avgSkipInterval = this.calculateAverageSkipInterval(completions || [], expectedDays)

    // Predict next skip
    const nextSkipPrediction = this.predictNextSkip(
      completions || [],
      skipPattern,
      avgSkipInterval,
      habit
    )

    // Create analytics record
    const analyticsData = {
      habit_id: habitId,
      analysis_date: endDate.toISOString().split('T')[0],
      total_expected_days: expectedDays,
      total_completed_days: completedDays,
      completion_rate: Math.round(completionRate * 100) / 100,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      skip_pattern_detected: skipPattern.pattern,
      skip_days: skipPattern.skipDays,
      average_skip_interval: avgSkipInterval,
      next_predicted_skip_date: nextSkipPrediction.date,
      prediction_confidence: nextSkipPrediction.confidence
    }

    // Save analytics to database
    const { data: analytics, error: analyticsError } = await supabase
      .from('personal_habit_analytics')
      .insert(analyticsData)
      .select()
      .single()

    if (analyticsError) {
      console.error('Failed to save analytics:', analyticsError)
      // Return calculated data even if save fails
      return {
        id: '',
        ...analyticsData,
        created_at: new Date().toISOString()
      } as HabitAnalytics
    }

    return analytics
  }

  /**
   * Get skip prediction for today
   */
  static async getSkipPrediction(habitId: string, habit: Habit): Promise<SkipPrediction> {
    const today = new Date()
    const lookbackDays = 30

    // Get recent analytics
    const { data: recentAnalytics } = await supabase
      .from('personal_habit_analytics')
      .select()
      .eq('habit_id', habitId)
      .order('analysis_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    // If no recent analytics or analytics are old, generate new ones
    let analytics = recentAnalytics
    if (!analytics || this.isAnalyticsStale(analytics.analysis_date)) {
      analytics = await this.analyzeHabit(habitId, lookbackDays)
    }

    if (!analytics) {
      return this.getDefaultPrediction()
    }

    // Calculate risk score based on multiple factors
    const riskScore = this.calculateRiskScore(analytics, habit, today)

    // Determine risk level
    const riskLevel = this.getRiskLevel(riskScore)

    // Generate appropriate message
    const message = this.generateMessage(riskLevel, analytics, habit)

    // Generate recommendation
    const recommendation = this.generateRecommendation(riskLevel, analytics)

    return {
      risk_score: riskScore,
      risk_level: riskLevel,
      message,
      pattern: analytics.skip_pattern_detected || undefined,
      confidence: analytics.prediction_confidence || 0,
      recommendation
    }
  }

  /**
   * Calculate expected days based on habit frequency
   */
  private static calculateExpectedDays(habit: Habit, startDate: Date, endDate: Date): number {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

    switch (habit.frequency_type) {
      case 'daily':
        return days
      case 'weekly':
        return Math.floor(days / 7)
      case 'monthly':
        return Math.floor(days / 30)
      case 'specific_days':
        if (!habit.frequency_days || habit.frequency_days.length === 0) return 0
        // Count how many times the specific days occur in the range
        let count = 0
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          if (habit.frequency_days.includes(d.getDay())) {
            count++
          }
        }
        return count
      default:
        return days
    }
  }

  /**
   * Calculate current and longest streaks
   */
  private static calculateStreaks(completions: Array<{ completed_date: string }>, habit: Habit): {
    currentStreak: number
    longestStreak: number
  } {
    if (completions.length === 0) {
      return { currentStreak: 0, longestStreak: 0 }
    }

    const sortedDates = completions.map(c => new Date(c.completed_date)).sort((a, b) => b.getTime() - a.getTime())

    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 1

    // Check if today or yesterday is completed (for current streak)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const lastCompletion = sortedDates[0]
    lastCompletion.setHours(0, 0, 0, 0)

    if (lastCompletion.getTime() === today.getTime() || lastCompletion.getTime() === yesterday.getTime()) {
      currentStreak = 1

      // Count consecutive days backwards
      for (let i = 1; i < sortedDates.length; i++) {
        const current = new Date(sortedDates[i])
        current.setHours(0, 0, 0, 0)
        const previous = new Date(sortedDates[i - 1])
        previous.setHours(0, 0, 0, 0)

        const daysDiff = Math.round((previous.getTime() - current.getTime()) / (1000 * 60 * 60 * 24))

        if (daysDiff === 1) {
          currentStreak++
        } else {
          break
        }
      }
    }

    // Calculate longest streak
    for (let i = 1; i < sortedDates.length; i++) {
      const current = new Date(sortedDates[i])
      current.setHours(0, 0, 0, 0)
      const previous = new Date(sortedDates[i - 1])
      previous.setHours(0, 0, 0, 0)

      const daysDiff = Math.round((previous.getTime() - current.getTime()) / (1000 * 60 * 60 * 24))

      if (daysDiff === 1) {
        tempStreak++
      } else {
        longestStreak = Math.max(longestStreak, tempStreak)
        tempStreak = 1
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak)

    return { currentStreak, longestStreak }
  }

  /**
   * Detect skip patterns (which days are commonly skipped)
   */
  private static detectSkipPattern(
    completions: Array<{ completed_date: string }>,
    habit: Habit,
    startDate: Date,
    endDate: Date
  ): { pattern: string; skipDays: number[] } {
    if (completions.length < 7) {
      return { pattern: 'insufficient_data', skipDays: [] }
    }

    const completedDates = new Set(completions.map(c => c.completed_date))
    const skipsByDay: number[] = [0, 0, 0, 0, 0, 0, 0] // Sunday to Saturday

    // Count skips by day of week
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateString = d.toISOString().split('T')[0]
      const dayOfWeek = d.getDay()

      // Check if this day should have been completed based on frequency
      const shouldComplete = this.shouldCompleteOnDay(habit, dayOfWeek)

      if (shouldComplete && !completedDates.has(dateString)) {
        skipsByDay[dayOfWeek]++
      }
    }

    // Find days with high skip rates
    const totalSkips = skipsByDay.reduce((a, b) => a + b, 0)
    if (totalSkips === 0) {
      return { pattern: 'none', skipDays: [] }
    }

    const skipDays = skipsByDay
      .map((skips, day) => ({ day, skips }))
      .filter(({ skips }) => skips / totalSkips > 0.3) // Days with >30% of skips
      .map(({ day }) => day)

    // Determine pattern type
    let pattern = 'random'
    if (skipDays.includes(0) && skipDays.includes(6)) {
      pattern = 'weekend_skip'
    } else if (skipDays.length > 0 && skipDays.every(d => d >= 1 && d <= 5)) {
      pattern = 'weekday_skip'
    } else if (skipDays.length === 1) {
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      pattern = `${dayNames[skipDays[0]]}_skip`
    } else if (skipDays.length > 1) {
      pattern = 'multi_day_pattern'
    }

    return { pattern, skipDays }
  }

  /**
   * Check if habit should be completed on a given day
   */
  private static shouldCompleteOnDay(habit: Habit, dayOfWeek: number): boolean {
    switch (habit.frequency_type) {
      case 'daily':
        return true
      case 'specific_days':
        return habit.frequency_days?.includes(dayOfWeek) || false
      case 'weekly':
      case 'monthly':
        return true // For these, we expect completion at least once in the period
      default:
        return false
    }
  }

  /**
   * Calculate average interval between skips
   */
  private static calculateAverageSkipInterval(
    completions: Array<{ completed_date: string }>,
    expectedDays: number
  ): number {
    if (completions.length < 2 || expectedDays < 2) return 0

    const skipCount = expectedDays - completions.length
    if (skipCount <= 0) return 0

    return expectedDays / skipCount
  }

  /**
   * Predict next likely skip date
   */
  private static predictNextSkip(
    completions: Array<{ completed_date: string }>,
    skipPattern: { pattern: string; skipDays: number[] },
    avgSkipInterval: number,
    habit: Habit
  ): { date: string | null; confidence: number } {
    if (skipPattern.pattern === 'insufficient_data') {
      return { date: null, confidence: 0 }
    }

    const today = new Date()

    // If we have a day-specific pattern, predict the next occurrence
    if (skipPattern.skipDays.length > 0) {
      const todayDayOfWeek = today.getDay()
      const nextSkipDay = skipPattern.skipDays.find(day => day > todayDayOfWeek) || skipPattern.skipDays[0]

      const daysUntilSkip = nextSkipDay > todayDayOfWeek
        ? nextSkipDay - todayDayOfWeek
        : 7 - todayDayOfWeek + nextSkipDay

      const nextSkipDate = new Date(today)
      nextSkipDate.setDate(today.getDate() + daysUntilSkip)

      return {
        date: nextSkipDate.toISOString().split('T')[0],
        confidence: 0.7
      }
    }

    // Use average skip interval if no specific pattern
    if (avgSkipInterval > 0) {
      const nextSkipDate = new Date(today)
      nextSkipDate.setDate(today.getDate() + Math.round(avgSkipInterval))

      return {
        date: nextSkipDate.toISOString().split('T')[0],
        confidence: 0.4
      }
    }

    return { date: null, confidence: 0 }
  }

  /**
   * Calculate risk score for today
   */
  private static calculateRiskScore(analytics: HabitAnalytics, habit: Habit, today: Date): number {
    let riskScore = 0

    // Factor 1: Completion rate (lower = higher risk)
    const completionRateFactor = 1 - (analytics.completion_rate / 100)
    riskScore += completionRateFactor * 0.3

    // Factor 2: Current streak (no streak = higher risk)
    const streakFactor = analytics.current_streak === 0 ? 0.3 : Math.max(0, (5 - analytics.current_streak) / 5) * 0.2
    riskScore += streakFactor

    // Factor 3: Day-specific pattern
    const todayDayOfWeek = today.getDay()
    if (analytics.skip_days?.includes(todayDayOfWeek)) {
      riskScore += 0.4
    }

    // Factor 4: Predicted skip date proximity
    if (analytics.next_predicted_skip_date) {
      const predictedDate = new Date(analytics.next_predicted_skip_date)
      const todayDate = new Date(today)
      todayDate.setHours(0, 0, 0, 0)
      predictedDate.setHours(0, 0, 0, 0)

      if (predictedDate.getTime() === todayDate.getTime()) {
        riskScore += 0.3
      } else {
        const daysUntil = Math.abs((predictedDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24))
        if (daysUntil <= 3) {
          riskScore += 0.15
        }
      }
    }

    return Math.min(1, Math.max(0, riskScore))
  }

  /**
   * Determine risk level from score
   */
  private static getRiskLevel(score: number): 'low' | 'medium' | 'high' {
    if (score >= 0.7) return 'high'
    if (score >= 0.4) return 'medium'
    return 'low'
  }

  /**
   * Generate message based on risk level
   */
  private static generateMessage(riskLevel: 'low' | 'medium' | 'high', analytics: HabitAnalytics, habit: Habit): string {
    const messages = {
      high: [
        "🚨 High skip risk today! Don't break your momentum.",
        "⚠️ Today's a challenging day - but you've got this!",
        "🎯 Pattern detected: You often skip today. Prove yourself wrong!",
        "💪 This is your toughest day. Show up anyway!"
      ],
      medium: [
        "⚡ You might be tempted to skip today. Stay strong!",
        "🤔 Today could go either way. Make the right choice!",
        "💡 Remember why you started this habit.",
        "🌟 Keep your streak alive!"
      ],
      low: [
        "✅ You're on track! Keep the momentum going.",
        `🔥 ${analytics.current_streak} day streak - amazing!`,
        "😊 You've got this habit down!",
        "🎉 Another day, another win incoming!"
      ]
    }

    const messageList = messages[riskLevel]
    return messageList[Math.floor(Math.random() * messageList.length)]
  }

  /**
   * Generate recommendation based on risk
   */
  private static generateRecommendation(riskLevel: 'low' | 'medium' | 'high', analytics: HabitAnalytics): string {
    if (riskLevel === 'high') {
      return "Set a reminder right now or do it first thing to avoid skipping."
    } else if (riskLevel === 'medium') {
      return "Try to complete this earlier in the day while motivation is high."
    } else {
      return `Current streak: ${analytics.current_streak} days. Can you beat your record of ${analytics.longest_streak}?`
    }
  }

  /**
   * Check if analytics are stale (older than 1 day)
   */
  private static isAnalyticsStale(analysisDate: string): boolean {
    const analyticDate = new Date(analysisDate)
    const today = new Date()
    const daysDiff = (today.getTime() - analyticDate.getTime()) / (1000 * 60 * 60 * 24)
    return daysDiff > 1
  }

  /**
   * Get default prediction when no data available
   */
  private static getDefaultPrediction(): SkipPrediction {
    return {
      risk_score: 0.5,
      risk_level: 'medium',
      message: "📊 Building your habit history. Complete today to start tracking patterns!",
      confidence: 0,
      recommendation: "Complete this habit consistently for 7+ days to get personalized insights."
    }
  }
}
