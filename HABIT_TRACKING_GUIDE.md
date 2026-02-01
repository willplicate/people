# Habit Tracking System - Complete Guide

## Overview

This system helps you build discipline by tracking habits and predicting when you're likely to skip or give up.

## Two Types of Habits

### 1. Simple Habits (Checkbox Mode)
**Examples**: Floss teeth, Take vitamins, Meditate for 10 minutes

**What you track**: Just whether you did it or not (✓ or ✗)

**Use case**: Habits where completion is binary - you either did it or didn't


### 2. Learning Habits (Full Tracking Mode)
**Examples**: Learn Spanish, Practice sailing, Study math, Learn to code

**What you track**:
- ✓ Whether you did it
- ⏱️ How long you studied (duration)
- 🎯 How engaged you were (1-5 scale)
- 📚 What you studied (subject/topic)
- 📝 Reflection notes
- 😊 Your mood during the session

**Use case**: Skills you're trying to master where quality matters as much as consistency

---

## How Skip Prediction Works

### For ALL Habits (Simple + Learning)

**Goal**: Predict if you'll skip today

**What we analyze**:
1. **Completion Rate**: Do you usually complete this habit? (60% completion = higher skip risk)
2. **Current Streak**: Are you on a roll? (0-day streak = higher risk)
3. **Day Patterns**: Do you always skip on certain days? (e.g., skip every Sunday)
4. **Recent Skips**: How long since your last skip?

**Risk Levels**:
- 🟢 **Low Risk** (score < 0.4): You're on track!
- 🟡 **Medium Risk** (0.4-0.69): Stay focused today
- 🔴 **High Risk** (≥ 0.7): Warning! High chance of skipping

**Example Warnings**:
```
🚨 High skip risk today! Don't break your momentum.
Pattern detected: You often skip on Sundays. Prove yourself wrong!
```

---

## How Learning Habit Analytics Work (The "ML" Part)

### What Makes This Different from Skip Prediction?

**Skip Prediction**: "Will you skip today?"
**Learning Analytics**: "Are you about to give up entirely?"

### Three Types of Risk

#### 1. 🔥 Burnout Risk
**Question**: Are you studying too much without breaks?

**Warning signs**:
- Studying >4 hours per day consistently
- No rest days in 7+ days
- Engagement declining despite high study time
- Mood shifting to "tired" or "frustrated"

**Calculation** (simplified):
```javascript
// Calculate average hours per day
avg_hours_per_day = total_minutes_last_7_days / (7 * 60)

// High study time + declining engagement = burnout risk
if (avg_hours_per_day > 4 && engagement_trend === 'declining') {
  burnout_risk_score = 0.8 // HIGH RISK
}
```

**Why this matters**: Burnout leads to quitting. Rest is essential for learning.

---

#### 2. 😴 Disengagement Risk
**Question**: Are you losing interest in this habit?

**Warning signs**:
- Engagement dropping (was 4-5, now 2-3)
- Sessions getting shorter
- Less frequent sessions
- Mood shifting to "frustrated" or "neutral"

**Calculation**:
```javascript
// Compare recent engagement to past engagement
engagement_change = avg_engagement_last_7_days - avg_engagement_last_30_days

// Declining engagement = disengagement risk
if (engagement_change < -1.0) { // Dropped more than 1 point
  disengagement_risk_score = 0.7 // HIGH RISK
}

// Also factor in session length decline
if (recent_session_duration < 50% of previous_avg_duration) {
  disengagement_risk_score += 0.2
}
```

**Why this matters**: Disengagement is the #1 reason people quit learning habits.

---

#### 3. 🚪 Quit Risk (Overall)
**Question**: Are you about to give up this habit completely?

**Warning signs**:
- Long gaps (5+ days without studying)
- Critical engagement levels (<2.0 average)
- Both burnout AND disengagement signals
- Combination of skip patterns + declining metrics

**Calculation** (combines everything):
```javascript
quit_risk_score = 0

// Factor 1: Disengagement (40% weight)
quit_risk_score += disengagement_risk_score * 0.4

// Factor 2: Long gaps (30% weight)
if (longest_gap_days > 5) {
  quit_risk_score += 0.3
}

// Factor 3: Critical engagement (20% weight)
if (avg_engagement_last_7_days < 2.0) {
  quit_risk_score += 0.2
}

// Factor 4: Burnout (10% weight)
quit_risk_score += burnout_risk_score * 0.1

// Cap at 1.0
quit_risk_score = Math.min(1.0, quit_risk_score)
```

