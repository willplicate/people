/**
 * Add budget tracking tables for expense management
 *
 * Features:
 * 1. Expense categories - predefined categories with display settings
 * 2. Budget months - monthly periods for organizing and finalizing expenses
 * 3. Expenses - individual expense records with shared/individual tracking
 * 4. Balance calculations - who owes whom for shared expenses
 */

-- ============================================================================
-- EXPENSE CATEGORIES TABLE
-- ============================================================================
-- Predefined expense categories with display settings
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Category details
  name VARCHAR(100) NOT NULL UNIQUE,
  color VARCHAR(7) NOT NULL, -- Hex color for charts (e.g., '#10b981')
  icon VARCHAR(50), -- Optional emoji or icon name

  -- Display settings
  is_excludable BOOLEAN DEFAULT false, -- Can be toggled off in charts (e.g., rent, taxes)
  sort_order INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expense_categories_sort ON expense_categories(sort_order);

-- ============================================================================
-- BUDGET MONTHS TABLE
-- ============================================================================
-- Monthly periods for organizing and finalizing expenses
CREATE TABLE IF NOT EXISTS budget_months (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Period
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),

  -- Finalization (locks historical data)
  is_finalized BOOLEAN DEFAULT false,
  finalized_at TIMESTAMPTZ,
  finalized_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(year, month)
);

CREATE INDEX idx_budget_months_period ON budget_months(year, month);
CREATE INDEX idx_budget_months_finalized ON budget_months(is_finalized);

-- ============================================================================
-- EXPENSES TABLE
-- ============================================================================
-- Individual expense records with shared/individual tracking
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Relationships
  month_id UUID NOT NULL REFERENCES budget_months(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES expense_categories(id) ON DELETE RESTRICT,

  -- Expense details
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  description TEXT,
  expense_date DATE NOT NULL,

  -- Payment tracking
  paid_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Shared/Individual tracking
  split_type VARCHAR(20) NOT NULL DEFAULT 'individual'
    CHECK (split_type IN ('individual', 'shared_50_50', 'custom')),
  split_percentage INTEGER CHECK (split_percentage >= 0 AND split_percentage <= 100), -- For custom splits
  split_with_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Who to split with

  -- Metadata
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expenses_month ON expenses(month_id);
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_paid_by ON expenses(paid_by_user_id);
CREATE INDEX idx_expenses_split_with ON expenses(split_with_user_id);

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_expense_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER expense_categories_updated_at
  BEFORE UPDATE ON expense_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_expense_categories_updated_at();

CREATE OR REPLACE FUNCTION update_budget_months_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER budget_months_updated_at
  BEFORE UPDATE ON budget_months
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_months_updated_at();

CREATE OR REPLACE FUNCTION update_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_expenses_updated_at();

-- ============================================================================
-- PREVENT EDITING FINALIZED MONTHS
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_finalized_month_changes()
RETURNS TRIGGER AS $$
DECLARE
  month_finalized BOOLEAN;
BEGIN
  -- Check if the month is finalized
  SELECT is_finalized INTO month_finalized
  FROM budget_months
  WHERE id = NEW.month_id;

  IF month_finalized THEN
    RAISE EXCEPTION 'Cannot modify expenses in a finalized month';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_expense_changes_finalized
  BEFORE INSERT OR UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION prevent_finalized_month_changes();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_months ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Expense Categories: All authenticated users can read, only admins can modify
CREATE POLICY "Authenticated users can view expense categories"
  ON expense_categories FOR SELECT
  TO authenticated
  USING (true);

-- For now, allow all authenticated users to insert/update categories
-- TODO: Restrict to admin users only
CREATE POLICY "Authenticated users can manage expense categories"
  ON expense_categories FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Budget Months: All authenticated users can view and create
CREATE POLICY "Authenticated users can view budget months"
  ON budget_months FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create budget months"
  ON budget_months FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update budget months"
  ON budget_months FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Expenses: Users can see expenses they're involved in (paid by them or split with them)
CREATE POLICY "Users can view their expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (
    paid_by_user_id = auth.uid() OR
    split_with_user_id = auth.uid() OR
    created_by = auth.uid()
  );

CREATE POLICY "Users can create expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    paid_by_user_id = auth.uid()
  )
  WITH CHECK (
    created_by = auth.uid() OR
    paid_by_user_id = auth.uid()
  );

CREATE POLICY "Users can delete their expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    paid_by_user_id = auth.uid()
  );

-- ============================================================================
-- SEED DATA - EXPENSE CATEGORIES
-- ============================================================================

INSERT INTO expense_categories (name, color, icon, is_excludable, sort_order) VALUES
  ('Groceries', '#10b981', '🛒', false, 1),
  ('Eating Out', '#f97316', '🍽️', false, 2),
  ('Clothes', '#ec4899', '👕', false, 3),
  ('Utilities', '#3b82f6', '💡', false, 4),
  ('Rent', '#8b5cf6', '🏠', true, 5),
  ('IVA', '#ef4444', '🧾', true, 6),
  ('IFR', '#dc2626', '📊', true, 7),
  ('Flights', '#0ea5e9', '✈️', false, 8),
  ('Hotels', '#6366f1', '🏨', false, 9),
  ('Gifts', '#f472b6', '🎁', false, 10),
  ('Public Transport', '#eab308', '🚇', false, 11),
  ('Entertainment', '#a855f7', '🎬', false, 12),
  ('Healthcare', '#14b8a6', '🏥', false, 13),
  ('Household Items', '#84cc16', '🧹', false, 14),
  ('Subscriptions', '#f59e0b', '📱', false, 15),
  ('Other', '#6b7280', '📦', false, 16)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- View for current month expenses with category and user details
CREATE OR REPLACE VIEW current_month_expenses AS
SELECT
  e.id,
  e.amount,
  e.description,
  e.expense_date,
  e.split_type,
  e.split_percentage,
  ec.name as category_name,
  ec.color as category_color,
  ec.icon as category_icon,
  paid_by.email as paid_by_email,
  split_with.email as split_with_email,
  e.created_at
FROM expenses e
JOIN expense_categories ec ON e.category_id = ec.id
JOIN auth.users paid_by ON e.paid_by_user_id = paid_by.id
LEFT JOIN auth.users split_with ON e.split_with_user_id = split_with.id
JOIN budget_months bm ON e.month_id = bm.id
WHERE bm.year = EXTRACT(YEAR FROM CURRENT_DATE)
  AND bm.month = EXTRACT(MONTH FROM CURRENT_DATE);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE expense_categories IS 'Predefined expense categories with display settings for charts';
COMMENT ON TABLE budget_months IS 'Monthly periods for organizing and finalizing expenses';
COMMENT ON TABLE expenses IS 'Individual expense records with shared/individual tracking';

COMMENT ON COLUMN expenses.split_type IS 'individual: only paid_by owes; shared_50_50: split evenly; custom: use split_percentage';
COMMENT ON COLUMN expenses.split_percentage IS 'For custom splits: percentage that paid_by_user owns (0-100)';
COMMENT ON COLUMN expense_categories.is_excludable IS 'Can be toggled off in pie charts (e.g., rent, taxes)';
