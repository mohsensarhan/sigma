/**
 * Verify Supabase Schema Cache is Ready
 * Run this after manually refreshing the schema cache
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sdmjetiogbvgzqsvcuth.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkbWpldGlvZ2J2Z3pxc3ZjdXRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU1MDg4NywiZXhwIjoyMDc1MTI2ODg3fQ.AnIFEN2u59ME4ETrk7mCHwXjg34OXvnt4VAXlIJ-pfc';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const tables = ['journeys', 'journey_events', 'donations', 'sms_logs', 'donor_profiles'];

async function verifyTable(tableName) {
  try {
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`❌ ${tableName}: ${error.message}`);
      return false;
    }
    
    console.log(`✅ ${tableName}: Accessible (${count || 0} rows)`);
    return true;
  } catch (error) {
    console.log(`❌ ${tableName}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🔍 Verifying Supabase Schema Cache...\n');
  console.log(`📍 Project: ${SUPABASE_URL}\n`);
  
  const results = await Promise.all(tables.map(verifyTable));
  const allPassed = results.every(r => r);
  
  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('✅ ALL TABLES ACCESSIBLE - Schema cache is ready!');
    console.log('🚀 You can now run: node test-complete-production-verification.mjs');
  } else {
    console.log('❌ Some tables still not accessible');
    console.log('⏳ Please refresh schema cache in Supabase dashboard:');
    console.log('   1. Go to: https://sdmjetiogbvgzqsvcuth.supabase.co');
    console.log('   2. Settings → API');
    console.log('   3. Click "Reload schema cache"');
    console.log('   4. Wait 30 seconds');
    console.log('   5. Run this script again: node verify-supabase-schema.mjs');
  }
  console.log('='.repeat(60));
}

main().catch(console.error);