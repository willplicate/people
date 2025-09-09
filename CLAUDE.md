# Personal CRM - Claude Code Context

## Project Overview
A mobile-first personal CRM for managing relationships with friends and family. Core features:
- Contact frequency scheduling (weekly, monthly, quarterly, annually)
- Birthday reminders (on birthday + 1 week prior)
- Conversation notes and relationship history
- Simple contact management with popup interface

## Tech Stack
- Frontend: React with TypeScript (mobile-first responsive design)
- Backend: Node.js with Express
- Database: SQLite for local development, PostgreSQL for production
- Styling: Tailwind CSS
- State Management: React Context API or Zustand

## File Structure Guidelines
- `/src/components/` - React components (ContactCard, AddContactModal, etc.)
- `/src/hooks/` - Custom React hooks for data management
- `/src/types/` - TypeScript interfaces and types
- `/src/services/` - API calls and data services
- `/src/utils/` - Helper functions (date calculations, notifications)
- `/backend/` - Express server, routes, and database models

## Core Data Models
Reference: @docs/database-schema.md

## Development Workflow
1. Start with database schema and types
2. Build core backend API endpoints
3. Create basic React components
4. Implement contact frequency logic
5. Add birthday reminder system
6. Polish mobile UI/UX

## Coding Standards
- Use functional components with hooks
- TypeScript strict mode enabled
- Mobile-first responsive design (320px and up)
- Semantic HTML and ARIA labels for accessibility
- ESLint + Prettier for code formatting

## Key Features Priority
1. **Contact Management** - Add, edit, view contacts
2. **Frequency Scheduling** - Assign contact frequency to each person
3. **Reminder System** - Show who to contact today/this week
4. **Birthday Tracking** - Birthday alerts and gift reminders
5. **Notes System** - Conversation history and personal notes

## Critical Requirements
- MUST work well on mobile devices (primary use case)
- MUST handle timezone considerations for birthdays
- MUST provide gentle reminders, not aggressive notifications
- MUST keep data private and secure (local-first approach preferred)

## Commands Available
- `/project:add-feature` - Add new functionality systematically
- `/project:debug` - Debug issues with structured approach
- `/project:deploy` - Deployment checklist and steps
