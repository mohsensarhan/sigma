/**
 * Refresh Supabase Schema Cache
 * Forces PostgREST to reload its schema cache by querying tables
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sdmjetiogbvgzqsvcuth.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkbWpldGlvZ2J2Z3pxc3ZjdXRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU1MDg4NywiZXhwIjoyMDc1MTI2ODg3fQ.AnIFEN2u59ME4ETrk7mCHwXjg34OXvnt4VAXlIJ-pfc';

const TABLES = ['journeys', 'journey_events', 'donations', 'sms_logs', 'donor_profiles'];

async function refreshSchemaCache() {
  console.log('🔄 Refreshing Supabase Schema Cache...\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  const results = {
    success: [],
    failed: []
  };
  
  for (const table of TABLES) {
    try {
      console.log(`📋 Testing table: ${table}`);
      
      // Query the table to trigger cache refresh
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`   ❌ FAILED: ${error.message}`);
        results.failed.push({ table, error: error.message });
      } else {
        console.log(`   ✅ SUCCESS: Table accessible (${count || 0} rows)`);
        results.success.push({ table, rowCount: count || 0 });
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      results.failed.push({ table, error: error.message });
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 SCHEMA CACHE REFRESH SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${results.success.length}/${TABLES.length}`);
  console.log(`❌ Failed: ${results.failed.length}/${TABLES.length}`);
  
  if (results.success.length > 0) {
    console.log('\n✅ Accessible Tables:');
    results.success.forEach(({ table, rowCount }) => {
      console.log(`   • ${table}: ${rowCount} rows`);
    });
  }
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed Tables:');
    results.failed.forEach(({ table, error }) => {
      console.log(`   • ${table}: ${error}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (results.failed.length === 0) {
    console.log('🎉 All tables are now accessible!');
    return true;
  } else {
    console.log('⚠️  Some tables are still inaccessible. Check database schema.');
    return false;
  }
}

// Run the refresh
refreshSchemaCache()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });