-- Add budget limit columns to budget_months and category budgets

-- Add global budget limit to budget_months table
ALTER TABLE budget_months
ADD COLUMN IF NOT EXISTS total_budget DECIMAL(10,2) DEFAULT NULL;

COMMENT ON COLUMN budget_months.total_budget IS 'Total monthly budget limit in euros. NULL means no limit set.';

-- Create table for per-category budget limits (optional, set later)
CREATE TABLE IF NOT EXISTS category_budgets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Relationships
  month_id UUID NOT NULL REFERENCES budget_months(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES expense_categories(id) ON DELETE CASCADE,

  -- Budget limit
  budget_limit DECIMAL(10,2) NOT NULL CHECK (budget_limit >= 0),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(month_id, category_id)
);

CREATE INDEX idx_category_budgets_month ON category_budgets(month_id);
CREATE INDEX idx_category_budgets_category ON category_budgets(category_id);

-- Update trigger for category_budgets
CREATE OR REPLACE FUNCTION update_category_budgets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER category_budgets_updated_at
  BEFORE UPDATE ON category_budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_category_budgets_updated_at();

-- Disable RLS for category_budgets (like other budget tables)
ALTER TABLE category_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_budgets DISABLE ROW LEVEL SECURITY;

-- Comments
COMMENT ON TABLE category_budgets IS 'Optional per-category budget limits for specific months';
COMMENT ON COLUMN category_budgets.budget_limit IS 'Maximum amount to spend in this category for this month';

-- Verify the changes
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'budget_months'
  AND column_name = 'total_budget';

SELECT * FROM category_budgets LIMIT 0;  -- Just to verify table exists
