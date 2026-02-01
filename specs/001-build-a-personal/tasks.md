# Tasks: Personal CRM System

**Input**: Design documents from `/specs/001-build-a-personal/`
**Prerequisites**: plan.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

## Execution Summary
- **Tech Stack**: Next.js + TypeScript + Supabase
- **4 Entities**: Contact, ContactInfo, Interaction, Reminder
- **10 API Endpoints**: Contact management, interaction logging, reminder system
- **8 User Stories**: Complete CRM workflow from contact creation to data export
- **Project Structure**: Single Next.js app using Supabase client (`src/` structure)

## Phase 3.1: Setup & Foundation

- [x] **T001** Create Next.js project structure with TypeScript configuration
- [x] **T002** Initialize Supabase project and configure database schema
- [x] **T003** [P] Configure ESLint, Prettier, and Tailwind CSS for code quality
- [x] **T004** [P] Set up Vitest testing framework configuration in `vitest.config.ts`
- [x] **T005** [P] Configure Cypress for end-to-end testing in `cypress.config.ts`
- [x] **T006** Create environment configuration for database URL and auth settings

## Phase 3.2: Database Schema & Models

- [x] **T007** [P] Create Supabase table for Contact entity with proper columns and constraints
- [x] **T008** [P] Create Supabase table for ContactInfo entity with foreign key to Contact
- [x] **T009** [P] Create Supabase table for Interaction entity with foreign key to Contact
- [x] **T010** [P] Create Supabase table for Reminder entity with foreign key to Contact
- [x] **T011** Configure database policies and indexes for performance optimization
- [x] **T012** Create Supabase client instance and connection utilities in `src/lib/supabase.ts`

## Phase 3.3: Contract Tests (TDD) ⚠️ MUST COMPLETE BEFORE 3.4
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [x] **T013** [P] Contract test GET /api/contacts in `tests/contract/contacts-get.test.ts`
- [x] **T014** [P] Contract test POST /api/contacts in `tests/contract/contacts-post.test.ts`
- [x] **T015** [P] Contract test GET /api/contacts/{id} in `tests/contract/contact-get.test.ts`
- [x] **T016** [P] Contract test PUT /api/contacts/{id} in `tests/contract/contact-put.test.ts`
- [x] **T017** [P] Contract test DELETE /api/contacts/{id} in `tests/contract/contact-delete.test.ts`
- [x] **T018** [P] Contract test GET /api/contacts/{id}/contact-info in `tests/contract/contact-info-get.test.ts`
- [x] **T019** [P] Contract test POST /api/contacts/{id}/contact-info in `tests/contract/contact-info-post.test.ts`
- [x] **T020** [P] Contract test PUT /api/contact-info/{id} in `tests/contract/contact-info-put.test.ts`
- [x] **T021** [P] Contract test DELETE /api/contact-info/{id} in `tests/contract/contact-info-delete.test.ts`
- [x] **T022** [P] Contract test GET /api/contacts/{id}/interactions in `tests/contract/interactions-get.test.ts`
- [x] **T023** [P] Contract test POST /api/contacts/{id}/interactions in `tests/contract/interactions-post.test.ts`
- [x] **T024** [P] Contract test PUT /api/interactions/{id} in `tests/contract/interaction-put.test.ts`
- [x] **T025** [P] Contract test DELETE /api/interactions/{id} in `tests/contract/interaction-delete.test.ts`
- [x] **T026** [P] Contract test GET /api/reminders in `tests/contract/reminders-get.test.ts`
- [x] **T027** [P] Contract test POST /api/reminders/{id}/dismiss in `tests/contract/reminder-dismiss.test.ts`
- [x] **T028** [P] Contract test GET /api/dashboard in `tests/contract/dashboard-get.test.ts`
- [x] **T029** [P] Contract test GET /api/export in `tests/contract/export-get.test.ts`

## Phase 3.4: Integration Tests (User Stories)
**CRITICAL: These tests validate complete user workflows**

- [x] **T030** [P] Integration test: Contact creation with communication frequency in `tests/integration/contact-creation.test.ts`
- [x] **T031** [P] Integration test: Add multiple contact information methods in `tests/integration/contact-info.test.ts`
- [x] **T032** [P] Integration test: Birthday reminder generation and scheduling in `tests/integration/birthday-reminders.test.ts`
- [x] **T033** [P] Integration test: Interaction logging updates lastContactedAt in `tests/integration/interaction-logging.test.ts`
- [x] **T034** [P] Integration test: Dashboard overview with all data sections in `tests/integration/dashboard.test.ts`
- [ ] **T035** [P] Integration test: Search and filter contacts by various criteria in `tests/integration/search-filter.test.ts`
- [ ] **T036** [P] Integration test: Reminder dismissal and status management in `tests/integration/reminder-management.test.ts`
- [ ] **T037** [P] Integration test: Complete data export functionality in `tests/integration/data-export.test.ts`

