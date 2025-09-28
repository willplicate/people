-- Check which tables exist and their structure
SELECT table_name, table_schema
FROM information_schema.tables
WHERE table_name LIKE 'personal_%'
ORDER BY table_name;

-- Check if all required tables exist
SELECT
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'personal_contacts')
    THEN '✅ personal_contacts'
    ELSE '❌ personal_contacts' END as contacts_table,

  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'personal_contact_info')
    THEN '✅ personal_contact_info'
    ELSE '❌ personal_contact_info' END as contact_info_table,

  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'personal_interactions')
    THEN '✅ personal_interactions'
    ELSE '❌ personal_interactions' END as interactions_table,

  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'personal_reminders')
    THEN '✅ personal_reminders'
    ELSE '❌ personal_reminders' END as reminders_table;