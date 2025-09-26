# Personal CRM

A personal relationship management system to help you stay connected with friends and family.

## Features

- Contact management with multiple contact methods
- Automated reminders based on communication frequency
- Birthday notifications (7-day advance + day-of alerts)
- Interaction logging with notes
- Dashboard with upcoming reminders and recent interactions
- Search and filtering capabilities
- Data export functionality

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + auto-generated APIs)
- **Testing**: Vitest (unit/integration), Cypress (E2E)
- **Deployment**: Vercel + Supabase

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Setup

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Supabase:**
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Follow the instructions in `SUPABASE_SETUP.md` to create the database schema
   - Copy `.env.example` to `.env.local` and fill in your Supabase credentials

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Run tests:**
   ```bash
   # Unit and integration tests
   npm run test
   
   # E2E tests
   npm run test:e2e
   ```

## Project Structure

```
src/
├── app/           # Next.js app router pages
├── components/    # React components  
├── services/      # Business logic using Supabase client
├── lib/           # Utilities and Supabase client setup
└── types/         # TypeScript types for database entities

tests/
├── contract/      # Supabase API contract tests
├── integration/   # Integration tests with Supabase  
├── e2e/           # End-to-end tests with Cypress
└── unit/          # Unit tests for individual components
```

## Development

This project follows Test-Driven Development (TDD) principles:

1. Write tests first (RED)
2. Make tests pass (GREEN) 
3. Refactor code (REFACTOR)

All tests use real Supabase instances - no mocks for integration testing.

## Contributing

1. Follow the existing code style (ESLint + Prettier configured)
2. Write tests for new features
3. Update documentation as needed

## License

MIT