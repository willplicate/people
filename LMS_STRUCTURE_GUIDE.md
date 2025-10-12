# Learning Management System - Complete Structure Guide

## Overview

Your LMS now has a comprehensive structure that mirrors the actual learning workflow from the curriculum. This guide explains how everything fits together.

---

## Database Tables

### Core Structure

1. **`learning_programs`** - The 20-week program
2. **`learning_weeks`** - Each of the 20 weeks
3. **`week_sections`** - Three sections per week (NEW!)
   - Monday-Tuesday: Study Focus
   - Wednesday-Saturday: Practical Experiments
   - Sunday: Knowledge Check
4. **`learning_topics`** - Individual topics within weeks
5. **`learning_sessions`** - Daily study session tracking

### Notes & Knowledge System (NEW!)

6. **`week_notes`** - Freeform notes for each week
   - General observations
   - Breakthroughs ("aha!" moments)
   - Questions
   - Struggles
   - Project ideas
   - Review notes

7. **`knowledge_concepts`** - Structured knowledge base
   - Concept name & definition
   - Explanation & examples
   - Understanding level (1-5)
   - Quiz generation hints
   - **Purpose:** Build your personal ML encyclopedia for Gemini quiz generation

8. **`project_discussions`** - Wednesday project planning
   - Pre-generated template questions
   - Your project idea
   - Claude's feedback
   - Refined approach
   - Implementation notes
   - **Purpose:** Keep you accountable to the Wednesday discussion structure

---

## Weekly Workflow

### Monday-Tuesday: Study Focus
- Read core concepts
- Watch videos, ask Gemini questions
- **Action:** Take notes in `week_notes`
- **Action:** As you learn concepts, add them to `knowledge_concepts` with definitions

### Wednesday: Project Discussion
- **REMINDER:** Check `project_discussions` table for template questions
- Open discussion with Claude
- Ask pre-generated questions
- Record your project idea and Claude's feedback
- **Action:** Update `project_discussions` with your plan

### Thursday-Saturday: Build
- Implement your project based on Wednesday's discussion
- **Action:** Log daily `learning_sessions` with notes
- **Action:** Add discoveries to `week_notes`

### Sunday: Reflect & Document
- Complete knowledge check
- Quiz yourself (can use Gemini with your `knowledge_concepts`)
- Write portfolio deliverable
- **Action:** Update `knowledge_concepts` with understanding level
- **Action:** Mark topics complete

---

## How to Use the Knowledge Base for Quizzes

### Export Concepts to Gemini

```typescript
// Get all concepts for Week 1
const { data: concepts } = await supabase
  .from('knowledge_concepts')
  .select('*')
  .eq('week_number', 1)

// Format for Gemini prompt
const promptForGemini = `
Generate a quiz based on these concepts I've learned:

${concepts.map(c => `
**${c.concept_name}**
Definition: ${c.definition}
Understanding Level: ${c.understanding_level}/5
Quiz Focus: ${c.quiz_focus}
`).join('\n')}

Create 5 multiple choice questions that test my understanding.
`
```

---

## Import Scripts

### Current Status: Week 1
- ✅ `add-week-sections-schema.sql` - Run in Supabase SQL Editor
- ✅ `add-notes-and-knowledge-schema.sql` - Run in Supabase SQL Editor
- ✅ `seed-week1-with-sections.ts` - Creates 3 sections for Week 1
- ✅ `generate-complete-week-template.ts` - **THE MAIN SCRIPT**
  - Reads curriculum.md
  - Creates sections
  - Pre-populates knowledge concepts
  - Generates Wednesday discussion template

### For Future Weeks (2-20)

We'll create a `generate-all-weeks.ts` script that:
1. Parses all 20 weeks from curriculum.md
2. Extracts Core Concepts for each week
3. Creates week_sections
4. Generates discussion templates
5. Pre-populates knowledge_concepts

---

## UI Components Needed

### Week Page Additions

1. **Wednesday Discussion Banner** (if today is Wednesday OR discussion pending)
   ```
   📅 Wednesday Project Discussion
   It's time to discuss your Week 1 project with Claude!
   [Start Discussion] button
   ```

2. **Notes Section** (collapsible)
   ```
   📝 My Notes
   [+ Add Note] button
   - Shows recent notes
   - Can filter by type (breakthrough, question, etc.)
   ```

3. **Knowledge Concepts** (collapsible)
   ```
   🧠 Concepts I've Learned
   - Features: ⭐⭐⭐☆☆ (3/5 understanding)
   - Labels: ⭐⭐☆☆☆ (2/5 understanding)
   [Generate Quiz with Gemini] button
   ```

4. **Project Discussion History**
   ```
   💬 My Project Discussions
   - Wed Oct 16: Discussed habit tracker (Completed)
   - [View Details]
   ```

---

## Next Steps

### 1. Run Schema Updates
```bash
# In Supabase SQL Editor:
# 1. Copy/paste add-notes-and-knowledge-schema.sql
# 2. Execute
```

### 2. Generate Week 1 Complete Template
```bash
npx tsx scripts/generate-complete-week-template.ts
```

### 3. Update Week Page UI
Add the 4 new sections mentioned above to `/learning/week/[weekNumber]/page.tsx`

### 4. Create API Routes
- `/api/learning/weeks/[weekNumber]/notes` - GET/POST notes
- `/api/learning/weeks/[weekNumber]/concepts` - GET/POST concepts
- `/api/learning/weeks/[weekNumber]/discussion` - GET/PUT discussion
- `/api/learning/concepts/export-for-quiz` - Format concepts for Gemini

### 5. Generate Weeks 2-20
Create script to parse all weeks from curriculum.md and import with same structure

---

## Key Benefits of This Structure

✅ **Accountability:** Wednesday discussion template reminds you to plan before building

✅ **Knowledge Retention:** Structured concepts make it easy to review and quiz yourself

✅ **Notes Organization:** Categorized notes (breakthrough, struggle, question) help you see patterns

✅ **Quiz Generation:** Your knowledge base feeds directly into Gemini for personalized quizzes

✅ **Consistent Workflow:** Same structure across all 20 weeks

✅ **Real Tracking:** Not just "did I study?" but "what did I learn and understand?"

---

## Example: Complete Week 1 Flow

1. **Monday:** Study features & labels → Add to `knowledge_concepts`
2. **Tuesday:** Watch EDA videos → Add questions to `week_notes`
3. **Wednesday:** Get discussion reminder → Fill out `project_discussions` with Claude
4. **Thursday-Saturday:** Build habit tracker → Log `learning_sessions` daily
5. **Sunday:** Quiz yourself with Gemini using your `knowledge_concepts` → Mark complete

The system guides you through the exact workflow from the curriculum!
