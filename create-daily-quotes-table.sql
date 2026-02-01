-- Create daily quotes table for inspirational messages and memories
CREATE TABLE IF NOT EXISTS personal_daily_quotes (
  id BIGSERIAL PRIMARY KEY,
  quote_text TEXT NOT NULL,
  author VARCHAR(255),
  image_url TEXT,
  date_assigned DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on date_assigned for efficient daily quote lookups
CREATE INDEX IF NOT EXISTS idx_daily_quotes_date_assigned ON personal_daily_quotes(date_assigned);
CREATE INDEX IF NOT EXISTS idx_daily_quotes_is_active ON personal_daily_quotes(is_active);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_daily_quotes_updated_at ON personal_daily_quotes;
CREATE TRIGGER update_daily_quotes_updated_at
  BEFORE UPDATE ON personal_daily_quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE personal_daily_quotes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now (can be restricted later based on auth)
CREATE POLICY "Enable all access for daily quotes" ON personal_daily_quotes
  FOR ALL USING (true);

-- Seed with some initial inspirational quotes
INSERT INTO personal_daily_quotes (quote_text, author, is_active) VALUES
  ('The best way to predict the future is to create it.', 'Peter Drucker', true),
  ('Quality is not an act, it is a habit.', 'Aristotle', true),
  ('The only way to do great work is to love what you do.', 'Steve Jobs', true),
  ('Life is 10% what happens to you and 90% how you react to it.', 'Charles R. Swindoll', true),
  ('The future belongs to those who believe in the beauty of their dreams.', 'Eleanor Roosevelt', true),
  ('It is during our darkest moments that we must focus to see the light.', 'Aristotle', true),
  ('Believe you can and you''re halfway there.', 'Theodore Roosevelt', true),
  ('The only impossible journey is the one you never begin.', 'Tony Robbins', true),
  ('Success is not final, failure is not fatal: it is the courage to continue that counts.', 'Winston Churchill', true),
  ('You are never too old to set another goal or to dream a new dream.', 'C.S. Lewis', true),
  ('The way to get started is to quit talking and begin doing.', 'Walt Disney', true),
  ('Don''t watch the clock; do what it does. Keep going.', 'Sam Levenson', true),
  ('The secret of getting ahead is getting started.', 'Mark Twain', true),
  ('It always seems impossible until it''s done.', 'Nelson Mandela', true),
  ('What you get by achieving your goals is not as important as what you become by achieving your goals.', 'Zig Ziglar', true),
  ('Act as if what you do makes a difference. It does.', 'William James', true),
  ('Success usually comes to those who are too busy to be looking for it.', 'Henry David Thoreau', true),
  ('The harder you work for something, the greater you''ll feel when you achieve it.', 'Unknown', true),
  ('Don''t be pushed around by the fears in your mind. Be led by the dreams in your heart.', 'Roy T. Bennett', true),
  ('Dream bigger. Do bigger.', 'Unknown', true),
  ('Everything you''ve ever wanted is on the other side of fear.', 'George Addair', true),
  ('Hardships often prepare ordinary people for an extraordinary destiny.', 'C.S. Lewis', true),
  ('Your limitation—it''s only your imagination.', 'Unknown', true),
  ('Great things never come from comfort zones.', 'Unknown', true),
  ('Wake up with determination. Go to bed with satisfaction.', 'Unknown', true),
  ('Do something today that your future self will thank you for.', 'Unknown', true),
  ('Little things make big days.', 'Unknown', true),
  ('The difference between ordinary and extraordinary is that little extra.', 'Jimmy Johnson', true),
  ('You don''t have to be great to start, but you have to start to be great.', 'Zig Ziglar', true),
  ('If you are not willing to risk the usual, you will have to settle for the ordinary.', 'Jim Rohn', true);