**Why this matters**: This is the ultimate metric - will you stick with this or quit?

---

## Pattern Detection Examples

### Time-of-Day Patterns
**Goal**: Find when you study best

**How it works**:
1. Group all sessions by time of day (morning/afternoon/evening/night)
2. Calculate average engagement for each time period
3. Identify the period with highest engagement

**Example**:
```
Morning (6am-12pm):   avg engagement = 4.2
Afternoon (12pm-6pm): avg engagement = 3.1
Evening (6pm-10pm):   avg engagement = 4.8  ← BEST TIME
Night (10pm-6am):     avg engagement = 2.5
```

**Recommendation**: "You study best in the evening. Try to schedule sessions between 6-10pm."

---

### Day-of-Week Patterns
**Goal**: Find which days you're most productive

**How it works**:
1. Group sessions by day of week (0=Sunday, 6=Saturday)
2. Calculate average engagement for each day
3. Find the day with highest engagement

**Example**:
```
Sunday:    2.8
Monday:    3.5
Tuesday:   4.2  ← BEST DAY
Wednesday: 3.9
Thursday:  3.7
Friday:    3.0
Saturday:  2.5
```

**Warning**: "You struggle on weekends. Consider lighter sessions on Sat/Sun."

---

### Engagement Trends (Moving Averages)

**What is a moving average?**
- Instead of looking at single days (too noisy), we average across a window
- 7-day average = average of last 7 days
- 30-day average = average of last 30 days

**Why we need it**:
- Single day: "I got a 2 today" - could be random bad day
- 7-day average dropping: "My average was 4.5, now it's 3.0" - clear trend!

**How we detect trends**:
```javascript
// Calculate moving averages
const avg_7_days = sum(last_7_engagement_scores) / 7
const avg_30_days = sum(last_30_engagement_scores) / 30

// Determine trend
if (avg_7_days > avg_30_days + 0.5) {
  engagement_trend = 'improving'  // Recent week better than usual
} else if (avg_7_days < avg_30_days - 0.5) {
  engagement_trend = 'declining'  // Recent week worse than usual
} else {
  engagement_trend = 'stable'     // No significant change
}

// Critical flag
if (avg_7_days < 2.0) {
  engagement_trend = 'critical'  // Emergency: very low engagement
}
```

---

## Database Schema Summary

### Tables Created

1. **personal_habits** - The habits themselves
   - Stores: name, frequency, tracking settings
   - New fields: `full_tracking_enabled`, `target_duration_minutes`, etc.

2. **personal_habit_completions** - Records of completing habits
   - Stores: completion date, duration, engagement, notes
   - New fields: `engagement_level`, `duration_minutes`, `mood`, etc.

3. **personal_habit_analytics** - Basic skip predictions (for all habits)
   - Stores: completion rate, streaks, skip patterns
   - Calculates: skip risk score

4. **personal_study_analytics** - Advanced learning predictions
   - Stores: engagement trends, burnout metrics, quit risk
   - Calculates: disengagement risk, burnout risk, quit risk

---

## Next Steps (What We'll Build)

### 1. Enhanced Habit Form
- Toggle for "Full Tracking Mode"
- Fields for target duration, default subject
- Visual preview of what tracking will look like

### 2. Study Session Logger
- Start/stop timer
- Engagement slider (1-5)
- Subject/topic selector
- Quick notes field
- Mood selector

### 3. Analytics Dashboard
- Charts showing engagement over time
- Risk warnings (burnout, disengagement, quit)
- Personalized recommendations
- Best time/day insights

### 4. Prediction Service
- Calculate all risk scores
- Generate warnings and recommendations
- Update analytics tables daily

---

## FAQ

**Q: Why track engagement instead of just time?**
A: You can study for 3 hours while distracted (low learning). Or 45 minutes with deep focus (high learning). Engagement quality matters more than quantity.

**Q: What's the difference between skip risk and quit risk?**
A: Skip risk = "Will you skip TODAY?" (short-term). Quit risk = "Will you GIVE UP ENTIRELY?" (long-term).

**Q: Do I need to use full tracking for all habits?**
A: No! Use it for learning habits where you want deep insights. Simple habits (flossing, vitamins) just need checkboxes.

**Q: How much data is needed before predictions work?**
A: Skip prediction: 7+ days. Learning analytics: 14+ days for engagement trends, 30+ days for reliable patterns.

**Q: Is this actually machine learning?**
A: It uses ML *concepts* (pattern detection, risk scoring, trend analysis) but with hand-crafted rules rather than trained models. Think of it as "ML-inspired" prediction logic.
