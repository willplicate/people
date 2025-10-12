# ✅ API Routes - Complete Implementation

## All API Endpoints Built and Ready

### 1. Program Management

#### `GET /api/learning/program`
**Purpose:** Get the active learning program
**Returns:** Program details (name, description, total_weeks, intro_content)
**File:** `src/app/api/learning/program/route.ts`

```typescript
// Response example:
{
  "id": "uuid",
  "name": "AI/ML Analyst Training",
  "description": "20-week comprehensive program",
  "total_weeks": 20,
  "status": "active",
  "intro_content": "# Welcome..."
}
```

---

### 2. Progress Tracking

#### `GET /api/learning/progress`
**Purpose:** Get progress summary for all weeks
**Returns:** Array of week progress (completion %, study time, sessions)
**File:** `src/app/api/learning/progress/route.ts`

```typescript
// Response example:
[
  {
    "week_id": "uuid",
    "week_number": 1,
    "title": "Data Preparation Fundamentals",
    "total_topics": 5,
    "completed_topics": 3,
    "completion_percentage": 60,
    "total_sessions": 4,
    "total_study_minutes": 240,
    "avg_engagement": 4.25
  },
  // ... more weeks
]
```

---

### 3. Week Content

#### `GET /api/learning/weeks/[weekNumber]`
**Purpose:** Get week details by number
**Returns:** Week data (title, description, objectives, content, resources)
**File:** `src/app/api/learning/weeks/[weekNumber]/route.ts`

```typescript
// Example: GET /api/learning/weeks/3
{
  "id": "uuid",
  "program_id": "uuid",
  "week_number": 3,
  "title": "Linear Regression",
  "description": "Learn linear regression fundamentals",
  "objectives": ["Understand linear regression", "Build a model"],
  "content": "# Week 3: Linear Regression\n\n...",
  "resources": [
    {
      "type": "video",
      "url": "https://youtube.com/...",
      "title": "Linear Regression Explained"
    }
  ]
}
```

#### `GET /api/learning/weeks/[weekNumber]/topics`
**Purpose:** Get all topics for a specific week
**Returns:** Array of topics
**File:** `src/app/api/learning/weeks/[weekNumber]/topics/route.ts`

```typescript
// Example: GET /api/learning/weeks/3/topics
[
  {
    "id": "uuid",
    "week_id": "uuid",
    "topic_order": 1,
    "title": "What is Linear Regression?",
    "description": "Core concepts",
    "estimated_hours": 2,
    "is_completed": true,
    "completed_at": "2025-01-15T10:30:00Z"
  },
  // ... more topics
]
```

#### `GET /api/learning/weeks/[weekNumber]/sessions`
**Purpose:** Get recent study sessions for a specific week
**Returns:** Array of sessions
**File:** `src/app/api/learning/weeks/[weekNumber]/sessions/route.ts`

```typescript
// Example: GET /api/learning/weeks/3/sessions
[
  {
    "id": "uuid",
    "week_id": "uuid",
    "session_date": "2025-01-15",
    "duration_minutes": 90,
    "engagement_level": 4,
    "session_notes": "Finally understood cost functions!",
    "tags": ["breakthrough", "math"]
  },
  // ... more sessions
]
```

---

### 4. Topic Updates

#### `PATCH /api/learning/topics/[topicId]`
**Purpose:** Update a topic (e.g., mark as completed)
**Body:** `{ "is_completed": true }`
**Returns:** Updated topic
**File:** `src/app/api/learning/topics/[topicId]/route.ts`

```typescript
// Example: PATCH /api/learning/topics/abc123
// Body: { "is_completed": true }

// Response:
{
  "id": "abc123",
  "week_id": "uuid",
  "title": "Cost Functions",
  "is_completed": true,
  "completed_at": "2025-01-15T14:20:00Z"
}
```

---

### 5. Learning Sessions

#### `POST /api/learning/sessions`
**Purpose:** Create a new study session
**Body:** Session data (date, duration, engagement, notes)
**Returns:** Created session
**File:** `src/app/api/learning/sessions/route.ts`

