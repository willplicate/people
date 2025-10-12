# LMS Setup Guide - Quick Start

## ✅ Step 1: Run Database Schema in Supabase

1. Go to your Supabase project: https://supabase.com/dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `lms-database-schema.sql`
5. Paste into the SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)

You should see: "Success. No rows returned"

This creates:
- 4 tables: `learning_programs`, `learning_weeks`, `learning_topics`, `learning_sessions`
- 2 views: `week_progress_summary`, `recent_learning_sessions`

---

## ✅ Step 2: Insert Your Program Data

### Option A: Manual (Quick Test)

Use Supabase Table Editor to insert:

**1. Insert Program:**
```
Table: learning_programs
Click "Insert row"

Fields:
- name: "AI/ML Analyst Training"
- description: "Comprehensive 20-week program"
- role_description: "An Applied AI/ML Analyst sits at the intersection of data science, business strategy, and practical problem-solving..."
- total_weeks: 20
- status: "active"
- intro_content: (copy from curriculum.md intro section)
```

**2. Insert Week 1:**
```
Table: learning_weeks
Click "Insert row"

Fields:
- program_id: (select the program you just created)
- week_number: 1
- title: "Data Preparation Fundamentals"
- description: "Learn features, labels, and EDA"
- objectives: {"Features - Input variables", "Labels - Target variable", "EDA - Exploratory Data Analysis"}
- content: (copy Week 1 content from curriculum.md)
```

**3. Insert Topics for Week 1:**
```
Table: learning_topics
Insert 2-3 rows:

Topic 1:
- week_id: (select Week 1)
- topic_order: 1
- title: "What is Machine Learning?"
- estimated_hours: 2
- is_completed: false

Topic 2:
- week_id: (select Week 1)
- topic_order: 2
- title: "Features and Labels"
- estimated_hours: 3
- is_completed: false
```

### Option B: Automated (Full Import)

I can create a script to parse `curriculum.md` and auto-insert all 20 weeks!

Would you like me to create this script?

---

## ✅ Step 3: Test the LMS

```bash
# Start dev server
npm run dev
```

Visit: **http://localhost:3000/learning**

You should see:
- ✅ Left sidebar with Week 1
- ✅ Intro/overview page
- ✅ Click "Week 1" to see content
- ✅ Click "Log Study Session" to test tracker

---

## 🧪 Quick Test Checklist

1. **Navigation:**
   - [ ] Click "Introduction" - shows overview
   - [ ] Click "Week 1" - shows week content
   - [ ] Sidebar shows week progress

2. **Topic Completion:**
   - [ ] Click checkbox next to a topic
   - [ ] Topic gets checkmark
   - [ ] Progress bar updates

3. **Session Logging:**
   - [ ] Click "Log Today's Study Session"
   - [ ] Fill in: duration (60 min), engagement (4/5), notes
   - [ ] Click "Save Session"
   - [ ] Session appears in "Recent Sessions"

4. **Data Verification:**
   - [ ] Check Supabase: `learning_sessions` table has your session
   - [ ] Check `week_progress_summary` view shows updated percentage

---

## 🔍 Troubleshooting

### Error: "No active program found"
- Go to Supabase > `learning_programs` table
- Make sure you have a row with `status = 'active'`

### Week page shows "Week not found"
- Check `learning_weeks` table
- Ensure `program_id` matches your program
- Ensure `week_number` is correct (1-20)

### Topics not showing
- Check `learning_topics` table
- Ensure `week_id` matches the week

### Session not saving
- Check browser console for errors
- Check Supabase > Table Editor > `learning_sessions` for any constraint violations
- Ensure `program_id`, `week_id`, and `session_date` are provided

---

## 📊 Database Views Explained

### `week_progress_summary`
Auto-calculates for each week:
- Total topics
- Completed topics
- Completion percentage
- Total study time
- Average engagement

**How to view:**
```sql
SELECT * FROM week_progress_summary
ORDER BY week_number;
```

### `recent_learning_sessions`
Shows last 100 sessions with context:
- Program name
- Week number and title
- Topic title (if specified)
- Session details

**How to view:**
```sql
SELECT * FROM recent_learning_sessions
LIMIT 20;
```

---

## 🚀 Next Steps

1. **Add More Weeks:**
   - Manually add Week 2, 3, 4... OR
   - Use automated import script (I can create this)

2. **Customize UI:**
   - Change colors in components
   - Add your own branding
   - Modify session tracker fields

3. **Add Features:**
   - Analytics dashboard
   - Spaced repetition
   - Export study notes
   - Mobile responsive design

---

## 📁 API Endpoints Reference

All created and ready to use:

```
GET  /api/learning/program                - Get active program
GET  /api/learning/progress                - Get all week progress
GET  /api/learning/weeks/[weekNumber]      - Get week details
GET  /api/learning/weeks/[weekNumber]/topics - Get topics for week
GET  /api/learning/weeks/[weekNumber]/sessions - Get sessions for week
POST /api/learning/sessions                - Create new session
GET  /api/learning/sessions                - Get recent sessions
PATCH /api/learning/topics/[topicId]       - Update topic (mark complete)
```

---

## 🎉 You're Ready!

Once you've completed Steps 1-3, your LMS is fully functional!

**Questions?**
- Check `LMS_DESIGN.md` for UI mockups
- Check `LMS_IMPLEMENTATION_SUMMARY.md` for architecture
- Check `lms-database-schema.sql` for database structure
