#!/usr/bin/env node

/**
 * Complete Schema Rebuild
 * Drops and recreates all tables with proper PostgREST configuration
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://sdmjetiogbvgzqsvcuth.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkbWpldGlvZ2J2Z3pxc3ZjdXRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU1MDg4NywiZXhwIjoyMDc1MTI2ODg3fQ.AnIFEN2u59ME4ETrk7mCHwXjg34OXvnt4VAXlIJ-pfc';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

console.log('🔨 Complete Schema Rebuild');
console.log('='.repeat(80));

async function executeSQLDirect(sql, description) {
  console.log(`\n📝 ${description}...`);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({ sql_query: sql })
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.log(`   ⚠️  ${description}: ${result.message || 'Failed'}`);
      return false;
    }
    
    console.log(`   ✅ ${description}: Success`);
    return true;
  } catch (error) {
    console.log(`   ❌ ${description}: ${error.message}`);
    return false;
  }
}

async function rebuildSchema() {
  console.log('\n🗑️  STEP 1: Drop existing tables (if any)');
  
  const dropStatements = [
    'DROP TABLE IF EXISTS journey_events CASCADE;',
    'DROP TABLE IF EXISTS journeys CASCADE;',
    'DROP TABLE IF EXISTS donations CASCADE;',
    'DROP TABLE IF EXISTS sms_logs CASCADE;',
    'DROP TABLE IF EXISTS donor_profiles CASCADE;',
    'DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;',
    'DROP FUNCTION IF EXISTS get_journey_progress(TEXT) CASCADE;',
    'DROP FUNCTION IF EXISTS update_donor_stats(UUID) CASCADE;',
    'DROP FUNCTION IF EXISTS trigger_update_donor_stats() CASCADE;',
    'DROP VIEW IF EXISTS active_journeys_summary CASCADE;',
    'DROP VIEW IF EXISTS donor_donation_stats CASCADE;'
  ];

  for (const sql of dropStatements) {
    await executeSQLDirect(sql, `Drop: ${sql.split(' ')[4]}`);
  }

  console.log('\n🏗️  STEP 2: Create tables from migration file');
  
  // Read the migration file
  const migrationSQL = readFileSync('./supabase/migrations/20250105_production_schema.sql', 'utf8');
  
  // Split into statements
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.includes('RAISE NOTICE'));

  console.log(`   Found ${statements.length} SQL statements\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    
    // Extract object name for logging
    const match = statement.match(/CREATE\s+(?:OR\s+REPLACE\s+)?(?:TABLE|FUNCTION|VIEW|TRIGGER|INDEX|POLICY|EXTENSION)\s+(?:IF\s+NOT\s+EXISTS\s+)?["']?(\w+)["']?/i);
    const objectName = match ? match[1] : `Statement ${i + 1}`;
    
    const success = await executeSQLDirect(statement, `Create ${objectName}`);
    if (success) successCount++;
    else failCount++;
  }

  console.log(`\n📊 Creation Results:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);

  console.log('\n🔄 STEP 3: Reload PostgREST schema cache');
  await executeSQLDirect("NOTIFY pgrst, 'reload schema';", 'Reload schema cache');
  
  console.log('\n⏳ Waiting 10 seconds for cache propagation...');
  await new Promise(resolve => setTimeout(resolve, 10000));

  console.log('\n✅ STEP 4: Verify tables');
  
  const tables = ['journeys', 'journey_events', 'donations', 'sms_logs', 'donor_profiles'];
  
  for (const table of tables) {
    // Test READ
    const { error: readError } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    // Test WRITE
    const testData = {
      journeys: { id: 'test-' + Date.now(), type: 'general', status: 'active', current_stage: 1, amount: 100 },
      donations: { amount: 100, status: 'pending' },
      sms_logs: { id: 'test-' + Date.now(), to_phone: '+1234567890', body: 'Test', status: 'queued', provider: 'mock' }
    };
    
    let writeError = null;
    if (testData[table]) {
      const { error } = await supabase.from(table).insert(testData[table]).select();
      writeError = error;
      
      // Cleanup
      if (!error) {
        if (table === 'journeys' || table === 'sms_logs') {
          await supabase.from(table).delete().eq('id', testData[table].id);
        }
      }
    }
    
    const readStatus = readError ? '❌' : '✅';
    const writeStatus = testData[table] ? (writeError ? '❌' : '✅') : '⏭️';
    
    console.log(`   ${table.padEnd(20)} READ: ${readStatus}  WRITE: ${writeStatus}`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('🎉 Schema rebuild complete!');
  console.log('\nNext steps:');
  console.log('   1. Run: node test-cache-status-now.mjs');
  console.log('   2. Run: node test-complete-production-verification.mjs');
  console.log('='.repeat(80) + '\n');
}

rebuildSchema().catch(console.error);