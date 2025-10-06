/**
 * Verify Schema Cache Fix
 * Simple test to confirm all Supabase tables are accessible
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Verifying Schema Cache Fix');
console.log('=' .repeat(80));

async function verifyWithServiceRole() {
  console.log('\n📋 Test 1: Service Role Access');
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  
  const tables = ['journeys', 'journey_events', 'donations', 'sms_logs', 'donor_profiles'];
  let allAccessible = true;
  
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`❌ ${table}: ${error.message}`);
      allAccessible = false;
    } else {
      console.log(`✅ ${table}: Accessible (${data?.length || 0} records)`);
    }
  }
  
  return allAccessible;
}

async function verifyWithAnonKey() {
  console.log('\n📋 Test 2: Anonymous Key Access (Browser Client)');
  const supabase = createClient(SUPABASE_URL, ANON_KEY);
  
  const tables = ['journeys', 'journey_events', 'donations', 'sms_logs', 'donor_profiles'];
  let allAccessible = true;
  
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`❌ ${table}: ${error.message}`);
      allAccessible = false;
    } else {
      console.log(`✅ ${table}: Accessible (${data?.length || 0} records)`);
    }
  }
  
  return allAccessible;
}

async function testDataPersistence() {
  console.log('\n📋 Test 3: Data Persistence');
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  
  // Create test journey
  const testJourney = {
    id: 'TEST-VERIFY-' + Date.now(),
    donor_id: 'test-donor',
    tracking_id: 'TEST-' + Date.now(),
    status: 'active',
    current_stage: 1,
    waypoints: [],
    created_at: new Date().toISOString()
  };
  
  console.log('  Creating test journey...');
  const { data: insertData, error: insertError } = await supabase
    .from('journeys')
    .insert(testJourney)
    .select()
    .single();
  
  if (insertError) {
    console.log(`  ❌ Insert failed: ${insertError.message}`);
    return false;
  }
  
  console.log('  ✅ Journey created:', insertData.id);
  
  // Verify it can be read back
  console.log('  Reading back journey...');
  const { data: readData, error: readError } = await supabase
    .from('journeys')
    .select('*')
    .eq('id', testJourney.id)
    .single();
  
  if (readError) {
    console.log(`  ❌ Read failed: ${readError.message}`);
    return false;
  }
  
  console.log('  ✅ Journey read back:', readData.id);
  
  // Clean up
  console.log('  Cleaning up test data...');
  await supabase.from('journeys').delete().eq('id', testJourney.id);
  console.log('  ✅ Test data cleaned up');
  
  return true;
}

async function main() {
  try {
    const serviceRoleOk = await verifyWithServiceRole();
    const anonKeyOk = await verifyWithAnonKey();
    const persistenceOk = await testDataPersistence();
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 VERIFICATION RESULTS');
    console.log('='.repeat(80));
    console.log(`Service Role Access: ${serviceRoleOk ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Anonymous Key Access: ${anonKeyOk ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Data Persistence: ${persistenceOk ? '✅ PASS' : '❌ FAIL'}`);
    
    if (serviceRoleOk && anonKeyOk && persistenceOk) {
      console.log('\n🎉 SUCCESS! Schema cache is fixed!');
      console.log('\n✅ All Supabase tables are accessible');
      console.log('✅ Data can be written and read');
      console.log('✅ Browser client will work correctly');
      
      console.log('\n📋 Next Steps:');
      console.log('1. Restart dev server: Ctrl+C then npm run dev');
      console.log('2. Hard refresh browser: Ctrl+F5');
      console.log('3. Test the application manually');
      
      process.exit(0);
    } else {
      console.log('\n❌ FAILED: Some tests did not pass');
      console.log('Please check the errors above');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

main();