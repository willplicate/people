// Simple script to verify database tables exist
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TABLES = {
  CONTACTS: 'personal_contacts',
  CONTACT_INFO: 'personal_contact_info',
  INTERACTIONS: 'personal_interactions',
  REMINDERS: 'personal_reminders'
};

async function verifyTables() {
  console.log('🔍 Verifying database tables...');
  
  for (const [name, table] of Object.entries(TABLES)) {
    try {
      const { error } = await supabase
        .from(table)
        .select('count(*)', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${name} (${table}): ${error.message}`);
      } else {
        console.log(`✅ ${name} (${table}): accessible`);
      }
    } catch (err) {
      console.log(`❌ ${name} (${table}): ${err.message}`);
    }
  }
}

verifyTables().then(() => {
  console.log('\n📊 Database verification complete');
  process.exit(0);
}).catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});