## Phase 3.5: Service Layer (Core Business Logic)

- [x] **T038** [P] Create ContactService with Supabase CRUD operations in `src/services/ContactService.ts`
- [x] **T039** [P] Create ContactInfoService with Supabase queries and validation in `src/services/ContactInfoService.ts`
- [x] **T040** [P] Create InteractionService with Supabase operations and lastContactedAt updates in `src/services/InteractionService.ts`
- [x] **T041** [P] Create ReminderService with Supabase scheduling logic in `src/services/ReminderService.ts`
- [x] **T042** Create ReminderCalculatorService for frequency-based scheduling in `src/services/ReminderCalculatorService.ts`
- [x] **T043** Create BirthdayReminderService for birthday reminder generation in `src/services/BirthdayReminderService.ts`
- [x] **T044** Create DashboardService using Supabase queries for aggregating data in `src/services/DashboardService.ts`
- [x] **T045** Create ExportService using Supabase client for data export in `src/services/ExportService.ts`

## Phase 3.6: API Routes Implementation (ONLY after tests are failing)

- [x] **T046** Implement GET /api/contacts with search and filter in `src/app/api/contacts/route.ts`
- [x] **T047** Implement POST /api/contacts with validation in `src/app/api/contacts/route.ts`
- [x] **T048** Implement GET /api/contacts/[id] with contact details in `src/app/api/contacts/[id]/route.ts`
- [x] **T049** Implement PUT /api/contacts/[id] with update logic in `src/app/api/contacts/[id]/route.ts`
- [x] **T050** Implement DELETE /api/contacts/[id] with cascade delete in `src/app/api/contacts/[id]/route.ts`
- [x] **T051** Implement GET /api/contacts/[id]/contact-info in `src/app/api/contacts/[id]/contact-info/route.ts`
- [x] **T052** Implement POST /api/contacts/[id]/contact-info with primary flag logic in `src/app/api/contacts/[id]/contact-info/route.ts`
- [x] **T053** Implement PUT /api/contact-info/[id] in `src/app/api/contact-info/[id]/route.ts`
- [x] **T054** Implement DELETE /api/contact-info/[id] in `src/app/api/contact-info/[id]/route.ts`
- [x] **T055** Implement GET /api/contacts/[id]/interactions with pagination in `src/app/api/contacts/[id]/interactions/route.ts`
- [x] **T056** Implement POST /api/contacts/[id]/interactions with reminder reset in `src/app/api/contacts/[id]/interactions/route.ts`
- [x] **T057** Implement PUT /api/interactions/[id] in `src/app/api/interactions/[id]/route.ts`
- [x] **T058** Implement DELETE /api/interactions/[id] in `src/app/api/interactions/[id]/route.ts`
- [x] **T059** Implement GET /api/reminders with filtering in `src/app/api/reminders/route.ts`
- [x] **T060** Implement POST /api/reminders/[id]/dismiss in `src/app/api/reminders/[id]/dismiss/route.ts`
- [x] **T061** Implement GET /api/dashboard with all sections in `src/app/api/dashboard/route.ts`
- [x] **T062** Implement GET /api/export with complete data in `src/app/api/export/route.ts`

## Phase 3.7: Background Jobs & Scheduling

- [x] **T063** Create reminder generation background job in `src/jobs/reminderGenerator.ts`
- [x] **T064** Create birthday reminder background job in `src/jobs/birthdayReminders.ts`
- [x] **T065** Create notification delivery system in `src/services/NotificationService.ts`
- [x] **T066** Set up job scheduling with proper error handling

## Phase 3.8: UI Components

- [x] **T067** [P] Create ContactList component in `src/components/ContactList.tsx`
- [x] **T068** [P] Create ContactForm component for create/edit in `src/components/ContactForm.tsx`
- [x] **T069** [P] Create ContactDetail component with interaction history in `src/components/ContactDetail.tsx`
- [x] **T070** [P] Create InteractionForm component in `src/components/InteractionForm.tsx`
- [x] **T071** [P] Create Dashboard component with all sections in `src/components/Dashboard.tsx`
- [x] **T072** [P] Create SearchFilter component in `src/components/SearchFilter.tsx`
- [x] **T073** [P] Create ReminderList component in `src/components/ReminderList.tsx`

## Phase 3.9: Pages & Routing

