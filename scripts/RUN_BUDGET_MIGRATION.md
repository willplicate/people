# Run Budget Tracking Migration

## Instructions

1. **Open your Supabase project**
   - Go to [supabase.com](https://supabase.com)
   - Select your LinkedinCRM project (the same one used for Personal CRM)

2. **Navigate to SQL Editor**
   - In the left sidebar, click on "SQL Editor"
   - Click "New query"

3. **Copy and run the migration**
   - Open the file: `scripts/add-budget-tracking-schema.sql`
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click "Run" or press Cmd/Ctrl + Enter

4. **Verify the migration**
   Run this query to check that tables were created:
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('expense_categories', 'budget_months', 'expenses');
   ```

   You should see all three tables listed.

5. **Check that categories were seeded**
   ```sql
   SELECT name, color, icon FROM expense_categories ORDER BY sort_order;
   ```

   You should see all 16 categories (Groceries, Eating Out, etc.)

## Rollback (if needed)

If you need to rollback the migration:

```sql
-- Drop tables (cascades to related data)
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS budget_months CASCADE;
DROP TABLE IF EXISTS expense_categories CASCADE;

-- Drop the view
DROP VIEW IF EXISTS current_month_expenses;

-- Drop trigger functions
DROP FUNCTION IF EXISTS prevent_finalized_month_changes CASCADE;
DROP FUNCTION IF EXISTS update_expenses_updated_at CASCADE;
DROP FUNCTION IF EXISTS update_budget_months_updated_at CASCADE;
DROP FUNCTION IF EXISTS update_expense_categories_updated_at CASCADE;
```

## Next Steps

After successfully running the migration:
1. The TypeScript types will be created to match the database schema
2. Service layer functions will be implemented
3. UI components will be built
