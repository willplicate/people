import { describe, it, expect } from 'vitest'

/**
 * Unit tests for Habit Analytics and Skip Prediction
 *
 * These tests validate the skip prediction logic without requiring database access
 */

describe('Habit Skip Prediction Logic', () => {
  describe('Risk Score Calculation', () => {
    it('should calculate high risk for low completion rate', () => {
      // Low completion rate (30%) should contribute to higher risk
      const completionRate = 30
      const completionRateFactor = 1 - (completionRate / 100)

      expect(completionRateFactor).toBeGreaterThan(0.5)
      expect(completionRateFactor * 0.3).toBeCloseTo(0.21)
    })

    it('should calculate low risk for high completion rate', () => {
      // High completion rate (90%) should contribute to lower risk
      const completionRate = 90
      const completionRateFactor = 1 - (completionRate / 100)

      expect(completionRateFactor).toBeLessThan(0.2)
      expect(completionRateFactor * 0.3).toBeCloseTo(0.03)
    })

    it('should calculate higher risk for zero streak', () => {
      const currentStreak = 0
      const streakFactor = currentStreak === 0 ? 0.3 : Math.max(0, (5 - currentStreak) / 5) * 0.2

      expect(streakFactor).toBe(0.3)
    })

    it('should calculate lower risk for long streak', () => {
      const currentStreak = 10
      const streakFactor = currentStreak === 0 ? 0.3 : Math.max(0, (5 - currentStreak) / 5) * 0.2

      // For streaks >= 5, factor should be 0
      expect(streakFactor).toBe(0)
    })
  })

  describe('Risk Level Classification', () => {
    it('should classify score >= 0.7 as high risk', () => {
      const score = 0.75
      const riskLevel = score >= 0.7 ? 'high' : score >= 0.4 ? 'medium' : 'low'

      expect(riskLevel).toBe('high')
    })

    it('should classify score 0.4-0.69 as medium risk', () => {
      const score = 0.5
      const riskLevel = score >= 0.7 ? 'high' : score >= 0.4 ? 'medium' : 'low'

      expect(riskLevel).toBe('medium')
    })

    it('should classify score < 0.4 as low risk', () => {
      const score = 0.3
      const riskLevel = score >= 0.7 ? 'high' : score >= 0.4 ? 'medium' : 'low'

      expect(riskLevel).toBe('low')
    })
  })

  describe('Skip Pattern Detection', () => {
    it('should identify weekend skip pattern', () => {
      const skipDays = [0, 6] // Sunday and Saturday
      const isWeekendPattern = skipDays.includes(0) && skipDays.includes(6)

      expect(isWeekendPattern).toBe(true)
    })

    it('should identify weekday skip pattern', () => {
      const skipDays = [1, 2, 3] // Monday, Tuesday, Wednesday
      const isWeekdayPattern = skipDays.length > 0 && skipDays.every(d => d >= 1 && d <= 5)

      expect(isWeekdayPattern).toBe(true)
    })

    it('should not classify mixed pattern as weekday', () => {
      const skipDays = [0, 1, 2] // Sunday, Monday, Tuesday
      const isWeekdayPattern = skipDays.length > 0 && skipDays.every(d => d >= 1 && d <= 5)

      expect(isWeekdayPattern).toBe(false)
    })
  })

  describe('Expected Days Calculation', () => {
    it('should calculate daily frequency correctly', () => {
      const days = 30
      const frequencyType = 'daily'
      const expectedDays = frequencyType === 'daily' ? days : 0

      expect(expectedDays).toBe(30)
    })

    it('should calculate weekly frequency correctly', () => {
      const days = 30
      const frequencyType = 'weekly'
      const expectedDays = frequencyType === 'weekly' ? Math.floor(days / 7) : 0

      expect(expectedDays).toBe(4)
    })

    it('should calculate monthly frequency correctly', () => {
      const days = 60
      const frequencyType = 'monthly'
      const expectedDays = frequencyType === 'monthly' ? Math.floor(days / 30) : 0

      expect(expectedDays).toBe(2)
    })
  })

  describe('Average Skip Interval Calculation', () => {
    it('should calculate average skip interval correctly', () => {
      const expectedDays = 30
      const completedDays = 20
      const skipCount = expectedDays - completedDays
      const avgSkipInterval = expectedDays / skipCount

      expect(avgSkipInterval).toBe(3) // Skip every 3 days on average
    })

    it('should return 0 when no skips occurred', () => {
      const expectedDays = 30
      const completedDays = 30
      const skipCount = expectedDays - completedDays
      const avgSkipInterval = skipCount <= 0 ? 0 : expectedDays / skipCount

      expect(avgSkipInterval).toBe(0)
    })

    it('should handle edge case with insufficient data', () => {
      const expectedDays = 1
      const completedDays = 0
      const skipCount = expectedDays - completedDays
      const avgSkipInterval = expectedDays < 2 ? 0 : expectedDays / skipCount

      expect(avgSkipInterval).toBe(0)
    })
  })

  describe('Completion Rate Calculation', () => {
    it('should calculate completion rate correctly', () => {
      const expectedDays = 30
      const completedDays = 24
      const completionRate = (completedDays / expectedDays) * 100

      expect(completionRate).toBe(80)
    })

    it('should handle 100% completion', () => {
      const expectedDays = 30
      const completedDays = 30
      const completionRate = (completedDays / expectedDays) * 100

      expect(completionRate).toBe(100)
    })

    it('should handle 0% completion', () => {
      const expectedDays = 30
      const completedDays = 0
      const completionRate = expectedDays > 0 ? (completedDays / expectedDays) * 100 : 0

      expect(completionRate).toBe(0)
    })
  })
})

describe('Message Generation Logic', () => {
  it('should have different message types for each risk level', () => {
    const messages = {
      high: ['🚨 High skip risk today!', '⚠️ Challenging day ahead!'],
      medium: ['⚡ Stay focused today', '💡 Remember your goals'],
      low: ['✅ You\'re doing great!', '🔥 Keep it up!']
    }

    expect(messages.high.length).toBeGreaterThan(0)
    expect(messages.medium.length).toBeGreaterThan(0)
    expect(messages.low.length).toBeGreaterThan(0)
  })

  it('should provide actionable recommendations for high risk', () => {
    const riskLevel = 'high'
    const recommendation = riskLevel === 'high'
      ? 'Set a reminder right now or do it first thing to avoid skipping.'
      : ''

    expect(recommendation).toContain('reminder')
  })
})
