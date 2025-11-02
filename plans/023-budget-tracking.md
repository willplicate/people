# Feature 023: Budget Tracking

**Branch**: `023-budget-tracking`
**Status**: In Development
**Created**: 2025-11-02

## Overview
Shared expense tracking and budget analysis system for couples. Track spending by category, person, and whether expenses are shared or individual. Visualize spending patterns with interactive charts and calculate who owes whom at the end of each month.

## User Stories

### Core Functionality
- As a user, I want to quickly add expenses with category, amount, and whether it's shared or individual
- As a user, I want to see a pie chart of our spending by category
- As a user, I want to toggle categories on/off in the chart (e.g., exclude rent and taxes)
- As a user, I want to see total spending by category with breakdown by person
- As a user, I want to track expenses month-by-month
- As a user, I want to finalize months so historical data is locked

### Shared/Individual Tracking
- As a user, I want to mark expenses as shared or individual
- As a user, I want to see who paid for each expense
- As a user, I want to automatically calculate who owes whom for shared expenses
- As a user, I want to filter views by shared/individual/all expenses
- As a user, I want to see my individual spending vs shared spending

### Multi-User
- As a partner user, I want to access the same budget tracker
- As a partner user, I want to add my own expenses
- As a partner user, I want to see combined and individual spending

## Database Schema

### Tables

#### `expense_categories`
Predefined expense categories with display settings.

```sql
- id: uuid (PK)
- name: text (unique)
- color: text (hex color for charts)
- icon: text (optional emoji or icon name)
- is_excludable: boolean (can be toggled off in charts)
- sort_order: integer
- created_at: timestamp
```

**Initial Categories**:
- Groceries, Eating Out, Clothes, Utilities, Rent
- IVA (VAT), IFR (Income Tax), Flights, Hotels, Gifts, Public Transport
- Entertainment, Healthcare, Household Items, Subscriptions, Other

#### `budget_months`
Monthly periods for organizing and finalizing expenses.

```sql
- id: uuid (PK)
- year: integer
- month: integer (1-12)
- is_finalized: boolean (default false)
- finalized_at: timestamp (nullable)
- finalized_by: uuid (FK to auth.users, nullable)
- created_at: timestamp
- updated_at: timestamp

UNIQUE(year, month)
```

#### `expenses`
Individual expense records.

```sql
- id: uuid (PK)
- month_id: uuid (FK to budget_months)
- category_id: uuid (FK to expense_categories)
- amount: decimal(10,2)
- description: text
- expense_date: date
- paid_by_user_id: uuid (FK to auth.users)
- split_type: text ('individual', 'shared_50_50', 'custom')
- split_percentage: integer (nullable, for custom splits, 0-100)
- split_with_user_id: uuid (FK to auth.users, nullable)
- created_by: uuid (FK to auth.users)
- created_at: timestamp
- updated_at: timestamp
```

**Split Type Logic**:
- `individual` - Only paid_by_user owes full amount
- `shared_50_50` - Split evenly between paid_by_user and split_with_user
- `custom` - Use split_percentage (e.g., 60/40 split)

### Row Level Security (RLS)
- Users can only see/edit expenses they created or are involved in (paid_by or split_with)
- Both partners should have access to all shared household expenses
- Consider adding a `household_id` for multi-household support in future

## Key Features

### 1. Expense Entry Form
- Quick add modal/form
- Fields: Amount, Category (dropdown), Description, Date, Paid By, Split Type
- Smart defaults: Today's date, current user as paid_by
- Category autocomplete/quick select
- Conditional fields based on split_type

### 2. Expense List View
- Table showing all expenses for selected month
- Columns: Date, Description, Category, Amount, Paid By, Split Type, Actions
- Filtering: By category, by person, by split type
- Sorting: By date, amount, category
- Edit/Delete actions (only for non-finalized months)

### 3. Pie Chart Visualization
- Interactive chart using Recharts or similar
- Show spending by category
- Toggle switches to include/exclude categories
- Separate view toggles:
  - All expenses
  - Shared only
  - Individual only
  - By person
- Hover tooltips showing amount and percentage

### 4. Category Totals Summary
- Table view of totals by category
- Columns: Category, Total, Your Individual, Partner's Individual, Shared
- Grand totals row
- Percentage of total spending

### 5. Balance Calculator
- Clear summary showing net balance between partners
- Calculation logic:
  - Each shared expense: Amount ÷ 2 = what each person owes
  - If you paid $100 shared, partner owes you $50
  - Net all shared expenses to single balance
- Display: "You owe [Partner]: $X" or "[Partner] owes you: $X" or "Even"

