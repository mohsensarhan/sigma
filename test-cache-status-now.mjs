#!/usr/bin/env node

/**
 * Test Current Supabase Cache Status
 * Tests both read and write operations to diagnose cache state
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sdmjetiogbvgzqsvcuth.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkbWpldGlvZ2J2Z3pxc3ZjdXRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU1MDg4NywiZXhwIjoyMDc1MTI2ODg3fQ.AnIFEN2u59ME4ETrk7mCHwXjg34OXvnt4VAXlIJ-pfc';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

const TABLES = ['journeys', 'journey_events', 'donations', 'sms_logs', 'donor_profiles'];

console.log('🔍 Testing Supabase Cache Status\n');
console.log('='.repeat(80));

// Test READ operations
console.log('\n📖 READ OPERATIONS:');
for (const table of TABLES) {
  try {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`   ❌ ${table.padEnd(20)} FAIL: ${error.message}`);
    } else {
      console.log(`   ✅ ${table.padEnd(20)} OK (${count || 0} rows)`);
    }
  } catch (err) {
    console.log(`   ❌ ${table.padEnd(20)} ERROR: ${err.message}`);
  }
}

// Test WRITE operations
console.log('\n✍️  WRITE OPERATIONS:');

const testData = {
  journeys: {
    id: 'test-cache-' + Date.now(),
    type: 'general',
    status: 'active',
    current_stage: 1,
    donor_name: 'Test',
    amount: 100
  },
  journey_events: null, // Skip (needs FK)
  donations: {
    amount: 100,
    status: 'pending'
  },
  sms_logs: {
    id: 'test-sms-' + Date.now(),
    to_phone: '+1234567890',
    body: 'Test',
    status: 'queued',
    provider: 'mock'
  },
  donor_profiles: null // Skip (needs auth user)
};

for (const table of TABLES) {
  if (!testData[table]) {
    console.log(`   ⏭️  ${table.padEnd(20)} SKIPPED (requires FK/auth)`);
    continue;
  }
  
  try {
    const { data, error } = await supabase
      .from(table)
      .insert(testData[table])
      .select();
    
    if (error) {
      console.log(`   ❌ ${table.padEnd(20)} FAIL: ${error.message}`);
    } else {
      console.log(`   ✅ ${table.padEnd(20)} OK (inserted & cleaned up)`);
      
      // Clean up
      if (table === 'journeys') {
        await supabase.from(table).delete().eq('id', testData[table].id);
      } else if (table === 'sms_logs') {
        await supabase.from(table).delete().eq('id', testData[table].id);
      } else {
        await supabase.from(table).delete().eq('id', data[0].id);
      }
    }
  } catch (err) {
    console.log(`   ❌ ${table.padEnd(20)} ERROR: ${err.message}`);
  }
}

console.log('\n' + '='.repeat(80));
console.log('\n📊 DIAGNOSIS:');
console.log('   If READ = ✅ and WRITE = ❌ → PostgREST write cache is stale');
console.log('   If READ = ❌ and WRITE = ❌ → Tables do not exist');
console.log('   If READ = ✅ and WRITE = ✅ → Everything works! 🎉');

console.log('\n🔧 SOLUTIONS:');
console.log('   1. Go to Supabase Dashboard → SQL Editor');
console.log('   2. Run: NOTIFY pgrst, \'reload schema\';');
console.log('   3. Wait 10 seconds');
console.log('   4. Re-run this script');
console.log('\n   OR');
console.log('\n   1. Dashboard → Settings → General → Restart Project');
console.log('   2. Wait 2-3 minutes');
console.log('   3. Re-run this script');
console.log('\n' + '='.repeat(80) + '\n');