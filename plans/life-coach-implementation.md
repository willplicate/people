# Life Coach Implementation Plan

**Date:** January 2, 2026
**Status:** Building MVP

---

## Overview

Building a conversational life coach system integrated into the Personal CRM dashboard. This is **NOT just habit tracking** - it's psychological coaching for mindset patterns, anxiety, and behavioral change.

**Core Philosophy:**
- Context files (LIFE_COACH.md + LIFE_NOW.md) store identity and patterns
- Database stores quantifiable data (habit completions, chat history)
- AI sees full context but only recent data to stay within token limits
- Real coaching happens in conversation, not checkboxes

---

## Context Files (Already Created)

### `/LIFE_COACH.md` - Static Framework
William's identity, 2026 theme ("Year of Following Through"), and psychological patterns:

**Habits to Track:**
- Monday trading execution (turtle strategy)
- Social sobriety (monthly goal)
- Daily Spanish practice (B2 exam prep)
- Finish one thing before starting another
- Admin Friday (wedding/tax/bureaucracy)
- Swimming consistency (2x weekly)

**Mindset Patterns for Coaching:**
1. **Imposter Syndrome** - "The Fraud Feeling"
   - Pattern: Feels like fraud despite constant compliments
   - Coaching: Evidence-based, gentle but relentless

2. **Procrastination & Avoidance** - "The Admin Black Hole"
   - Pattern: Wedding nightmares, catastrophizing venue responses
   - Coaching: Reality checks, action-oriented

3. **The Starter's Curse** - "Excitement → Difficulty → Abandon"
   - Pattern: Excellent at beginnings, terrible at middles
   - Coaching: Tough love, commitment enforcement

4. **Substance-Fueled Social Performance**
   - Pattern: Uses alcohol/weed to feel interesting
   - Coaching: Evidence-based, challenge assumptions

5. **Rumination & Catastrophizing**
   - Pattern: Post-party worry, wedding venue anxiety
   - Coaching: Interrupt loop, reality vs. fear

6. **Trading Discipline** - "Boredom Seeking Entertainment"
   - Pattern: Deviates from turtle strategy when bored
   - Coaching: NO MERCY. Every deviation costs money.

**Coaching Style:**
- Habits: Data-driven with tough love
- Mindset: Direct but kind
- Trading: No mercy, challenge hard
- Imposter syndrome: Gentle but relentless evidence

---

### `/LIFE_NOW.md` - Dynamic State
Updated weekly with recent patterns, wins, struggles, and memory log.

**Current Focus (Week of Jan 1):**
- Wedding venue confirmation
- Spanish B2 practice
- Trading: Monday turtle execution

**Recent Patterns:**
- Catastrophizing wedding venues (just holiday delays)
- Sauna guy incident (both stuck in same loop)
- Trading boredom = risk of drift
- "Excellent at beginnings, terrible at middles" is biggest liability

---

## Database Schema

```sql
-- Habits (quantifiable behaviors)
CREATE TABLE life_habits (
  id UUID PRIMARY KEY,
  user_id UUID,
  name TEXT, -- "Monday trading execution"
  type VARCHAR(20), -- 'cultivate' | 'eliminate' | 'limit'
  frequency VARCHAR(20), -- 'daily' | 'weekly' | 'monthly'
  target_count INTEGER, -- For "max 2x" type limits
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Daily habit logs (checkbox data)
CREATE TABLE life_habit_logs (
  id UUID PRIMARY KEY,
  habit_id UUID REFERENCES life_habits(id),
  log_date DATE NOT NULL,
  completed BOOLEAN,
  count INTEGER, -- For countable habits
  notes TEXT, -- "Skipped because stressed"
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(habit_id, log_date)
);

-- Coaching chat messages
CREATE TABLE life_coach_messages (
  id UUID PRIMARY KEY,
  user_id UUID,
  message_date DATE,
  timestamp TIMESTAMP DEFAULT NOW(),
  role VARCHAR(10), -- 'user' | 'assistant'
  content TEXT,
  context_type VARCHAR(20), -- 'morning' | 'anxiety' | 'trading' | 'reflection'
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI-spotted insights (auto-generated)
CREATE TABLE life_insights (
  id UUID PRIMARY KEY,
  user_id UUID,
  insight_date DATE,
  pattern_type VARCHAR(30), -- 'imposter' | 'catastrophizing' | 'trading_drift'
  title TEXT,
  description TEXT,
  evidence TEXT[], -- References to specific messages
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Architecture

### Context Window Strategy

When user chats with coach, AI receives:

```
SYSTEM PROMPT:
--------------
You are William's life coach. Read his framework carefully.

[Full contents of LIFE_COACH.md]

CURRENT STATE:
--------------
[Full contents of LIFE_NOW.md]

