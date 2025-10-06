#!/usr/bin/env node

/**
 * DEFINITIVE FIX: Supabase PostgREST Schema Cache
 * 
 * This script performs a comprehensive cache refresh using multiple methods
 * to ensure both read and write caches are properly synchronized.
 * 
 * Methods used:
 * 1. NOTIFY pgrst command (PostgreSQL level)
 * 2. Direct table access verification
 * 3. Write operation testing
 * 4. Cache propagation waiting
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sdmjetiogbvgzqsvcuth.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkbWpldGlvZ2J2Z3pxc3ZjdXRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU1MDg4NywiZXhwIjoyMDc1MTI2ODg3fQ.AnIFEN2u59ME4ETrk7mCHwXjg34OXvnt4VAXlIJ-pfc';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

const TABLES = ['journeys', 'journey_events', 'donations', 'sms_logs', 'donor_profiles'];

// ============================================================================
// STEP 1: Send NOTIFY Command
// ============================================================================
async function sendNotifyCommand() {
  console.log('\n🔄 STEP 1: Sending NOTIFY pgrst command...');
  
  try {
    // Method 1: Try via RPC
    const { error: rpcError } = await supabase.rpc('exec_sql', {
      sql_query: "NOTIFY pgrst, 'reload schema';"
    });
    
    if (!rpcError) {
      console.log('✅ NOTIFY sent via RPC');
      return true;
    }
    
    // Method 2: Try direct SQL execution
    const { error: directError } = await supabase
      .from('_supabase_migrations')
      .select('*')
      .limit(0);
    
    if (!directError) {
      console.log('⚠️  RPC failed, but connection works. Manual NOTIFY needed.');
      console.log('\n📋 MANUAL ACTION REQUIRED:');
      console.log('   1. Go to Supabase Dashboard → SQL Editor');
      console.log('   2. Run this command:');
      console.log('      NOTIFY pgrst, \'reload schema\';');
      console.log('   3. Wait 10 seconds');
      console.log('   4. Re-run this script\n');
      return false;
    }
    
    console.log('❌ Could not send NOTIFY command');
    return false;
  } catch (error) {
    console.error('❌ Error sending NOTIFY:', error.message);
    return false;
  }
}

// ============================================================================
// STEP 2: Wait for Cache Propagation
// ============================================================================
async function waitForPropagation() {
  console.log('\n⏳ STEP 2: Waiting for cache propagation...');
  
  const delays = [2000, 3000, 5000]; // Progressive delays
  
  for (let i = 0; i < delays.length; i++) {
    await new Promise(resolve => setTimeout(resolve, delays[i]));
    console.log(`   ⏱️  ${(delays.slice(0, i + 1).reduce((a, b) => a + b, 0) / 1000)}s elapsed...`);
  }
  
  console.log('✅ Cache propagation wait complete (10s total)');
}

// ============================================================================
// STEP 3: Verify Read Operations
// ============================================================================
async function verifyReadOperations() {
  console.log('\n📖 STEP 3: Verifying READ operations...');
  
  const results = [];
  
  for (const table of TABLES) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`   ❌ ${table}: ${error.message}`);
        results.push({ table, read: false, error: error.message });
      } else {
        console.log(`   ✅ ${table}: Accessible (${count || 0} rows)`);
        results.push({ table, read: true, count: count || 0 });
      }
    } catch (err) {
      console.log(`   ❌ ${table}: ${err.message}`);
      results.push({ table, read: false, error: err.message });
    }
  }
  
  const allReadable = results.every(r => r.read);
  console.log(allReadable ? '✅ All tables readable' : '❌ Some tables not readable');
  
  return { results, allReadable };
}

// ============================================================================
// STEP 4: Verify Write Operations
// ============================================================================
async function verifyWriteOperations() {
  console.log('\n✍️  STEP 4: Verifying WRITE operations...');
  
  const testData = {
    journeys: {
      id: 'test-journey-cache-fix',
      type: 'general',
      status: 'active',
      current_stage: 1,
      donor_name: 'Cache Test',
      donor_phone: '+1234567890',
      amount: 100
    },
    journey_events: {
      journey_id: 'test-journey-cache-fix',
      stage: 1,
      stage_name: 'Test Stage',
      location: 'Test Location',
      lon: 31.2357,
      lat: 30.0444,
      status: 'pending'
    },
    donations: {
      amount: 100,
      status: 'pending'
    },
    sms_logs: {
      id: 'test-sms-cache-fix',
      to_phone: '+1234567890',
      body: 'Test SMS',
      status: 'queued',
      provider: 'mock'
    }
  };
  
  const results = [];
  
  // Test journeys first (required for journey_events FK)
  for (const table of ['journeys', 'journey_events', 'donations', 'sms_logs']) {
    try {
      const { data, error } = await supabase
        .from(table)
        .insert(testData[table])
        .select();
      
      if (error) {
        console.log(`   ❌ ${table}: ${error.message}`);
        results.push({ table, write: false, error: error.message });
      } else {
        console.log(`   ✅ ${table}: Writable`);
        results.push({ table, write: true });
        
        // Clean up test data
        if (table === 'journeys') {
          await supabase.from(table).delete().eq('id', testData[table].id);
        } else if (table === 'sms_logs') {
          await supabase.from(table).delete().eq('id', testData[table].id);
        } else {
          await supabase.from(table).delete().eq('id', data[0].id);
        }
      }
    } catch (err) {
      console.log(`   ❌ ${table}: ${err.message}`);
      results.push({ table, write: false, error: err.message });
    }
  }
  
  const allWritable = results.every(r => r.write);
  console.log(allWritable ? '✅ All tables writable' : '❌ Some tables not writable');
  
  return { results, allWritable };
}

// ============================================================================
// STEP 5: Generate Report
// ============================================================================
function generateReport(readResults, writeResults) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 CACHE FIX REPORT');
  console.log('='.repeat(80));
  
  console.log('\n📖 READ OPERATIONS:');
  readResults.results.forEach(r => {
    const status = r.read ? '✅ PASS' : '❌ FAIL';
    const detail = r.read ? `(${r.count} rows)` : `(${r.error})`;
    console.log(`   ${status} ${r.table.padEnd(20)} ${detail}`);
  });
  
  console.log('\n✍️  WRITE OPERATIONS:');
  writeResults.results.forEach(r => {
    const status = r.write ? '✅ PASS' : '❌ FAIL';
    const detail = r.write ? '' : `(${r.error})`;
    console.log(`   ${status} ${r.table.padEnd(20)} ${detail}`);
  });
  
  console.log('\n' + '='.repeat(80));
  
  const allPassed = readResults.allReadable && writeResults.allWritable;
  
  if (allPassed) {
    console.log('✅ SUCCESS: All operations working correctly!');
    console.log('\n🎉 Next Steps:');
    console.log('   1. Run: node test-complete-production-verification.mjs');
    console.log('   2. All tests should now pass');
    console.log('   3. Production deployment is unblocked');
  } else {
    console.log('❌ FAILED: Cache still not refreshed');
    console.log('\n🔧 Manual Fix Required:');
    console.log('   Option 1: Restart Supabase Project');
    console.log('      → Dashboard → Settings → General → Restart Project');
    console.log('      → Wait 2-3 minutes');
    console.log('      → Re-run this script');
    console.log('');
    console.log('   Option 2: Contact Supabase Support');
    console.log('      → Submit ticket with project ref: sdmjetiogbvgzqsvcuth');
    console.log('      → Request manual schema cache flush');
    console.log('      → Mention "PostgREST write cache stale after migration"');
  }
  
  console.log('='.repeat(80) + '\n');
  
  return allPassed;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================
async function main() {
  console.log('🚀 Supabase Cache Fix - Definitive Edition');
  console.log('='.repeat(80));
  
  try {
    // Step 1: Send NOTIFY
    const notifySent = await sendNotifyCommand();
    
    if (!notifySent) {
      console.log('\n⚠️  Cannot proceed without NOTIFY command');
      console.log('Please run the manual SQL command and re-run this script.');
      process.exit(1);
    }
    
    // Step 2: Wait for propagation
    await waitForPropagation();
    
    // Step 3: Verify reads
    const readResults = await verifyReadOperations();
    
    // Step 4: Verify writes
    const writeResults = await verifyWriteOperations();
    
    // Step 5: Generate report
    const success = generateReport(readResults, writeResults);
    
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

main();