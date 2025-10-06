/**
 * Check What Tables Actually Exist
 * Query tables that PostgREST can actually see
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs/promises';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Checking What Tables Actually Exist');
console.log('=' .repeat(80));

async function checkKnownTables() {
  console.log('\n📋 Test 1: Check Known Tables');
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  
  const knownTables = [
    'governorates',
    'programs', 
    'journeys',
    'journey_events',
    'donations',
    'sms_logs',
    'donor_profiles'
  ];
  
  for (const table of knownTables) {
    const { data, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`❌ ${table}: ${error.message}`);
    } else {
      console.log(`✅ ${table}: EXISTS (${data?.length || 0} records)`);
    }
  }
}

async function tryToCreateTable() {
  console.log('\n📋 Test 2: Try to Create journeys Table via SQL Editor');
  console.log('Reading migration file...');
  
  try {
    const migrationSQL = await fs.readFile('supabase/migrations/20250105_production_schema.sql', 'utf8');
    
    // Extract just the journeys table creation
    const journeysTableMatch = migrationSQL.match(/CREATE TABLE IF NOT EXISTS public\.journeys[\s\S]*?;/);
    
    if (journeysTableMatch) {
      const createTableSQL = journeysTableMatch[0];
      console.log('\n📝 SQL to create journeys table:');
      console.log('─'.repeat(80));
      console.log(createTableSQL);
      console.log('─'.repeat(80));
      
      console.log('\n💡 ACTION REQUIRED:');
      console.log('1. Go to: https://supabase.com/dashboard/project/sdmjetiogbvgzqsvcuth/sql/new');
      console.log('2. Copy the SQL above');
      console.log('3. Paste it into the SQL Editor');
      console.log('4. Click "Run" button');
      console.log('5. Wait for success message');
      console.log('6. Then run: node verify-schema-cache-fix.mjs');
    }
  } catch (error) {
    console.log('❌ Could not read migration file:', error.message);
  }
}

async function checkMigrationStatus() {
  console.log('\n📋 Test 3: Check if Migration Was Applied');
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  
  // Try to query the migrations table
  const { data, error } = await supabase
    .from('schema_migrations')
    .select('*');
  
  if (error) {
    console.log('❌ Cannot query schema_migrations:', error.message);
    console.log('   This suggests migrations were never applied');
  } else {
    console.log('✅ Migrations table exists');
    console.log('   Applied migrations:', data);
  }
}

async function main() {
  await checkKnownTables();
  await checkMigrationStatus();
  await tryToCreateTable();
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  console.log('The tables (journeys, journey_events, donations, sms_logs, donor_profiles)');
  console.log('do NOT exist in the database.');
  console.log('\nThe migration file was never successfully applied.');
  console.log('\n🔧 SOLUTION:');
  console.log('Apply the migration using the Supabase Dashboard SQL Editor');
  console.log('(See instructions above)');
}

main();