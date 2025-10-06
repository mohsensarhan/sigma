/**
 * Diagnose Write Issue
 * Check table permissions and RLS policies
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Diagnosing Write Issue');
console.log('=' .repeat(80));

async function checkTableStructure() {
  console.log('\n📋 Test 1: Check Table Structure via pg_catalog');
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  
  // Try to query pg_tables directly
  const { data, error } = await supabase
    .from('pg_tables')
    .select('*')
    .eq('schemaname', 'public')
    .eq('tablename', 'journeys');
  
  if (error) {
    console.log('❌ Cannot query pg_tables:', error.message);
  } else {
    console.log('✅ Table structure:', data);
  }
}

async function checkRLSPolicies() {
  console.log('\n📋 Test 2: Check RLS Policies');
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  
  const { data, error } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'journeys');
  
  if (error) {
    console.log('❌ Cannot query pg_policies:', error.message);
  } else {
    console.log('✅ RLS Policies:', data);
  }
}

async function tryDirectInsert() {
  console.log('\n📋 Test 3: Try Direct Insert with Minimal Data');
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    db: { schema: 'public' },
    auth: { persistSession: false }
  });
  
  const testData = {
    id: 'TEST-' + Date.now(),
    donor_id: 'test',
    tracking_id: 'test',
    status: 'active',
    current_stage: 1
  };
  
  console.log('  Attempting insert...');
  const { data, error } = await supabase
    .from('journeys')
    .insert(testData);
  
  if (error) {
    console.log('  ❌ Insert failed:', error.message);
    console.log('  Error details:', JSON.stringify(error, null, 2));
    return false;
  } else {
    console.log('  ✅ Insert succeeded!');
    // Clean up
    await supabase.from('journeys').delete().eq('id', testData.id);
    return true;
  }
}

async function tryUpsert() {
  console.log('\n📋 Test 4: Try Upsert Operation');
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  
  const testData = {
    id: 'TEST-UPSERT-' + Date.now(),
    donor_id: 'test',
    tracking_id: 'test',
    status: 'active',
    current_stage: 1
  };
  
  console.log('  Attempting upsert...');
  const { data, error } = await supabase
    .from('journeys')
    .upsert(testData);
  
  if (error) {
    console.log('  ❌ Upsert failed:', error.message);
    return false;
  } else {
    console.log('  ✅ Upsert succeeded!');
    // Clean up
    await supabase.from('journeys').delete().eq('id', testData.id);
    return true;
  }
}

async function checkPostgRESTVersion() {
  console.log('\n📋 Test 5: Check PostgREST Version');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      }
    });
    
    const version = response.headers.get('server');
    console.log('  PostgREST Version:', version || 'Unknown');
    
    // Check if schema cache header is present
    const cacheStatus = response.headers.get('x-postgrest-schema-cache');
    console.log('  Schema Cache Status:', cacheStatus || 'Not reported');
    
  } catch (error) {
    console.log('  ❌ Cannot check version:', error.message);
  }
}

async function main() {
  try {
    await checkTableStructure();
    await checkRLSPolicies();
    const insertOk = await tryDirectInsert();
    const upsertOk = await tryUpsert();
    await checkPostgRESTVersion();
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 DIAGNOSIS RESULTS');
    console.log('='.repeat(80));
    console.log(`Direct Insert: ${insertOk ? '✅ WORKS' : '❌ FAILS'}`);
    console.log(`Upsert: ${upsertOk ? '✅ WORKS' : '❌ FAILS'}`);
    
    if (!insertOk && !upsertOk) {
      console.log('\n🔍 ROOT CAUSE ANALYSIS:');
      console.log('The schema cache is still stale for write operations.');
      console.log('\n💡 POSSIBLE SOLUTIONS:');
      console.log('1. Wait 5-10 minutes for automatic cache refresh');
      console.log('2. Contact Supabase support to manually flush cache');
      console.log('3. Recreate tables using Supabase Dashboard SQL Editor');
      console.log('4. Use Supabase CLI to apply migrations (recommended)');
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
  }
}

main();