HABIT STATS (Last 7 Days):
--------------------------
Monday trading: ✓ (1/1) - 1 week streak
Social sobriety: Event on Dec 28 (used alcohol)
Spanish practice: ✓✓✓✗✗✓✓ (5/7)
Admin Friday: ✓ (1/1)
Swimming: ✓✗ (1/2 this week)

TODAY'S CONVERSATION:
---------------------
[Only today's messages, not full history]
```

**Token estimate:** ~3-4K tokens (well within Claude's limits)

---

## Components

### 1. `LifeCoachChat.tsx`
Main coaching interface

**Features:**
- Morning check-in prompt
- Conversational chat with Claude
- Reads LIFE_COACH.md + LIFE_NOW.md for context
- "Quick Check-In" buttons:
  - 😰 Feeling anxious
  - 📱 Compulsive checking
  - 🔄 Ruminating again
  - 📊 Trading question
  - 💬 Just want to talk
- Real-time responses
- Chat history for today only

**Props:**
```tsx
interface LifeCoachChatProps {
  userId: string
}
```

---

### 2. `HabitTracker.tsx`
Daily habit checkboxes

**Features:**
- List of habits from database
- Check/uncheck for today
- Shows current streak
- Visual feedback (🔥 for streaks)
- Separate sections:
  - Daily habits (Spanish, Admin if Friday)
  - Weekly habits (Monday trading, Swimming count)
  - Monthly habits (Social sobriety events)

**Props:**
```tsx
interface HabitTrackerProps {
  habits: LifeHabit[]
  onToggle: (habitId: string, completed: boolean) => void
  onCount: (habitId: string, count: number) => void
}
```

---

### 3. Dashboard Integration
Add to `/src/app/page.tsx` after WelcomeSection:

```tsx
<WelcomeSection />
<LifeCoachSection />  {/* NEW */}
<DailyContactReminders />
<UrgentTasks />
...
```

---

## API Routes

### `POST /api/life-coach/chat`
Send message to Claude with full context

**Request:**
```json
{
  "message": "I'm catastrophizing about the wedding venue again",
  "contextType": "anxiety"
}
```

**Response:**
```json
{
  "role": "assistant",
  "content": "You're catastrophizing again. Let's reality-check: It's January 2nd. Venues were closed for holidays. What's the actual evidence they don't want you as clients?",
  "timestamp": "2026-01-02T10:30:00Z"
}
```

**Implementation:**
1. Read LIFE_COACH.md + LIFE_NOW.md from filesystem
2. Fetch last 7 days of habit stats from database
3. Fetch today's chat history
4. Build system prompt with all context
5. Send to Claude API
6. Save response to database
7. Return to frontend

---

### `GET /api/life-coach/habits`
Get all habits and today's status

**Response:**
```json
{
  "habits": [
    {
      "id": "uuid",
      "name": "Monday trading execution",
      "frequency": "weekly",
      "currentStreak": 1,
      "todayCompleted": false
    },
    ...
  ]
}
```

---

### `POST /api/life-coach/habits/log`
Log habit completion

**Request:**
```json
{
  "habitId": "uuid",
  "date": "2026-01-02",
  "completed": true,
  "notes": "Executed turtle strategy, $10 OTM, VIX 16"
}
```

---

## UI Layout

### Desktop View
```
┌─────────────────────────────────────────────────────┐
│ Life Coach                                           │
├──────────────────────────┬──────────────────────────┤
│                          │                          │
│  Chat Interface          │  Today's Habits          │
│  (left 60%)              │  (right 40%)             │
│                          │                          │
│  💬 Morning check-in     │  Daily:                  │
│  🤖 AI responses         │  ☐ Spanish 15min         │
│                          │  ☐ Admin (Friday only)   │
│  Quick Check-Ins:        │                          │
│  [😰 Anxious]           │  Weekly:                 │
│  [🔄 Ruminating]        │  ☐ Monday trading        │
│  [📊 Trading]           │  Swimming: 1/2 this week │
│                          │                          │
│  [Type message...]       │  Monthly:                │
│                          │  Next event: Jan 15      │
└──────────────────────────┴──────────────────────────┘
```

### Mobile View
```
┌─────────────────────────┐
│ Life Coach              │
├─────────────────────────┤
│ Today's Habits          │
│ ☐ Spanish 15min         │
│ ☐ Monday trading        │
│                         │
│ [Expand Chat]           │
└─────────────────────────┘

Tap to expand full chat interface
```

---

## Example Coaching Interactions

### Morning Check-In (Imposter Syndrome)
```
You: "Going to sauna later. Already anxious about it."

Coach: "Sauna anxiety. Let's name the pattern: You're afraid someone
attractive will show interest and you'll freeze because your brain says
'they've made a mistake.'

But remember the guy who was staring at you last time? You said he was
probably stuck in the same loop. What if that happens again today?

Someone has to move first. What would you tell Jucas if he was in
your position?"
```

---

### Catastrophizing (Wedding Venue)
```
You: "Venue still hasn't responded. I'm having nightmares about this."

Coach: "You're catastrophizing again. Reality check:

1. It's January 2nd. They were closed for holidays.
2. What's the actual evidence they don't want you as clients?
3. 'Not responding during Christmas' ≠ 'Don't want gay wedding'

Your brain is inventing a narrative. What CAN you do right now?
Follow-up email? Look at backup venues? Talk to Jucas about the stress?"
```

---

### Trading Discipline (Strategy Drift)
```
You: "Thinking about trying bull spreads instead of turtle. More upside."

Coach: "STOP. This is strategy drift. You're doing it again.

The playbook says: Execute turtle every Monday. What phase are we in?
What does VIX say? What strike does the system call for?

Show me the math that beats turtle. Because I have the 2025 data:
- Every deviation cost money (Google: $48k)
- Turtle works when you execute systematically
- Boredom = profits. Complexity = losses.

Are you following the system or your gut? Be honest."
```

---

### Post-Party Rumination
```
You: "Went to party last night. Keep replaying what I said. Think I
talked too much about trading."

Coach: "Post-party rumination. Pattern recognized.

Did anyone actually say you talked too much?"

You: "No, but—"

Coach: "No. That's the answer. No one said it.

You're replaying a look you THINK you saw and building a story around it.

Check LIFE_NOW: This happens after EVERY social event. 100% of the time.
That's your anxiety loop, not reality.

What ACTUALLY happened? You went, had conversations, came home. The rest
is your brain writing fiction.

Redirect: What did you enjoy about the party?"
```

---

## Implementation Phases

### Phase 1: Database + Services (TODAY)
- [x] Move LIFE_COACH.md and LIFE_NOW.md to root
- [ ] Create database schema (SQL migration)
- [ ] Create `LifeCoachService.ts` (habit CRUD, chat save/load)
- [ ] Create API routes (`/api/life-coach/chat`, `/api/life-coach/habits`)
- [ ] Test Claude API with context files

### Phase 2: UI Components (TODAY)
- [ ] Build `LifeCoachChat.tsx`
- [ ] Build `HabitTracker.tsx`
- [ ] Build `LifeCoachSection.tsx` (container)
- [ ] Add to dashboard

### Phase 3: Polish (TODAY/TOMORROW)
- [ ] Add "Quick Check-In" buttons
- [ ] Add streak celebrations (🔥)
- [ ] Add evening reflection prompt (optional)
- [ ] Mobile responsive layout
- [ ] Loading states and error handling

### Phase 4: Iteration (NEXT WEEK)
- [ ] After 1 week, review chat patterns
- [ ] Update LIFE_NOW.md with AI-spotted patterns
- [ ] Add insights view (patterns over time)
- [ ] Consider auto-updating LIFE_NOW.md weekly

---

## Success Criteria

**Week 1:**
- ✅ User can chat with coach about mindset patterns
- ✅ AI recognizes and references specific patterns from LIFE_COACH.md
- ✅ Habit tracking works and shows streaks
- ✅ Coaching style matches "what helps" guidance

**Week 2-4:**
- ✅ AI spots patterns across multiple conversations
- ✅ Catastrophizing gets interrupted with reality checks
- ✅ Trading discipline coaching prevents deviations
- ✅ Imposter syndrome gets gentle evidence-based challenges
- ✅ User updates LIFE_NOW.md with new insights

**Long-term:**
- Become tool for actual behavior change (not just tracking)
- Build trust through consistent, accurate pattern recognition
- Help William follow through (Year of Following Through theme)

---

## Technical Notes

- **Token management:** Full context files + 7 days stats + today's chat ≈ 3-4K tokens (manageable)
- **File reading:** API route reads .md files from filesystem on each request
- **Database:** Minimal - just habits, logs, messages, insights
- **No real-time:** Poll for new messages every 10s or refresh on send
- **Coaching quality:** Depends on LIFE_COACH.md staying updated

---

## Future Enhancements

- [ ] Weekly LIFE_NOW.md auto-update suggestions from AI
- [ ] Insights dashboard (patterns visualization)
- [ ] Integration with trading coach (cross-reference patterns)
- [ ] Evening reflection automation (prompt at 8pm)
- [ ] Export chat history as markdown
- [ ] Voice input for mobile journaling

---

## Notes

This is NOT a habit tracker. This is a **psychological coaching system** that happens to track some habits. The real value is in:
- Pattern recognition (imposter syndrome, catastrophizing, rumination)
- Accountability (trading discipline, starter's curse)
- Evidence-based challenges (what would you tell Jucas?)
- Interrupt loops (rumination, compulsive checking)

The habits are just the measurable layer on top of deep mindset work.
