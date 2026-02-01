#!/usr/bin/env node

// Simple script to add strategy grouping columns via Supabase SQL editor
// Run this script with: node scripts/add-grouping-columns.js

const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

console.log('📦 Strategy Grouping Migration')
console.log('================================\n')
console.log('Please run the following SQL in your Supabase SQL Editor:\n')
console.log('Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new\n')
console.log('Copy and paste this SQL:\n')
console.log('```sql')

const sql = `-- Add strategy grouping to options_trades
ALTER TABLE options_trades
ADD COLUMN IF NOT EXISTS strategy_group_id UUID;

ALTER TABLE options_trades
ADD COLUMN IF NOT EXISTS strategy_name VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_options_trades_group
ON options_trades(strategy_group_id);
`

console.log(sql)
console.log('```\n')

rl.question('Press Enter after you have run the SQL in Supabase... ', () => {
  console.log('\n✅ Great! The migration should now be complete.')
  console.log('   Added columns: strategy_group_id, strategy_name')
  console.log('   Added index: idx_options_trades_group\n')
  rl.close()
})