### 6. Month Management
- Month selector (dropdown or calendar picker)
- Current month is default and editable
- "Finalize Month" button locks historical data
- Finalized months are read-only but viewable
- Confirmation dialog before finalizing

### 7. Budget Dashboard Page
- Overview cards: Total spent, Your individual, Partner's individual, Shared, Balance
- Pie chart section
- Category totals table
- Recent expenses list
- Month selector at top

## Technical Implementation

### Services Layer (`src/services/expenses.ts`)
```typescript
- createExpense(expense: ExpenseInput): Promise<Expense>
- getExpensesByMonth(monthId: string): Promise<Expense[]>
- updateExpense(id: string, updates: Partial<Expense>): Promise<Expense>
- deleteExpense(id: string): Promise<void>
- getOrCreateCurrentMonth(): Promise<BudgetMonth>
- finalizeMonth(monthId: string): Promise<BudgetMonth>
- calculateMonthlyBalance(monthId: string): Promise<Balance>
- getCategoryTotals(monthId: string, filters?: Filters): Promise<CategoryTotal[]>
```

### Components (`src/components/budget/`)
```
- ExpenseEntryForm.tsx - Add/edit expense modal
- ExpenseList.tsx - Table of expenses with filters
- ExpensePieChart.tsx - Interactive category pie chart
- CategoryTotalsTable.tsx - Summary by category
- BalanceSummary.tsx - Who owes whom display
- MonthSelector.tsx - Month picker with finalize option
- BudgetDashboard.tsx - Main page container
```

### Pages
- `/budget` - Main budget dashboard (src/pages/budget/index.tsx)

### Chart Library
- Recharts (already compatible with React/Next.js)
- Responsive, customizable, good TypeScript support

## Testing Strategy

Following TDD approach per CLAUDE.md:

### 1. Contract Tests (`tests/contract/expenses.test.ts`)
- Verify Supabase table schemas exist
- Verify RLS policies allow proper access
- Verify foreign key constraints
- Verify unique constraints

### 2. Integration Tests (`tests/integration/expenses.test.ts`)
- Create/read/update/delete expenses
- Month creation and finalization
- Balance calculations
- Category totals aggregation
- Filtering and sorting

### 3. Unit Tests
- Component rendering tests
- Form validation
- Chart data transformation
- Balance calculation logic

### 4. E2E Tests (`tests/e2e/budget.cy.ts`)
- Complete expense entry flow
- Month finalization workflow
- Chart interaction
- Multi-user scenarios

## UI/UX Considerations

### Design Principles
- Simple, clean interface
- Mobile-responsive (add expenses on the go)
- Quick entry (minimize clicks)
- Clear visual feedback
- Accessible color choices for charts

### Color Palette for Categories
Use colorblind-friendly palette:
- Groceries: Green (#10b981)
- Eating Out: Orange (#f97316)
- Utilities: Blue (#3b82f6)
- Rent: Purple (#8b5cf6)
- IVA/IFR: Red (#ef4444)
- Flights: Sky blue (#0ea5e9)
- Hotels: Indigo (#6366f1)
- Gifts: Pink (#ec4899)
- Transport: Yellow (#eab308)
- Other categories: Additional colors from Tailwind palette

### Responsive Breakpoints
- Mobile: Stacked layout, simpler chart
- Tablet: Two-column layout
- Desktop: Full dashboard with all components

## Performance Considerations
- Paginate expense list for months with 100+ expenses
- Cache category list (rarely changes)
- Debounce search/filter inputs
- Lazy load chart library
- Index on month_id, category_id, paid_by_user_id

## Future Enhancements (Not in Scope)
- Budget limits per category
- Recurring expenses (rent, subscriptions)
- Receipt photo uploads
- Export to CSV/PDF
- Budget vs actual comparison
- Trend analysis across months
- Mobile app
- Bank transaction import

## Migration Path
1. Create expense_categories table with seed data
2. Create budget_months table
3. Create expenses table with foreign keys
4. Set up RLS policies
5. Create indexes for performance

## Success Metrics
- Both partners actively use the system
- Monthly finalization happens consistently
- Clear understanding of spending patterns
- Reduced friction in expense splitting
- Historical data available for review

## Dependencies
- Recharts: `npm install recharts`
- Date utilities already available (date-fns or similar)
- Tailwind CSS (already in project)
- Supabase client (already configured)

## Timeline Estimate
- Phase 1 (Database + Core Services): 2-3 days
- Phase 2 (UI Components): 3-4 days
- Phase 3 (Testing): 2-3 days
- Phase 4 (Polish + Multi-user): 1-2 days

**Total**: ~8-12 days of development

---

## Notes
- Keep interface simple and fast
- Focus on mobile usability
- Ensure data privacy between households if system scales
- Consider adding household_id in future for multiple couples/roommates
