// Script to import wedding invites from CSV to Supabase
// Run with: node import-wedding-invites.js

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://tdclhoimzksmqmnsaccw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkY2xob2ltemtzbXFtbnNhY2N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NzAxMjUsImV4cCI6MjA3MjI0NjEyNX0.lkxHRLuT4liiDJWt4AnSk24rFY5E3sceyApZ7kVTGL4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Parse CSV
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  if (lines.length === 0) return [];

  // Parse header
  const headers = lines[0].split(',').map(h => h.trim());

  // Parse rows
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || null;
    });

    // Skip empty rows
    if (!row['Name'] || row['Name'] === '') continue;

    data.push(row);
  }

  return data;
}

// Map CSV data to database format
function mapToDatabase(csvData) {
  return csvData.map(row => {
    // Map "Awaiting response" to "Not contacted" as default
    let inviteStatus = 'Not contacted';
    if (row['RSVP status']) {
      const status = row['RSVP status'].trim();
      if (status === 'Awaiting response') {
        inviteStatus = 'Not contacted';
      } else if (status) {
        inviteStatus = status;
      }
    }

    return {
      name: row['Name'],
      address: row['Address'] || null,
      category: row['Category'] || null,
      likeliness_to_come: row['Likeliness to come'] ? parseInt(row['Likeliness to come']) : null,
      invite_status: inviteStatus,
      notes: row['Notes'] || null
    };
  });
}

async function importData() {
  try {
    console.log('Reading CSV file...');
    const csvPath = '../wedding-rsvp/Wedding Guests  - Sheet2.csv';
    const csvData = parseCSV(csvPath);
    console.log(`Found ${csvData.length} rows in CSV`);

    console.log('\nMapping data to database format...');
    const dbData = mapToDatabase(csvData);
    console.log(`Mapped ${dbData.length} valid records`);

    console.log('\nInserting data into Supabase...');
    const { data, error } = await supabase
      .from('wedding_invites')
      .insert(dbData)
      .select();

    if (error) {
      console.error('Error inserting data:', error);
      return;
    }

    console.log(`\n✅ Successfully imported ${data.length} wedding invites!`);

    // Show summary by category
    const categories = {};
    data.forEach(invite => {
      const cat = invite.category || 'Uncategorized';
      categories[cat] = (categories[cat] || 0) + 1;
    });

    console.log('\nBreakdown by category:');
    Object.entries(categories).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run import
importData();