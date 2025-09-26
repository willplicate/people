-- Add recipes table to support recipe storage
-- Run this in your Supabase SQL Editor

-- Create recipes table
CREATE TABLE IF NOT EXISTS personal_recipes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  ingredients TEXT NOT NULL, -- Store as formatted text with line breaks
  instructions TEXT,
  servings INTEGER,
  prep_time INTEGER, -- in minutes
  cook_time INTEGER, -- in minutes
  category VARCHAR(50), -- e.g., 'dessert', 'main', 'appetizer'
  difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_personal_recipes_category ON personal_recipes(category);
CREATE INDEX IF NOT EXISTS idx_personal_recipes_difficulty ON personal_recipes(difficulty);
CREATE INDEX IF NOT EXISTS idx_personal_recipes_rating ON personal_recipes(rating);
CREATE INDEX IF NOT EXISTS idx_personal_recipes_favorite ON personal_recipes(is_favorite);
CREATE INDEX IF NOT EXISTS idx_personal_recipes_tags ON personal_recipes USING GIN(tags);

-- Apply trigger for updated_at timestamp
DROP TRIGGER IF EXISTS update_personal_recipes_updated_at ON personal_recipes;
CREATE TRIGGER update_personal_recipes_updated_at
  BEFORE UPDATE ON personal_recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on recipes table
ALTER TABLE personal_recipes ENABLE ROW LEVEL SECURITY;

-- Create policy that allows all operations (single user)
DROP POLICY IF EXISTS "Allow all operations" ON personal_recipes;
CREATE POLICY "Allow all operations" ON personal_recipes FOR ALL USING (true);

-- Insert sample tiramisu recipe
INSERT INTO personal_recipes (title, description, ingredients, instructions, servings, prep_time, cook_time, category, difficulty, rating, notes) VALUES
('Classic Tiramisu', 'A traditional Italian dessert with layers of coffee-soaked ladyfingers and mascarpone cream',
'3 egg whites
6 egg yolks
3 + 3 tbsp sugar
8 oz mascarpone cheese at room temperature
1 cup freshly pulled espresso cooled to room temperature
2 tbsp amaretto or spiced rum
3-4 dozen ladyfingers storebought or homemade
cocoa powder for dusting',
'1. Separate eggs and beat egg whites with 3 tbsp sugar until stiff peaks form
2. In separate bowl, beat egg yolks with remaining 3 tbsp sugar until pale and thick
3. Gently fold mascarpone into egg yolk mixture
4. Fold in the beaten egg whites carefully to maintain lightness
5. Combine cooled espresso with amaretto in shallow dish
6. Quickly dip each ladyfinger in coffee mixture and layer in dish
7. Spread half the mascarpone mixture over ladyfingers
8. Repeat with another layer of dipped ladyfingers and remaining mascarpone
9. Cover and refrigerate for at least 4 hours or overnight
10. Before serving, dust with cocoa powder',
8, 30, 0, 'dessert', 'medium', 5, 'Best made a day ahead. Use room temperature mascarpone for smooth mixing.')
ON CONFLICT DO NOTHING;