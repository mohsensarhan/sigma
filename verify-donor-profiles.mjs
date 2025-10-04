/**
 * Verify donor_profiles Table Exists in Supabase
 * Checks if Phase 1 database schema has been deployed
 */

import { createClient } from '@supabase/supabase-js';

// Use hardcoded values for verification (from .env file)
const supabaseUrl = 'https://sdmjetiogbvgzqsvcuth.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkbWpldGlvZ2J2Z3pxc3ZjdXRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NTA4ODcsImV4cCI6MjA3NTEyNjg4N30.EKAt4imuEHXdhNsnVTkp2JWnX09jPXXD96WZeE9GyGY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 Verifying donor_profiles table in Supabase...\n');

async function verifyDonorProfilesTable() {
  try {
    // Try to query the donor_profiles table
    const { data, error, count } = await supabase
      .from('donor_profiles')
      .select('*', { count: 'exact', head: true });

    if (error) {
      if (error.code === '42P01') {
        // Table doesn't exist
        console.log('❌ donor_profiles table DOES NOT EXIST');
        console.log('\n📋 Action Required:');
        console.log('   1. Open Supabase SQL Editor');
        console.log('   2. Run supabase-schema.sql');
        console.log('   3. Re-run this verification script\n');
        return false;
      } else {
        console.error('❌ Error querying donor_profiles:', error.message);
        return false;
      }
    }

    console.log('✅ donor_profiles table EXISTS');
    console.log(`   Row count: ${count || 0}`);

    // Check RLS policies
    console.log('\n🔒 Checking RLS policies...');

    // Try to check policies (this might fail with anon key, which is expected)
    const { data: policies, error: policyError } = await supabase
      .rpc('pg_get_policies', { table_name: 'donor_profiles' })
      .select();

    if (policyError) {
      console.log('⚠️  Cannot verify RLS policies with anon key (expected)');
      console.log('   RLS policies should be verified in Supabase Dashboard');
    } else if (policies && policies.length > 0) {
      console.log(`✅ Found ${policies.length} RLS policies`);
    }

    console.log('\n✅ donor_profiles table is ready for use!');
    return true;

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    return false;
  }
}

async function main() {
  const exists = await verifyDonorProfilesTable();

  if (!exists) {
    console.log('\n🔧 Next Step: Deploy supabase-schema.sql to create the table');
    process.exit(1);
  }

  process.exit(0);
}

main();
