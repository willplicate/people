const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function addChristmasListColumn() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  console.log('Adding christmas_list column to contacts table...')

  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      -- Check if column exists first
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'contacts'
          AND column_name = 'christmas_list'
        ) THEN
          ALTER TABLE contacts ADD COLUMN christmas_list BOOLEAN DEFAULT false;
          RAISE NOTICE 'Added christmas_list column to contacts table';
        ELSE
          RAISE NOTICE 'christmas_list column already exists';
        END IF;
      END $$;
    `
  })

  if (error) {
    console.error('Error adding column:', error)
    process.exit(1)
  }

  console.log('Successfully added christmas_list column!')
  process.exit(0)
}

addChristmasListColumn()