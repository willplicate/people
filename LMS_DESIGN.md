# Learning Management System - Design Document

## Overview
A simple LMS for tracking your 20-week AI/ML Analyst training program.

---

## Page Structure

```
┌─────────────────────────────────────────────────────────┐
│                    Top Navigation                        │
├──────────┬──────────────────────────────────────────────┤
│          │                                               │
│  Week    │                                               │
│  Index   │           Main Content Area                   │
│          │                                               │
│  [ ]Intro│      (Shows: Intro, Week Content, or         │
│  [1]Week1│       Learning Session Tracker)              │
│  [2]Week2│                                               │
│  [3]Week3│                                               │
│  ...     │                                               │
│  [20]W20 │                                               │
│          │                                               │
└──────────┴──────────────────────────────────────────────┘
```

---

## Left Sidebar: Week Navigation

**Purpose**: Quick navigation between weeks

**Contents**:
- Link to "Intro/Overview" page
- Links to Week 1-20
- Visual indicators:
  - ✓ Completed weeks (green)
  - → Current week (highlighted)
  - ○ Not started (gray)
  - Progress bar per week

**Example**:
```
╔════════════════╗
║  📚 AI/ML Training  ║
╠════════════════╣
║ [📖] Introduction  ║
║                    ║
║ [✓] Week 1        ║
║ [✓] Week 2        ║
║ [→] Week 3  75%   ║  ← Currently viewing
║ [○] Week 4        ║
║ [○] Week 5        ║
║ ...               ║
║ [○] Week 20       ║
╚════════════════╝
```

---

## Page 1: Introduction/Overview

**URL**: `/learning` or `/learning/intro`

**Purpose**: Show program overview before diving into weeks

**Content**:
- Program name: "AI/ML Analyst Training"
- Role description: What an AI/ML Analyst does
- Program overview: What you'll learn
- Timeline: 20 weeks, start date, target end date
- Quick stats:
  - Weeks completed: 2/20
  - Total study time: 24 hours
  - Current streak: 5 days

**Action Button**: "Start Week 1" or "Continue to Week 3"

---

## Page 2: Week Content View

**URL**: `/learning/week/3`

**Purpose**: Display all content and topics for a specific week

**Layout**:

```
┌─────────────────────────────────────────────────┐
│  Week 3: Linear Regression                      │
│  ───────────────────────────────                │
│                                                  │
│  📋 Learning Objectives:                        │
│  □ Understand linear regression                 │
│  □ Build a regression model                     │
│  □ Evaluate model performance                   │
│                                                  │
│  📝 Topics:                                      │
│  ┌────────────────────────────────────┐        │
│  │ 1. What is Linear Regression?  ✓   │        │
│  │    (2 hours)                        │        │
│  └────────────────────────────────────┘        │
│                                                  │
│  ┌────────────────────────────────────┐        │
│  │ 2. Cost Functions              →   │  ← Currently studying
│  │    (3 hours)                        │        │
│  │    [Show Content] [Mark Complete]  │        │
│  └────────────────────────────────────┘        │
│                                                  │
│  ┌────────────────────────────────────┐        │
│  │ 3. Gradient Descent                │        │
│  │    (4 hours)                        │        │
│  └────────────────────────────────────┘        │
│                                                  │
│  📚 Resources:                                  │
│  🎥 Video: Intro to Linear Regression          │
│  📄 Article: Math Behind Regression            │
│  💻 Exercise: Build Your First Model           │
│                                                  │
│  📊 Your Progress This Week:                    │
│  • 2 sessions                                    │
│  • 3.5 hours studied                            │
│  • Avg engagement: 4.2/5                        │
│                                                  │
│  [+ Log Today's Study Session]                  │
└─────────────────────────────────────────────────┘
```

---

## Component: Learning Session Tracker

**Purpose**: Quick form to log study sessions

**When shown**:
- At bottom of each week page
- As a floating button available anywhere
- As a modal/sidebar

**Fields**:
```
┌──────────────────────────────────────┐
│  Log Study Session                   │
├──────────────────────────────────────┤
│  Date:     [2025-01-15]  ← Today     │
│                                       │
│  Duration: [90] minutes               │
│  OR                                   │
│  Start:    [09:00 AM]                │
│  End:      [10:30 AM]                │
│                                       │
│  Topic: (optional)                    │
│  [Dropdown: Cost Functions ▼]        │
│                                       │
│  How engaged were you?                │
│  ○ ○ ○ ● ○  (4/5)                   │
│                                       │
│  Notes:                               │
│  ┌───────────────────────────────────┐│
│  │Finally understood how cost        ││
│  │function works! The animation      ││
│  │helped a lot.                      ││
│  └───────────────────────────────────┘│
│                                       │
│  Tags: (optional)                     │
│  [breakthrough] [math] [+add]        │
│                                       │
│  [Cancel]           [Save Session]   │
└──────────────────────────────────────┘
```

**After saving**: Shows confirmation + updates week progress

---

## Data Flow

### Viewing Week Content
1. User clicks "Week 3" in sidebar
2. App fetches: `/api/learning/weeks/3`
3. Returns: Week data + Topics + Recent sessions
4. Renders: Week content page

### Logging a Session
1. User fills form: date, duration, notes
2. App sends POST: `/api/learning/sessions`
3. Database saves session
4. App refreshes: Week progress stats
5. Updates sidebar: Week completion percentage

---

## Database Queries We'll Need

### Get all weeks for sidebar
```sql
SELECT id, week_number, title
FROM learning_weeks
WHERE program_id = ?
ORDER BY week_number
```

### Get week with topics
```sql
-- Week info
SELECT * FROM learning_weeks WHERE id = ?

-- Topics for this week
SELECT * FROM learning_topics
WHERE week_id = ?
ORDER BY topic_order

-- Recent sessions for this week
SELECT * FROM learning_sessions
WHERE week_id = ?
ORDER BY session_date DESC
LIMIT 10
```

### Get week progress
```sql
-- Uses the view we created
SELECT * FROM week_progress_summary
WHERE program_id = ?
ORDER BY week_number
```

---

## Next Steps

1. ✅ Database schema ← DONE
2. ✅ TypeScript types ← DONE
3. Build UI components:
   - Week navigation sidebar
   - Intro/overview page
   - Week content page
   - Session tracker form
4. Add LMS routes
5. Connect to Supabase
6. Seed with your 20-week curriculum data

---

## Future Enhancements (Later)

- Analytics dashboard (study patterns, difficult topics)
- Spaced repetition reminders
- Progress tracking graphs
- Export study notes
- Mobile view
- Keyboard shortcuts for navigation