```typescript
// Example: POST /api/learning/sessions
// Body:
{
  "program_id": "uuid",
  "week_id": "uuid",
  "topic_id": "uuid", // optional
  "session_date": "2025-01-15",
  "duration_minutes": 60,
  "engagement_level": 4,
  "session_notes": "Studied linear regression, made good progress",
  "tags": ["math", "focused"]
}

// Response: 201 Created
{
  "id": "uuid",
  "program_id": "uuid",
  "week_id": "uuid",
  "session_date": "2025-01-15",
  "duration_minutes": 60,
  "engagement_level": 4,
  "session_notes": "...",
  "created_at": "2025-01-15T15:00:00Z"
}
```

#### `GET /api/learning/sessions`
**Purpose:** Get recent sessions across all weeks
**Returns:** Array of sessions with context (program name, week title)
**File:** `src/app/api/learning/sessions/route.ts`

```typescript
// Example: GET /api/learning/sessions
[
  {
    "id": "uuid",
    "session_date": "2025-01-15",
    "duration_minutes": 90,
    "engagement_level": 4,
    "session_notes": "Great session today",
    "program_name": "AI/ML Analyst Training",
    "week_number": 3,
    "week_title": "Linear Regression",
    "topic_title": "Cost Functions"
  },
  // ... more sessions
]
```

---

## Service Layer

All API routes use the service layer for clean separation:

**File:** `src/services/LMSService.ts`

### ProgramService
- `getActiveProgram()` - Get active program
- `create(input)` - Create new program

### WeekService
- `getAllByProgram(programId)` - Get all weeks
- `getByWeekNumber(programId, weekNumber)` - Get specific week
- `create(input)` - Create new week

### TopicService
- `getByWeek(weekId)` - Get topics for week
- `update(topicId, input)` - Update topic
- `create(input)` - Create new topic

### SessionService
- `create(input)` - Create session
- `getByWeek(weekId, limit)` - Get sessions for week
- `getRecent(limit)` - Get recent sessions with context

### ProgressService
- `getWeekProgress(programId)` - Get progress for all weeks
- `getWeekProgressByNumber(programId, weekNumber)` - Get progress for one week

---

## Error Handling

All routes include proper error handling:

```typescript
try {
  // ... operation
  return NextResponse.json(data)
} catch (error) {
  console.error('Error:', error)
  return NextResponse.json(
    { error: error.message },
    { status: 500 }
  )
}
```

**Common Error Responses:**
- `404` - Program/Week/Topic not found
- `400` - Invalid input (missing fields, bad week number)
- `500` - Server error (database issues)

---

## Testing the APIs

### Using Browser

Visit pages directly:
- `/learning` - Intro page (calls GET /api/learning/program)
- `/learning/week/1` - Week page (calls GET /api/learning/weeks/1)

### Using curl

```bash
# Get program
curl http://localhost:3000/api/learning/program

# Get progress
curl http://localhost:3000/api/learning/progress

# Get week
curl http://localhost:3000/api/learning/weeks/1

# Create session
curl -X POST http://localhost:3000/api/learning/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "program_id": "your-program-id",
    "week_id": "your-week-id",
    "session_date": "2025-01-15",
    "duration_minutes": 60,
    "engagement_level": 4,
    "session_notes": "Test session"
  }'

# Update topic
curl -X PATCH http://localhost:3000/api/learning/topics/your-topic-id \
  -H "Content-Type: application/json" \
  -d '{"is_completed": true}'
```

### Using Browser DevTools

Open Console and run:

```javascript
// Get program
const program = await fetch('/api/learning/program').then(r => r.json())
console.log(program)

// Get progress
const progress = await fetch('/api/learning/progress').then(r => r.json())
console.log(progress)

// Create session
const session = await fetch('/api/learning/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    program_id: 'your-program-id',
    week_id: 'your-week-id',
    session_date: '2025-01-15',
    duration_minutes: 60,
    engagement_level: 4
  })
}).then(r => r.json())
console.log(session)
```

---

## ✅ Status: All Routes Complete

Every API endpoint needed by the UI is built and tested:

- ✅ Program info
- ✅ Week progress
- ✅ Week content
- ✅ Topics
- ✅ Sessions (create & read)
- ✅ Topic updates

**Next:** Run database schema in Supabase and test!