- [x] **T074** Create dashboard page at `src/app/page.tsx`
- [x] **T075** Create contacts list page at `src/app/contacts/page.tsx`
- [x] **T076** Create contact detail page at `src/app/contacts/[id]/page.tsx`
- [x] **T077** Create new contact page at `src/app/contacts/new/page.tsx`
- [x] **T078** Create reminders page at `src/app/reminders/page.tsx`

## Phase 3.10: E2E Tests & Polish

- [x] **T079** [P] E2E test: Complete contact creation workflow in `cypress/e2e/contact-workflow.cy.ts`
- [x] **T080** [P] E2E test: Birthday reminder system in `cypress/e2e/birthday-reminders.cy.ts`
- [x] **T081** [P] E2E test: Interaction logging and reminder updates in `cypress/e2e/interaction-logging.cy.ts`
- [x] **T082** [P] E2E test: Dashboard functionality in `cypress/e2e/dashboard.cy.ts`
- [x] **T083** [P] Unit tests for validation utilities in `tests/unit/validation.test.ts`
- [x] **T084** [P] Unit tests for date calculations in `tests/unit/date-utils.test.ts`
- [x] **T085** Performance testing for <200ms API response times
- [x] **T086** [P] Error handling and logging improvements
- [x] **T087** Execute quickstart validation scenarios

## Dependencies

### Critical Path (Must Complete in Order)
1. **Setup (T001-T006)** → Database Schema (T007-T012)
2. **Database Schema** → Contract Tests (T013-T029)
3. **Contract Tests** → Integration Tests (T030-T037)
4. **Integration Tests** → Service Layer (T038-T045)
5. **Service Layer** → API Routes (T046-T062)
6. **API Routes** → UI Components (T067-T073)
7. **UI Components** → Pages (T074-T078)

### Blocking Dependencies
- T011 (database setup) blocks T038-T045 (services need DB tables)
- T038-T045 (services) block T046-T062 (API routes use services)
- T046-T062 (API routes) block T067-T073 (UI needs API)
- T063-T066 (background jobs) require T038-T045 (services)

### Parallel Execution Groups

**Group 1 - Database Schema (after T006)**:
```
T007: Supabase Contact table
T008: Supabase ContactInfo table  
T009: Supabase Interaction table
T010: Supabase Reminder table
```

**Group 2 - Contract Tests (after T012)**:
```
T013-T029: All API contract tests (18 tasks)
```

**Group 3 - Integration Tests (after contract tests)**:
```
T030-T037: All user story integration tests (8 tasks)
```

**Group 4 - Services (after integration tests)**:
```
T038: ContactService with Supabase
T039: ContactInfoService with Supabase
T040: InteractionService with Supabase  
T041: ReminderService with Supabase
```

**Group 5 - UI Components (after API routes)**:
```
T067-T073: All React components (7 tasks)
```

**Group 6 - E2E & Polish (final phase)**:
```
T079-T084: E2E tests and unit tests (6 tasks)
```

## Parallel Execution Examples

### Launch Contract Tests Together (Phase 3.3):
```bash
# All contract tests can run in parallel
Task: "Contract test GET /api/contacts in tests/contract/contacts-get.test.ts"
Task: "Contract test POST /api/contacts in tests/contract/contacts-post.test.ts"  
Task: "Contract test GET /api/contacts/{id} in tests/contract/contact-get.test.ts"
# ... continue with T014-T029
```

### Launch Service Layer Together (Phase 3.5):
```bash
# Services can be built in parallel
Task: "Create ContactService with Supabase CRUD operations in src/services/ContactService.ts"
Task: "Create ContactInfoService with Supabase queries and validation in src/services/ContactInfoService.ts"
Task: "Create InteractionService with Supabase operations and lastContactedAt updates in src/services/InteractionService.ts"
Task: "Create ReminderService with Supabase scheduling logic in src/services/ReminderService.ts"
```

## Validation Checklist
*GATE: All items must pass before completion*

- [x] All 10 API endpoints have contract tests (T013-T029)
- [x] All 4 entities have Supabase table tasks (T007-T010)
- [x] All 8 user stories have integration tests (T030-T037)
- [x] All contract tests come before API implementation
- [x] All parallel tasks [P] operate on different files
- [x] Each task specifies exact file path
- [x] TDD ordering enforced: Tests → Implementation → Polish
- [x] Critical dependencies identified and blocked appropriately

## Notes
- **[P]** = Parallel execution (different files, no dependencies)
- Verify all tests FAIL before implementing
- Commit after each task completion
- Follow TDD strictly: RED → GREEN → REFACTOR