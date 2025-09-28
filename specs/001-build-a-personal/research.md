# Research: Personal CRM System Technology Choices

**Date**: 2025-09-11  
**Feature**: Personal CRM System  
**Status**: Complete

## Technology Stack Decisions

### Language & Framework
**Decision**: React + TypeScript + Next.js + Node.js  
**Rationale**: React with TypeScript provides type safety and enhanced developer experience for complex relationship data. Next.js offers full-stack capabilities with API routes, SSR, and built-in optimizations. Node.js enables JavaScript throughout the stack for consistency.  
**Alternatives considered**: MERN (MongoDB) stack - rejected due to PostgreSQL's superior data consistency; Vue/Nuxt - rejected due to React's larger ecosystem; Django/Python - rejected to maintain JavaScript consistency

### Database & Storage
**Decision**: Supabase (PostgreSQL with built-in APIs)  
**Rationale**: Supabase provides PostgreSQL with auto-generated REST APIs, real-time subscriptions, built-in auth, and TypeScript client. Eliminates need for custom API layer and ORM complexity while maintaining PostgreSQL's data integrity.  
**Alternatives considered**: Prisma + PostgreSQL - rejected as overengineered for personal project; MongoDB with Mongoose - rejected due to lack of ACID compliance; Firebase - rejected due to limited relational query capabilities

### Authentication Architecture
**Decision**: Supabase Auth (single-user setup)  
**Rationale**: Supabase provides built-in authentication that can be configured for single-user personal use. Eliminates need to build custom auth while maintaining simplicity through configuration.  
**Alternatives considered**: Custom session-based auth - rejected to avoid reinventing security; Multi-user OAuth - rejected as overkill; Auth0 - rejected to keep everything in one service

### Notification System
**Decision**: Multi-channel approach: Email + Web Push + In-app notifications  
**Rationale**: Email provides reliable delivery for birthday reminders (works across all devices), Web Push notifications enable real-time alerts when app is closed, In-app notifications show immediate status for active users. 2025 data shows push opt-in rates at 61% average, making email backup essential.  
**Alternatives considered**: Email-only - rejected due to lack of real-time capabilities; Push-only - rejected due to 39% of users not opting in; SMS notifications - rejected due to cost and complexity

### Timezone Handling
**Decision**: Store birthdays as plain dates (month-day), use JavaScript Intl API for display  
**Rationale**: Birthdays are timezone-independent events, JavaScript's Intl.DateTimeFormat provides native timezone conversion, future-proof approach compatible with emerging Temporal API, avoids daylight saving time complications.  
**Alternatives considered**: Moment.js - rejected due to large bundle size and maintenance mode; date-fns-tz - rejected as overkill; Store with timezone info - rejected as birthdays don't have meaningful timezones

### Data Export & Backup
**Decision**: Supabase data export + JSON export feature  
**Rationale**: Supabase provides built-in database backups and export functionality. JSON export via Supabase client enables data portability and user control without custom backup infrastructure.  
**Alternatives considered**: Custom pg_dump scripts - rejected as unnecessary complexity; Manual exports only - rejected due to human error risk; CSV export only - rejected due to loss of relational data structure

### Testing Framework
**Decision**: Vitest + Cypress  
**Rationale**: Vitest is 4x faster than Jest with native ES modules and TypeScript support, Cypress provides excellent component and E2E testing for React, modern tooling aligned with 2025 development practices.  
**Alternatives considered**: Jest + React Testing Library - rejected due to slower performance; Playwright - rejected due to complexity overkill; Unit tests only - rejected due to need for integration testing of reminder systems

### Deployment & Infrastructure
**Decision**: Next.js + Vercel deployment + Supabase backend  
**Rationale**: Next.js provides optimized builds and SSR capabilities, Vercel offers seamless deployment with global CDN, Supabase handles all backend services (database, auth, APIs) in one service, total cost under $20/month for personal use.  
**Alternatives considered**: Custom API + separate hosting - rejected as overengineered; Self-hosted - rejected due to maintenance overhead; AWS/Azure - rejected due to complexity and higher costs

## Resolved Clarifications

1. **Authentication**: Supabase Auth configured for single-user operation
2. **Notifications**: Multi-channel (Email + Web Push + In-app)  
3. **Data Export**: Supabase export functionality + JSON export via client
4. **Timezone Handling**: Plain date storage with JavaScript Intl API for display

## Implementation Priority
1. Supabase setup (database schema, auth configuration)
2. Core contact management (Supabase client integration)
3. Birthday reminder system (timezone-aware calculations)
4. Interaction logging (timestamped notes with search)
5. Notification system (email + web push)
6. Dashboard and reporting (upcoming reminders, interaction history)
7. Data export functionality (JSON via Supabase client)