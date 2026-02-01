# Implementation Plan: Personal CRM System

**Branch**: `001-build-a-personal` | **Date**: 2025-09-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-build-a-personal/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, or `GEMINI.md` for Gemini CLI).
6. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Personal CRM system for tracking relationships with friends and family, featuring automated reminders based on communication frequency (weekly to annually), birthday notifications (7-day advance warning + day-of), interaction logging with notes, and comprehensive contact management with multiple phone/email/address storage. The system helps maintain consistent personal connections through systematic relationship tracking.

## Technical Context
**Language/Version**: TypeScript/Node.js 18+, React 18  
**Primary Dependencies**: Next.js, Supabase client, React, Tailwind CSS  
**Storage**: Supabase (PostgreSQL + auto-generated APIs)  
**Testing**: Vitest (unit/integration), Cypress (E2E)  
**Target Platform**: Web application (Vercel deployment)
**Project Type**: single (web application using Supabase backend)  
**Performance Goals**: <200ms API response, <2s page loads, real-time notifications  
**Constraints**: Single-user system, <$20/month hosting, offline birthday calculations  
**Scale/Scope**: ~500 contacts max, 10+ years data retention, 5-10 core screens

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 1 (Next.js full-stack app with API routes)
- Using framework directly? ✅ Direct Next.js/React usage, Prisma ORM without wrappers
- Single data model? ✅ Prisma schema as single source of truth
- Avoiding patterns? ✅ No Repository/UoW patterns - direct Prisma client usage

**Architecture**:
- EVERY feature as library? ⚠️ DEVIATION - Web app structure, not library-first
- Libraries listed: N/A - monolithic Next.js application
- CLI per library: ⚠️ DEVIATION - Web interface only, no CLI
- Library docs: ⚠️ DEVIATION - Standard web app documentation

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? ✅ TDD mandatory for all features
- Git commits show tests before implementation? ✅ Will enforce in task ordering
- Order: Contract→Integration→E2E→Unit strictly followed? ✅ Planned in implementation
- Real dependencies used? ✅ Actual PostgreSQL (Supabase), no mocks for integration
- Integration tests for: new libraries, contract changes, shared schemas? ✅ All API endpoints
- FORBIDDEN: Implementation before test, skipping RED phase ✅ Will enforce strictly

**Observability**:
- Structured logging included? ✅ Next.js built-in logging + custom structured logs
- Frontend logs → backend? ✅ Unified logging stream via API
- Error context sufficient? ✅ Error boundaries + contextual logging

**Versioning**:
- Version number assigned? ✅ v1.0.0 (MAJOR.MINOR.BUILD)
- BUILD increments on every change? ✅ Automated via CI/CD
- Breaking changes handled? ✅ Migration scripts + parallel testing

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: [DEFAULT to Option 1 unless Technical Context indicates web/mobile app]

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `/scripts/update-agent-context.sh [claude|gemini|copilot]` for your AI assistant
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base structure
- Extract tasks from Phase 1 artifacts:
  - **From data-model.md**: Create Prisma schema, database migrations
  - **From api-spec.yaml**: Generate contract tests for each endpoint (17 endpoints)
  - **From quickstart.md**: Convert test scenarios to integration tests (8 scenarios)
- Each entity gets model creation + validation tasks
- Each API endpoint gets contract test + implementation tasks
- UI components generated from user flows in quickstart

**Ordering Strategy (TDD-First)**:
1. **Foundation** [P]: Database setup, Prisma schema, migrations
2. **Contract Tests** [P]: API endpoint tests (must fail initially)
3. **Models & Services**: Core business logic to pass contract tests
4. **Integration Tests**: User story validation from quickstart scenarios
5. **UI Components**: Forms, dashboard, contact management screens
6. **E2E Tests**: Complete user journey validation
7. **Background Jobs**: Reminder generation and notification system
8. **Performance & Export**: Dashboard optimization, data export functionality

**Parallel Execution Markers [P]**:
- Database schema tasks (independent files)
- Contract tests by endpoint (isolated test files)
- Model creation tasks (separate entity files)
- UI component tasks (isolated React components)

**Dependency Chains**:
- Database → Models → Services → API → UI
- Contract tests → Implementation → Integration tests
- Core features → Background jobs → Notifications

**Estimated Task Breakdown**:
- 5 Foundation tasks (database, schema, auth setup)
- 17 Contract test tasks (one per API endpoint)
- 12 Model/Service implementation tasks  
- 8 Integration test tasks (from quickstart scenarios)
- 10 UI component tasks (forms, dashboard, lists)
- 6 Background job tasks (reminders, notifications)
- 4 Performance/Export tasks
- **Total: ~62 tasks** with clear TDD ordering

**Task Template Fields**:
- Task number, description, type (test/implementation)
- Dependencies (prerequisite task numbers)
- Acceptance criteria from functional requirements
- Parallel execution flag [P] where applicable
- Estimated effort and complexity level

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Web app (not library-first) | Personal CRM requires intuitive UI for relationship management | CLI-only interface insufficient for visual relationship tracking, contact photos, dashboard views |
| No CLI per feature | Web interface better suited for CRM workflows | CLI commands inadequate for complex contact editing, relationship visualization |
| Standard docs (not llms.txt) | Web app documentation patterns established | Personal project scope doesn't justify custom documentation format |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS (with justified deviations)
- [x] Post-Design Constitution Check: PASS (web app approach validated)
- [x] All NEEDS CLARIFICATION resolved (via Phase 0 research)
- [x] Complexity deviations documented (in Complexity Tracking section)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*