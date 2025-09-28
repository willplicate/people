# Personal CRM Development Guidelines

Auto-generated from feature plans. Last updated: 2025-09-11

## Active Technologies
- **Language**: TypeScript/Node.js 18+, React 18
- **Framework**: Next.js (frontend only, using Supabase backend)
- **Database**: Supabase (PostgreSQL + auto-generated APIs)
- **Client**: Supabase JavaScript client
- **Testing**: Vitest (unit/integration), Cypress (E2E)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel + Supabase

## Project Structure
```
src/
├── services/       # Business logic using Supabase client
├── components/     # React components
├── pages/          # Next.js pages (frontend only)
├── lib/           # Utilities and Supabase client setup
└── types/         # TypeScript types for database entities

tests/
├── contract/      # Supabase API contract tests
├── integration/   # Integration tests with Supabase
├── e2e/           # End-to-end tests with Cypress
└── unit/          # Unit tests for individual components
```

## Core Entities
- **Contact**: Personal relationships with communication frequency settings
- **ContactInfo**: Multiple phone/email/address per contact
- **Interaction**: Timestamped notes about communications
- **Reminder**: Scheduled notifications for communication and birthdays

## Development Principles
- **TDD**: RED-GREEN-Refactor cycle enforced
- **Database**: Real Supabase instance for all tests (no mocks)
- **API**: Supabase auto-generated APIs + custom business logic
- **Testing Order**: Contract → Integration → E2E → Unit

## Key Features (001-build-a-personal)
- Contact management with multiple contact methods
- Automated reminders based on communication frequency
- Birthday notifications (7-day advance + day-of alerts)
- Interaction logging with notes
- Dashboard with upcoming reminders and recent interactions
- Search and filtering capabilities
- Data export functionality

## Performance Goals
- API response time: <200ms
- Page load time: <2s
- Support: ~500 contacts, 10+ years data retention

## Recent Changes
- 001-build-a-personal: Added Personal CRM system using Supabase backend with contact management, reminders, and interaction tracking
- Simplified architecture: Removed Prisma ORM in favor of direct Supabase client usage

<!-- MANUAL ADDITIONS START -->
<!-- Add project-specific guidelines, conventions, or notes here -->
<!-- MANUAL ADDITIONS END -->